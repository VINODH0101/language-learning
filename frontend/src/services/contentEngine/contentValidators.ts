/**
 * Content Validation & Consistency Guard
 * Lexilume — Illuminate Your Words
 */

import { z } from 'zod';
import {
  MultilingualVocabularyRecord,
  MultilingualGrammarRecord,
  MultilingualExerciseRecord,
} from '../../types/contentEngine';

// ============================================================================
// 1. ZOD SCHEMAS
// ============================================================================

export const AttributionSchema = z.object({
  source_name: z.string().min(1, 'Nome da fonte obrigatório'),
  source_url: z.string().min(1, 'URL da fonte obrigatória'),
  license_type: z.string().min(1, 'Tipo de licença obrigatório'),
  attribution_text: z.string().min(1, 'Texto de atribuição obrigatório'),
  terms_url: z.string().optional(),
});

export const MultilingualVocabularyRecordSchema = z.object({
  id: z.string().min(1),
  word: z.string().min(1, 'Palavra ou expressão não pode estar vazia'),
  language: z.string().min(2),
  locale: z.string().min(2),
  translation: z.string().min(1, 'Tradução pedagógica obrigatória'),
  definition: z.string().min(1, 'Definição léxica obrigatória'),
  part_of_speech: z.string().min(1),
  cefr_level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1']),
  example_sentence_target: z.string().min(3, 'Frase de exemplo no idioma alvo obrigatória'),
  example_sentence_translation: z.string().min(3, 'Tradução da frase de exemplo obrigatória'),
  phonetic_ipa: z.string().optional(),
  audio_url: z.string().nullable().optional(),
  frequency_rank: z.number().int().positive().optional(),
  frequency_per_million: z.number().nonnegative().optional(),
  synonyms: z.array(z.string()).default([]),
  antonyms: z.array(z.string()).default([]),
  inflections: z.array(z.string()).default([]),
  collocations: z.array(z.string()).default([]),
  false_friend_warning: z.string().nullable().optional(),
  attribution: AttributionSchema,
});

export const MultilingualExerciseRecordSchema = z.object({
  id: z.string().min(1),
  language: z.string().min(2),
  cefr_level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1']),
  exercise_type: z.enum([
    'multiple_choice',
    'cloze',
    'reorder',
    'translation',
    'matching',
    'listening_comprehension',
    'reading_comprehension',
    'grammar_correction',
    'writing_response',
    'conversation_response',
    'pronunciation_practice',
  ]),
  prompt: z.string().min(3, 'Instrução do exercício obrigatória'),
  context_passage: z.string().optional(),
  audio_url: z.string().optional(),
  target_slot_index: z.number().optional(),
  acceptable_solutions: z.array(z.string()).min(1, 'Pelo menos uma solução correta necessária'),
  distractors: z.array(z.object({ text: z.string(), why_incorrect: z.string() })).default([]),
  matching_pairs: z.array(z.object({ left: z.string(), right: z.string() })).optional(),
  rubric: z.string().optional(),
  explanation: z.string().min(3, 'Explicação pedagógica obrigatória'),
  hint: z.string().optional(),
  attribution: AttributionSchema,
});

export const MultilingualGrammarRecordSchema = z.object({
  id: z.string().min(1),
  rule_code: z.string().min(1),
  language: z.string().min(2),
  cefr_level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1']),
  title: z.string().min(3, 'Título da regra obrigatório'),
  category: z.string().min(2),
  explanation: z.string().min(10, 'Explicação detalhada obrigatória'),
  structural_formula: z.string().min(2),
  examples: z.array(
    z.object({
      target: z.string().min(2),
      translation: z.string().min(2),
      note: z.string().optional(),
    })
  ).min(1, 'Ao menos um exemplo autêntico obrigatório'),
  common_errors: z.array(
    z.object({
      incorrect: z.string(),
      correct: z.string(),
      reason: z.string(),
    })
  ).default([]),
  language_specific_notes: z.record(z.string(), z.string()).default({}),
  attribution: AttributionSchema,
});

// ============================================================================
// 2. VALIDATION FUNCTIONS WITH PEDAGOGICAL SANITY CHECKS
// ============================================================================

export interface ValidationIssue {
  field: string;
  message: string;
}

export function validateVocabularyRecord(record: MultilingualVocabularyRecord): {
  isValid: boolean;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];

  // Schema check
  const parseResult = MultilingualVocabularyRecordSchema.safeParse(record);
  if (!parseResult.success) {
    for (const error of (parseResult.error.issues || [])) {
      issues.push({ field: error.path.join('.'), message: error.message });
    }
  }

  // Translation consistency check: target word vs translation
  if (
    record.word &&
    record.translation &&
    record.word.trim().toLowerCase() === record.translation.trim().toLowerCase() &&
    record.language !== 'en' // When target is not English, raw identical text indicates untranslated token
  ) {
    issues.push({
      field: 'translation',
      message: `A tradução "${record.translation}" é idêntica ao termo alvo "${record.word}".`,
    });
  }

  // Example sentence check
  if (record.example_sentence_target && record.example_sentence_translation) {
    if (record.example_sentence_target.trim().length < 5) {
      issues.push({
        field: 'example_sentence_target',
        message: 'Frase de exemplo alvo excessivamente curta.',
      });
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

export function validateExerciseRecord(exercise: MultilingualExerciseRecord): {
  isValid: boolean;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];

  const parseResult = MultilingualExerciseRecordSchema.safeParse(exercise);
  if (!parseResult.success) {
    for (const error of (parseResult.error.issues || [])) {
      issues.push({ field: error.path.join('.'), message: error.message });
    }
  }

  // Exercise type-specific requirements
  if (exercise.exercise_type === 'multiple_choice' && exercise.distractors.length < 2) {
    issues.push({
      field: 'distractors',
      message: 'Exercício de múltipla escolha requer ao menos 2 alternativas distratoras explicadas.',
    });
  }

  if (exercise.exercise_type === 'matching' && (!exercise.matching_pairs || exercise.matching_pairs.length < 2)) {
    issues.push({
      field: 'matching_pairs',
      message: 'Exercício de correspondência (matching) requer ao menos 2 pares associados.',
    });
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

export function validateGrammarRecord(grammar: MultilingualGrammarRecord): {
  isValid: boolean;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];

  const parseResult = MultilingualGrammarRecordSchema.safeParse(grammar);
  if (!parseResult.success) {
    for (const error of (parseResult.error.issues || [])) {
      issues.push({ field: error.path.join('.'), message: error.message });
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}
