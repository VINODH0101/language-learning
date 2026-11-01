/**
 * Lexilume Reusable Exercise Engine
 * 
 * Provides deterministic answer evaluation, Unicode NFC normalization,
 * accent-tolerant checks, distractor diagnostics, and unified telemetry logging.
 * Mirrors the enterprise Python checker engine in engine/exercises/checker.py.
 */

import { Language, ExerciseAttempt, MistakeCategory } from '../../../types';
import { ExerciseValidationResult } from '../types';
import { StorageService } from '../../../services/storage';
import { activityService } from '../../../services/activityService';
import { logMistake } from '../../../services/localDb';

export class StringNormalizer {
  // Punctuation to strip from ends (multilingual quotes, inverted marks, etc.)
  private static readonly PUNCTUATION_OUTER_REGEX = /^[¿¡"«»“”'\s]+|[¿¡!?,.;:"«»“”'\s]+$/g;

  /**
   * Standard clean: trimmed, lowercase, normalized whitespace, and Unicode NFC.
   */
  public static clean(text: string): string {
    if (!text) return '';
    // Canonical composition
    const normalized = text.trim().normalize('NFC').toLowerCase();
    // Strip external punctuation & quotes
    const stripped = normalized.replace(this.PUNCTUATION_OUTER_REGEX, '');
    // Collapse multi-spaces to single space
    return stripped.replace(/\s+/g, ' ').trim();
  }

  /**
   * Removes diacritics/accents for accent-tolerant matching (NFKD).
   */
  public static removeAccents(text: string): string {
    if (!text) return '';
    return text
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  /**
   * Determines if candidate answer matches any of the acceptable answers.
   */
  public static matches(
    candidate: string,
    acceptableAnswers: string[],
    strictAccents = true
  ): boolean {
    const cleanedCandidate = this.clean(candidate);
    const cleanedAcceptable = acceptableAnswers.map(ans => this.clean(ans));

    if (cleanedAcceptable.includes(cleanedCandidate)) {
      return true;
    }

    if (!strictAccents) {
      const noAccentCandidate = this.removeAccents(cleanedCandidate);
      const noAccentAcceptable = cleanedAcceptable.map(ans => this.removeAccents(ans));
      return noAccentAcceptable.includes(noAccentCandidate);
    }

    return false;
  }
}

export interface EvaluationInput {
  submittedAnswer: string;
  acceptableSolutions: string[];
  distractors?: Array<{ text: string; why_incorrect: string }>;
  explanation: string;
  attemptNumber?: number;
  exerciseType?: string;
}

export class PracticeEngine {
  /**
   * Evaluates learner submissions deterministically and provides pedagogical feedback.
   */
  public static evaluate(input: EvaluationInput): ExerciseValidationResult {
    const {
      submittedAnswer,
      acceptableSolutions,
      distractors = [],
      explanation,
      attemptNumber = 1,
    } = input;

    const cleanedSubmission = StringNormalizer.clean(submittedAnswer);

    // 1. Exact match (accent strict)
    if (StringNormalizer.matches(cleanedSubmission, acceptableSolutions, true)) {
      const score = attemptNumber === 1 ? 1.0 : Math.max(0.2, 1.0 - (attemptNumber - 1) * 0.3);
      return {
        isCorrect: true,
        score,
        matchedSolution: submittedAnswer.trim(),
        feedback: explanation ? `Correto! ${explanation}` : 'Excelente! Resposta correta.',
        explanation,
        isAccentErrorOnly: false,
      };
    }

    // 2. Accent-only error (close match without diacritics)
    if (StringNormalizer.matches(cleanedSubmission, acceptableSolutions, false)) {
      const expected = acceptableSolutions[0];
      return {
        isCorrect: false,
        score: 0.4,
        feedback: `Quase correto! Verifique os acentos ortográficos. Você digitou "${submittedAnswer.trim()}", mas a forma esperada é "${expected}".`,
        explanation,
        isAccentErrorOnly: true,
      };
    }

    // 3. Match against known pedagogical distractors
    for (const distractor of distractors) {
      if (StringNormalizer.clean(distractor.text) === cleanedSubmission) {
        return {
          isCorrect: false,
          score: 0.0,
          feedback: `Incorreto: ${distractor.why_incorrect}`,
          explanation,
          matchedDistractorFeedback: distractor.why_incorrect,
          isAccentErrorOnly: false,
        };
      }
    }

    // 4. Generic incorrect answer
    const primarySolution = acceptableSolutions[0] || '';
    return {
      isCorrect: false,
      score: 0.0,
      feedback: `Incorreto. Resposta esperada: "${primarySolution}"`,
      explanation,
      isAccentErrorOnly: false,
    };
  }

  /**
   * Automatically records attempt telemetry and saves incorrect responses to Mistake Notebook.
   */
  public static async recordAttempt(params: {
    exerciseId: string;
    submittedAnswer: string;
    validation: ExerciseValidationResult;
    attemptCount: number;
    language: Language;
    exerciseType: string;
    prompt: string;
    contextPassage?: string;
    primarySolution: string;
  }): Promise<ExerciseAttempt> {
    const attempt: ExerciseAttempt = {
      id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      exercise_id: params.exerciseId,
      submitted_answer: params.submittedAnswer,
      is_correct: params.validation.isCorrect,
      feedback: params.validation.feedback,
      attempt_count: params.attemptCount,
      timestamp: new Date().toISOString(),
      language: params.language,
      exercise_type: params.exerciseType,
    };

    StorageService.saveExerciseAttempt(attempt);
    activityService.recordExerciseAttempt(attempt);

    // Save mistake if incorrect
    if (!params.validation.isCorrect) {
      let category: MistakeCategory = 'grammar';
      const promptCombined = (params.prompt + ' ' + (params.contextPassage || '')).toLowerCase();

      if (promptCombined.includes('falso') || promptCombined.includes('cognat') || promptCombined.includes('false friend')) {
        category = 'false_friend';
      } else if (promptCombined.includes('subjuntiv') || promptCombined.includes('subjunctive')) {
        category = 'subjunctive_mood';
      } else if (promptCombined.includes('preposi') || promptCombined.includes('preposition')) {
        category = 'preposition';
      } else if (promptCombined.includes('vocabul') || promptCombined.includes('léxico') || params.exerciseType === 'cloze') {
        category = 'vocabulary';
      } else if (promptCombined.includes('concordân') || promptCombined.includes('plural') || promptCombined.includes('gênero')) {
        category = 'agreement';
      }

      await logMistake({
        user_id: StorageService.getCurrentUser(),
        language: params.language,
        error_category: category,
        prompt: params.prompt,
        context_passage: params.contextPassage,
        user_answer: params.submittedAnswer,
        correct_answer: params.primarySolution,
        explanation: params.validation.explanation || params.validation.feedback,
      });
    }

    return attempt;
  }
}
