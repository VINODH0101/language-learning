import { describe, it, expect, beforeEach } from 'vitest';
import {
  isValidRegionalVariety,
  enforceRegionalVariety,
  isValidInterfaceLanguage,
  isValidLearningLanguage,
  isValidExplanationLanguage,
  enforceDecoupledLanguageMatrix,
  REGIONAL_VARIETIES_BY_LANGUAGE,
  DEFAULT_REGIONAL_VARIETY,
  getLanguageName,
  getRegionalVarietyLabel,
} from '../lib/languages/languageMatrix';
import { courseService } from '../services/courseService';
import { ClientLessonGenerator } from '../services/lessonGenerator';
import { SpeechService } from '../services/speech';

describe('Enforce Separation between Interface, Learning, Explanation, and Regional Variety', () => {
  beforeEach(() => {
    localStorage.clear();
    courseService.setUserId('test_decoupling_user');
  });

  describe('1. Regional Variety Strict Scoping by Learning Language', () => {
    it('validates regional varieties strictly by learning language', () => {
      // Portuguese
      expect(isValidRegionalVariety('pt', 'pt-BR')).toBe(true);
      expect(isValidRegionalVariety('pt', 'pt-PT')).toBe(true);
      expect(isValidRegionalVariety('pt', 'all')).toBe(true);
      expect(isValidRegionalVariety('pt', 'es-ES')).toBe(false);
      expect(isValidRegionalVariety('pt', 'es-419')).toBe(false);
      expect(isValidRegionalVariety('pt', 'en-US')).toBe(false);

      // Spanish
      expect(isValidRegionalVariety('es', 'es-ES')).toBe(true);
      expect(isValidRegionalVariety('es', 'es-419')).toBe(true);
      expect(isValidRegionalVariety('es', 'es-MX')).toBe(true);
      expect(isValidRegionalVariety('es', 'es-AR')).toBe(true);
      expect(isValidRegionalVariety('es', 'all')).toBe(true);
      expect(isValidRegionalVariety('es', 'pt-BR')).toBe(false);
      expect(isValidRegionalVariety('es', 'en-GB')).toBe(false);

      // English
      expect(isValidRegionalVariety('en', 'en-US')).toBe(true);
      expect(isValidRegionalVariety('en', 'en-GB')).toBe(true);
      expect(isValidRegionalVariety('en', 'all')).toBe(true);
      expect(isValidRegionalVariety('en', 'pt-BR')).toBe(false);
      expect(isValidRegionalVariety('en', 'es-ES')).toBe(false);
    });

    it('enforces and normalizes invalid or cross-assigned varieties to language default', () => {
      // Invalid assignments fallback to language default
      expect(enforceRegionalVariety('pt', 'es-ES')).toBe('pt-BR');
      expect(enforceRegionalVariety('pt', 'en-GB')).toBe('pt-BR');
      expect(enforceRegionalVariety('es', 'pt-BR')).toBe('es-ES');
      expect(enforceRegionalVariety('en', 'pt-PT')).toBe('en-US');

      // Valid assignments are preserved
      expect(enforceRegionalVariety('pt', 'pt-PT')).toBe('pt-PT');
      expect(enforceRegionalVariety('es', 'es-419')).toBe('es-419');
      expect(enforceRegionalVariety('es', 'es-AR')).toBe('es-AR');
      expect(enforceRegionalVariety('en', 'en-GB')).toBe('en-GB');
    });
  });

  describe('2. Decoupled Language Matrix Validation', () => {
    it('validates supported codes across each independent dimension', () => {
      // Interface Language
      expect(isValidInterfaceLanguage('en')).toBe(true);
      expect(isValidInterfaceLanguage('pt')).toBe(true);
      expect(isValidInterfaceLanguage('es')).toBe(true);
      expect(isValidInterfaceLanguage('fr')).toBe(true);
      expect(isValidInterfaceLanguage('hi')).toBe(false); // Hindi explicitly excluded

      // Learning Language
      expect(isValidLearningLanguage('pt')).toBe(true);
      expect(isValidLearningLanguage('es')).toBe(true);
      expect(isValidLearningLanguage('en')).toBe(true);
      expect(isValidLearningLanguage('de')).toBe(true);
      expect(isValidLearningLanguage('ja')).toBe(true);
      expect(isValidLearningLanguage('hi')).toBe(false); // Hindi explicitly excluded

      // Explanation Language
      expect(isValidExplanationLanguage('en')).toBe(true);
      expect(isValidExplanationLanguage('pt')).toBe(true);
      expect(isValidExplanationLanguage('es')).toBe(true);
      expect(isValidExplanationLanguage('it')).toBe(false);
    });

    it('enforces a full 4-dimension decoupled matrix with safe fallbacks', () => {
      const normalized = enforceDecoupledLanguageMatrix({
        interfaceLanguage: 'pt',
        learningLanguage: 'en',
        explanationLanguage: 'es',
        regionalVariety: 'pt-BR', // Mismatched variety for learning English!
      });

      expect(normalized.interfaceLanguage).toBe('pt');
      expect(normalized.learningLanguage).toBe('en');
      expect(normalized.explanationLanguage).toBe('es');
      expect(normalized.regionalVariety).toBe('en-US'); // Safely normalized to English default
    });
  });

  describe('3. Multi-Course Regional Variety and Explanation Decoupling', () => {
    it('enforces valid regional varieties when creating courses', () => {
      // Attempting to create an English course with pt-BR variety
      const course = courseService.createCourse({
        target_language: 'en',
        regional_variant: 'pt-BR' as any,
        cefr_level: 'B2',
        explanation_language: 'pt',
        daily_goal_minutes: 10,
        streak_days: 1,
        total_lessons_completed: 0,
        completed_curriculum_node_ids: [],
        is_active: true,
      });

      // Must be automatically enforced to a valid English variety
      expect(course.regional_variant).toBe('en-US');
      expect(course.target_language).toBe('en');
      expect(course.explanation_language).toBe('pt');
    });

    it('allows updating explanation language independently of target language and variety', () => {
      const active = courseService.getActiveCourse();
      const origTarget = active.target_language;
      const origVariety = active.regional_variant;

      const updated = courseService.updateActiveExplanationLanguage('es');
      expect(updated.explanation_language).toBe('es');
      expect(updated.target_language).toBe(origTarget);
      expect(updated.regional_variant).toBe(origVariety);
    });

    it('allows updating regional variety without mutating explanation language', () => {
      // Activate Portuguese course
      const ptCourse = courseService.getCourseForLanguage('pt');
      if (ptCourse) {
        courseService.setActiveCourse(ptCourse.id);
        const origExp = courseService.getActiveCourse().explanation_language;

        const updated = courseService.updateActiveRegionalVariant('pt-PT');
        expect(updated.regional_variant).toBe('pt-PT');
        expect(updated.explanation_language).toBe(origExp);
      }
    });
  });

  describe('4. Lesson Generation Across All 9 Decoupled Matrix Pairs', () => {
    const learningLanguages = ['pt', 'es', 'en'] as const;
    const explanationLanguages = ['en', 'pt', 'es'] as const;

    for (const targetLang of learningLanguages) {
      for (const expLang of explanationLanguages) {
        it(`generates valid lesson for learning ${targetLang.toUpperCase()} with ${expLang.toUpperCase()} explanations`, () => {
          const defaultVariety = DEFAULT_REGIONAL_VARIETY[targetLang];
          const lesson = ClientLessonGenerator.generateOrGetLesson({
            target_language: targetLang,
            regional_variant: defaultVariety,
            cefr_level: 'C1',
            explanation_language: expLang,
          }, `2026-12-${targetLang}-${expLang}`);

          expect(lesson.language).toBe(targetLang);
          expect(lesson.regional_variety).toBe(defaultVariety);
          expect(lesson.explanation_language).toBe(expLang);
          expect(lesson.section_2_vocabulary.length).toBeGreaterThanOrEqual(6);
          expect(lesson.section_8_listening.comprehension_tasks.length).toBeGreaterThan(0);
          expect(lesson.section_6_speaking.guiding_questions.length).toBeGreaterThan(0);

          // Verify listening task guidance is presented in the chosen explanation language
          const firstTask = lesson.section_8_listening.comprehension_tasks[0];
          if (expLang === 'en') {
            expect(firstTask.toLowerCase()).toContain('listen attentively');
          } else if (expLang === 'es') {
            expect(firstTask.toLowerCase()).toContain('escuche atentamente');
          } else if (expLang === 'pt') {
            expect(firstTask.toLowerCase()).toContain('escute');
          }
        });
      }
    }
  });

  describe('5. Speech Synthesis Audio Separation', () => {
    it('resolves voice locale solely from learning language and regional variety', () => {
      // Portuguese varieties
      expect(SpeechService.getVoiceLang('pt', 'pt-BR')).toBe('pt-BR');
      expect(SpeechService.getVoiceLang('pt', 'pt-PT')).toBe('pt-PT');

      // Spanish varieties
      expect(SpeechService.getVoiceLang('es', 'es-ES')).toBe('es-ES');
      expect(SpeechService.getVoiceLang('es', 'es-419')).toBe('es-MX');
      expect(SpeechService.getVoiceLang('es', 'es-MX')).toBe('es-MX');
      expect(SpeechService.getVoiceLang('es', 'es-AR')).toBe('es-AR');

      // English varieties
      expect(SpeechService.getVoiceLang('en', 'en-US')).toBe('en-US');
      expect(SpeechService.getVoiceLang('en', 'en-GB')).toBe('en-GB');

      // Mismatched variety is safely normalized to default
      expect(SpeechService.getVoiceLang('en', 'pt-BR')).toBe('en-US');
      expect(SpeechService.getVoiceLang('pt', 'es-ES')).toBe('pt-BR');
    });
  });
});
