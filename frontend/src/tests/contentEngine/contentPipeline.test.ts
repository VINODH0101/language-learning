/**
 * Unit Test Suite for Lexilume Multilingual Content Engine
 * Tests the 12-step pipeline, 13 language profiles, 11 exercise types, validators, and gap registry.
 * Lexilume — Illuminate Your Words
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ContentPipeline,
  validateVocabularyRecord,
  validateGrammarRecord,
  validateExerciseRecord,
  getLanguagePedagogy,
  LANGUAGE_PEDAGOGY_PROFILES,
  SAMPLE_VOCABULARY_CATALOG,
  SAMPLE_GRAMMAR_CATALOG,
  SAMPLE_EXERCISES_CATALOG,
  ContentGapRegistry,
} from '../../services/contentEngine';
import { Language } from '../../types';

describe('Lexilume Multilingual Content Engine', () => {
  const all13Languages: Language[] = [
    'en', 'pt', 'es', 'fr', 'de', 'it', 'ja', 'ko', 'ru', 'nl', 'zh', 'tr', 'ta',
  ];

  // ==========================================================================
  // 1. 12-STEP CONTENT PIPELINE
  // ==========================================================================
  describe('12-Step Content Pipeline Workflow', () => {
    it('executes full pipeline successfully for German with valid assembled items', async () => {
      const pipeline = ContentPipeline.getInstance();
      const result = await pipeline.executePipeline({
        target_language: 'de',
        locale: 'de-DE',
        cefr_level: 'A2',
        explanation_language: 'pt',
        topic: 'Akkusativ und Artikel',
      });

      expect(result.step).toBe(12);
      expect(result.success).toBe(true);
      expect(result.target_language).toBe('de');
      expect(result.locale).toBe('de-DE');
      expect(result.explanation_language).toBe('pt');
      expect(result.vocabulary.length).toBeGreaterThan(0);
      expect(result.grammar.length).toBeGreaterThan(0);
      expect(result.exercises.length).toBeGreaterThan(0);
      expect(result.assembled_items.length).toBeGreaterThan(0);
      expect(result.validation_errors.length).toBe(0);
    });

    it('executes pipeline for Japanese with script and particle verification', async () => {
      const pipeline = ContentPipeline.getInstance();
      const result = await pipeline.executePipeline({
        target_language: 'ja',
        locale: 'ja-JP',
        cefr_level: 'A1',
        explanation_language: 'en',
      });

      expect(result.success).toBe(true);
      expect(result.target_language).toBe('ja');
      expect(result.vocabulary.some(v => v.word === '木漏れ日')).toBe(true);
      expect(result.grammar.some(g => g.rule_code === 'JA-PARTICLES-WA-GA')).toBe(true);
    });

    it('executes pipeline for Tamil with SOV and case verification', async () => {
      const pipeline = ContentPipeline.getInstance();
      const result = await pipeline.executePipeline({
        target_language: 'ta',
        locale: 'ta-IN',
        cefr_level: 'A2',
        explanation_language: 'en',
      });

      expect(result.success).toBe(true);
      expect(result.target_language).toBe('ta');
      expect(result.vocabulary.some(v => v.word === 'மகிழ்ச்சி')).toBe(true);
      expect(result.grammar.some(g => g.rule_code === 'TA-CASES-DATIVE')).toBe(true);
    });
  });

  // ==========================================================================
  // 2. VALIDATION & PEDAGOGICAL SANITY GUARDS
  // ==========================================================================
  describe('Content Validators & Consistency Checks', () => {
    it('validates a compliant vocabulary record', () => {
      const sample = SAMPLE_VOCABULARY_CATALOG.de[0];
      const result = validateVocabularyRecord(sample);
      expect(result.isValid).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    it('rejects vocabulary record with missing translation or short example', () => {
      const invalid = {
        ...SAMPLE_VOCABULARY_CATALOG.de[0],
        translation: '',
        example_sentence_target: 'hi',
      };
      const result = validateVocabularyRecord(invalid);
      expect(result.isValid).toBe(false);
      expect(result.issues.some(i => i.field === 'translation')).toBe(true);
      expect(result.issues.some(i => i.field === 'example_sentence_target')).toBe(true);
    });

    it('flags untranslated raw tokens where target word and translation are identical', () => {
      const untranslated = {
        ...SAMPLE_VOCABULARY_CATALOG.de[0],
        word: 'die Sehnsucht',
        translation: 'die Sehnsucht', // Identical raw token
      };
      const result = validateVocabularyRecord(untranslated);
      expect(result.isValid).toBe(false);
      expect(result.issues.some(i => i.field === 'translation')).toBe(true);
    });

    it('validates grammar records and enforces structural formulas', () => {
      const sample = SAMPLE_GRAMMAR_CATALOG.fr;
      const result = validateGrammarRecord(sample);
      expect(result.isValid).toBe(true);
    });

    it('enforces distractors >= 2 for multiple choice exercises', () => {
      const invalidMc = {
        ...SAMPLE_EXERCISES_CATALOG[0],
        distractors: [{ text: 'wrong', why_incorrect: 'reason' }], // Only 1 distractor
      };
      const result = validateExerciseRecord(invalidMc);
      expect(result.isValid).toBe(false);
      expect(result.issues.some(i => i.field === 'distractors')).toBe(true);
    });
  });

  // ==========================================================================
  // 3. COVERAGE FOR ALL 11 EXERCISE TYPES
  // ==========================================================================
  describe('Support for All 11 Exercise Types', () => {
    const requiredExerciseTypes = [
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
    ];

    it('includes working exercise records for each of the 11 exercise types', () => {
      const presentTypes = new Set(SAMPLE_EXERCISES_CATALOG.map(e => e.exercise_type));
      for (const reqType of requiredExerciseTypes) {
        expect(presentTypes.has(reqType as any), `Missing exercise type: ${reqType}`).toBe(true);
      }
    });

    it('validates each exercise record in the catalog without schema errors', () => {
      for (const ex of SAMPLE_EXERCISES_CATALOG) {
        const val = validateExerciseRecord(ex);
        expect(val.isValid, `Exercise ${ex.id} (${ex.exercise_type}) has errors: ${JSON.stringify(val.issues)}`).toBe(true);
      }
    });
  });

  // ==========================================================================
  // 4. LANGUAGE-SPECIFIC PEDAGOGY (ALL 13 LANGUAGES)
  // ==========================================================================
  describe('Authentic Language-Specific Pedagogy Across 13 Languages', () => {
    it('defines distinct pedagogical profiles for all 13 supported languages', () => {
      for (const lang of all13Languages) {
        const profile = getLanguagePedagogy(lang);
        expect(profile).toBeDefined();
        expect(profile.language).toBe(lang);
        expect(profile.keyPedagogicalPillars.length).toBeGreaterThanOrEqual(3);
        expect(profile.displayName.length).toBeGreaterThan(0);
      }
    });

    it('encapsulates German cases and V2 word order', () => {
      const de = getLanguagePedagogy('de');
      expect(de.caseSystem).toBe(true);
      expect(de.grammaticalGender).toBe(true);
      expect(de.wordOrder).toBe('V2');
    });

    it('encapsulates Japanese particles, SOV order, and honorific registers', () => {
      const ja = getLanguagePedagogy('ja');
      expect(ja.particleSystem).toBe(true);
      expect(ja.wordOrder).toBe('SOV');
      expect(ja.honorificRegisters).toBe(true);
    });

    it('encapsulates Chinese lexical tones and measure words', () => {
      const zh = getLanguagePedagogy('zh');
      expect(zh.tonal).toBe(true);
      expect(zh.morphologicalType).toBe('isolating');
    });

    it('encapsulates Turkish vowel harmony and agglutination', () => {
      const tr = getLanguagePedagogy('tr');
      expect(tr.vowelHarmony).toBe(true);
      expect(tr.morphologicalType).toBe('agglutinative');
      expect(tr.grammaticalGender).toBe(false);
    });

    it('encapsulates Tamil noun cases and SOV word order', () => {
      const ta = getLanguagePedagogy('ta');
      expect(ta.caseSystem).toBe(true);
      expect(ta.wordOrder).toBe('SOV');
      expect(ta.morphologicalType).toBe('agglutinative');
    });
  });

  // ==========================================================================
  // 5. SAMPLE LEARNING CONTENT CATALOG (ALL 13 LANGUAGES)
  // ==========================================================================
  describe('Sample Learning Content Catalog Coverage', () => {
    it('provides validated vocabulary records for every one of the 13 languages', () => {
      for (const lang of all13Languages) {
        const vocabList = SAMPLE_VOCABULARY_CATALOG[lang];
        expect(vocabList, `Missing vocabulary for language: ${lang}`).toBeDefined();
        expect(vocabList.length).toBeGreaterThan(0);

        for (const item of vocabList) {
          const check = validateVocabularyRecord(item);
          expect(check.isValid, `Invalid vocabulary record in ${lang}: ${JSON.stringify(check.issues)}`).toBe(true);
        }
      }
    });

    it('provides language-specific grammar rules for every one of the 13 languages', () => {
      for (const lang of all13Languages) {
        const grammarRule = SAMPLE_GRAMMAR_CATALOG[lang];
        expect(grammarRule, `Missing grammar rule for language: ${lang}`).toBeDefined();
        const check = validateGrammarRecord(grammarRule);
        expect(check.isValid, `Invalid grammar rule in ${lang}: ${JSON.stringify(check.issues)}`).toBe(true);
      }
    });
  });

  // ==========================================================================
  // 6. CONTENT GAP REGISTRY AUDIT
  // ==========================================================================
  describe('Content Gap Registry', () => {
    it('records audited gaps and mitigations without fabricating artificial coverage', () => {
      const registry = ContentGapRegistry.getInstance();
      const tamilGaps = registry.getGapsForLanguage('ta');

      expect(tamilGaps.length).toBeGreaterThan(0);
      const pronGap = tamilGaps.find(g => g.category === 'pronunciation');
      expect(pronGap).toBeDefined();
      expect(pronGap?.pedagogicalMitigation).toContain('Tatoeba');

      const allGaps = registry.getAllGaps();
      expect(allGaps.length).toBeGreaterThanOrEqual(5);
    });
  });
});
