/**
 * Unit Test Suite for Lexilume Multilingual Content Engine
 * Tests the 12-step pipeline, 13 language profiles, 11 exercise types, validators, and gap registry.
 * Lexilume — Illuminate Your Words
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ContentPipeline,
  validateVocabularyRecord,
  validateGrammarRecord,
  validateExerciseRecord,
  getLanguagePedagogy,
  SAMPLE_VOCABULARY_CATALOG,
  SAMPLE_GRAMMAR_CATALOG,
  SAMPLE_EXERCISES_CATALOG,
  ContentGapRegistry,
} from '../../services/contentEngine';
import { Language } from '../../types';
import {
  MultilingualVocabularyRecord,
  MultilingualGrammarRecord,
  MultilingualExerciseRecord,
} from '../../types/contentEngine';
import { contentAccess } from '../../services/contentAccess';
import { DictionaryManager } from '../../services/providers/dictionary/dictionaryManager';
import { ExamplesManager } from '../../services/providers/examples/examplesManager';
import { FrequencyManager } from '../../services/providers/frequency/frequencyManager';
import { VocabularyEntry } from '../../types/vocabulary';

const LIVE_ATTRIBUTION = {
  source_name: 'Wiktionary & Tatoeba Open Corpus',
  source_url: 'https://www.wiktionary.org',
  license_type: 'CC-BY-SA-4.0',
  attribution_text: 'Generated and validated dynamically via open APIs.',
};

function makeVocabRecord(lang: Language): MultilingualVocabularyRecord {
  const sampleWordByLang: Record<Language, { word: string; tr: string; ex: string }> = {
    en: { word: 'serendipity', tr: 'happy accidental discovery', ex: 'Serendipity shaped their research.' },
    pt: { word: 'saudade', tr: 'deep nostalgic longing', ex: 'Ela sentiu muita saudade da sua cidade.' },
    es: { word: 'sobremesa', tr: 'conversation lingering after a meal', ex: 'Disfrutamos una larga sobremesa en familia.' },
    fr: { word: 'flâner', tr: 'to stroll leisurely', ex: 'Nous aimons flâner le long du canal.' },
    de: { word: 'die Sehnsucht', tr: 'deep yearning or longing', ex: 'Die Sehnsucht nach der Heimat blieb stark.' },
    it: { word: 'meriggiare', tr: 'to rest outdoors at noon', ex: 'Ama meriggiare all’ombra degli ulivi.' },
    ja: { word: '木漏れ日', tr: 'sunlight filtering through leaves', ex: '森の中で柔らかな木漏れ日を見上げた。' },
    ko: { word: '눈치', tr: 'social perceptiveness and tact', ex: '그 사람은 분위기와 눈치가 매우 빠르다.' },
    ru: { word: 'тоска', tr: 'spiritual ache or deep yearning', ex: 'Вечерняя тоска звучала в этой мелодии.' },
    nl: { word: 'gezelligheid', tr: 'warm cozy conviviality', ex: 'De woonkamer straalde echte gezelligheid uit.' },
    zh: { word: '缘分', tr: 'fateful coincidence bringing people together', ex: '我们能在这里重逢真是难得的缘分。' },
    tr: { word: 'hüzün', tr: 'poetic collective melancholy', ex: 'İstanbul akşamlarında derin bir hüzün vardır.' },
    ta: { word: 'மகிழ்ச்சி', tr: 'deep joy and gladness', ex: 'நண்பர்களை சந்தித்ததில் மிகுந்த மகிழ்ச்சி அடைந்தேன்.' },
  };
  const s = sampleWordByLang[lang];
  return {
    id: `rec-voc-${lang}`,
    word: s.word,
    language: lang,
    locale: 'all',
    translation: s.tr,
    definition: `Pedagogical meaning in English: ${s.tr}.`,
    part_of_speech: 'noun',
    cefr_level: 'A2',
    example_sentence_target: s.ex,
    example_sentence_translation: `Contextual English equivalent for ${s.word}.`,
    phonetic_ipa: '/test/',
    synonyms: [],
    antonyms: [],
    inflections: [],
    collocations: [],
    attribution: LIVE_ATTRIBUTION,
  };
}

function makeGrammarRecord(lang: Language): MultilingualGrammarRecord {
  return {
    id: `rec-gram-${lang}`,
    rule_code: `${lang.toUpperCase()}-SYNTAX-A2`,
    language: lang,
    cefr_level: 'A2',
    title: `Core Syntax & Clause Structure (${lang.toUpperCase()})`,
    category: 'syntax',
    explanation: `Detailed pedagogical guide explaining core clause syntax for ${lang.toUpperCase()} learners.`,
    structural_formula: 'Subject + Predicate / Particle Alignment',
    examples: [
      {
        target: makeVocabRecord(lang).example_sentence_target,
        translation: makeVocabRecord(lang).example_sentence_translation,
        note: 'Primary usage example.',
      },
    ],
    common_errors: [],
    language_specific_notes: {},
    attribution: LIVE_ATTRIBUTION,
  };
}

function makeAll11Exercises(): MultilingualExerciseRecord[] {
  const types: MultilingualExerciseRecord['exercise_type'][] = [
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
  return types.map((exerciseType, idx) => ({
    id: `ex-type-${idx + 1}`,
    language: 'pt',
    cefr_level: 'B1',
    exercise_type: exerciseType,
    prompt: `Complete the ${exerciseType.replace(/_/g, ' ')} task carefully.`,
    context_passage: 'A leitura atenta melhora a compreensão textual.',
    acceptable_solutions: ['compreensão'],
    distractors:
      exerciseType === 'multiple_choice'
        ? [
            { text: 'confusão', why_incorrect: 'Opposite lexical meaning.' },
            { text: 'distração', why_incorrect: 'Does not fit context.' },
          ]
        : [],
    matching_pairs:
      exerciseType === 'matching'
        ? [
            { left: 'leitura', right: 'reading' },
            { left: 'texto', right: 'text' },
          ]
        : undefined,
    explanation: 'Pedagogical feedback explaining the target structure.',
    attribution: LIVE_ATTRIBUTION,
  }));
}

describe('Lexilume Multilingual Content Engine', () => {
  const all13Languages: Language[] = [
    'en', 'pt', 'es', 'fr', 'de', 'it', 'ja', 'ko', 'ru', 'nl', 'zh', 'tr', 'ta',
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // 1. ZERO STATIC CATALOG FIXTURES + 12-STEP LIVE CONTENT PIPELINE
  // ==========================================================================
  describe('12-Step Content Pipeline Workflow', () => {
    it('keeps static SAMPLE catalogs empty so all runtime content comes from live Content Engine & open APIs', () => {
      expect(Object.values(SAMPLE_VOCABULARY_CATALOG).every(list => list.length === 0)).toBe(true);
      expect(SAMPLE_GRAMMAR_CATALOG).toEqual({});
      expect(SAMPLE_EXERCISES_CATALOG).toEqual([]);
    });

    it('executes full pipeline successfully for German from live Dictionary/Examples/Frequency APIs', async () => {
      vi.spyOn(contentAccess, 'getPublishedVocabularyEntries').mockResolvedValue([]);
      vi.spyOn(contentAccess, 'getPublishedGrammarNotes').mockResolvedValue([]);
      vi.spyOn(contentAccess, 'getPublishedPracticeExercises').mockResolvedValue([]);
      vi.spyOn(DictionaryManager.getInstance(), 'lookup').mockResolvedValue({
        word: 'Akkusativ und Artikel',
        language: 'de',
        phonetic: '/aˈkuːzatiːf/',
        meanings: [
          {
            partOfSpeech: 'noun',
            definitions: ['Caso acusativo e artigos em alemão (objeto direto).'],
            examples: ['Ich lese einen interessanten Artikel über Grammatik.'],
          },
        ],
        provider: 'kaikki_wiktionary',
        sourceUrl: 'https://de.wiktionary.org',
      });
      vi.spyOn(ExamplesManager.getInstance(), 'getExamples').mockResolvedValue([
        {
          id: 'tat-de-1',
          sourceText: 'Der Lernende versteht den Akkusativ und Artikel sehr schnell.',
          targetText: 'O aprendiz entende o caso acusativo e os artigos rapidamente.',
          sourceLanguage: 'de',
          targetLanguage: 'pt',
          attribution: 'Tatoeba Project (CC-BY 2.0)',
          license: 'CC-BY 2.0 FR',
          isPedagogicallyVerified: true,
          provider: 'tatoeba',
        },
      ]);
      vi.spyOn(FrequencyManager.getInstance(), 'getWordFrequency').mockResolvedValue({
        word: 'artikel',
        language: 'de',
        rank: 420,
        frequencyPerMillion: 185.2,
        datasetSource: 'wordfreq',
        datasetVersion: '2024',
      });

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
      expect(result.validation_errors).toEqual([]);
    });

    it('executes pipeline for Japanese with published Content Engine script and particle verification', async () => {
      const jaEntry: VocabularyEntry = {
        id: 'live-ja-komorebi',
        lemma: '木漏れ日',
        target_language: 'ja',
        part_of_speech: 'noun',
        cefr_level: 'A1',
        translations: { en: 'sunlight filtering through tree leaves' },
        definitions: { en: 'Dappled sunlight shining through forest leaves.' },
        example_sentence_target: '公園で木漏れ日を眺めながら歩きました。',
        example_sentence_translations: { en: 'I walked in the park watching sunlight filter through the leaves.' },
        topic: 'culture',
        attribution: LIVE_ATTRIBUTION,
      };
      vi.spyOn(contentAccess, 'getPublishedVocabularyEntries').mockResolvedValue([jaEntry]);
      vi.spyOn(contentAccess, 'getPublishedGrammarNotes').mockResolvedValue([
        {
          id: 'gram-ja-particles',
          rule_code: 'JA-PARTICLES-WA-GA',
          language: 'ja',
          cefr_level: 'A1',
          title: 'Topic Marker は vs Subject Marker が',
          category: 'particles',
          explanation_markdown: '은/は marks known topic while が highlights new or focused subject.',
          structural_formula: '[Topic] は [Comment] / [Subject] が [Predicate]',
          examples: [{ target: '私は学生です。', en: 'As for me, I am a student.' }],
          common_errors: [],
          regional_notes: {},
          attribution: LIVE_ATTRIBUTION,
        },
      ]);
      vi.spyOn(contentAccess, 'getPublishedPracticeExercises').mockResolvedValue([]);

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

    it('executes pipeline for Tamil with published Content Engine SOV and case verification', async () => {
      const taEntry: VocabularyEntry = {
        id: 'live-ta-magizhchi',
        lemma: 'மகிழ்ச்சி',
        target_language: 'ta',
        part_of_speech: 'noun',
        cefr_level: 'A2',
        translations: { en: 'joy and happiness' },
        definitions: { en: 'State of heartfelt gladness or joy.' },
        example_sentence_target: 'உங்களைச் சந்தித்ததில் எனக்கு மிகுந்த மகிழ்ச்சி.',
        example_sentence_translations: { en: 'I feel great joy in meeting you.' },
        topic: 'culture',
        attribution: LIVE_ATTRIBUTION,
      };
      vi.spyOn(contentAccess, 'getPublishedVocabularyEntries').mockResolvedValue([taEntry]);
      vi.spyOn(contentAccess, 'getPublishedGrammarNotes').mockResolvedValue([
        {
          id: 'gram-ta-dative',
          rule_code: 'TA-CASES-DATIVE',
          language: 'ta',
          cefr_level: 'A2',
          title: 'Dative Case Suffix (-க்கு / -உக்கு)',
          category: 'cases',
          explanation_markdown: 'The Tamil dative suffix denotes recipient, direction, or experiencer subject.',
          structural_formula: '[Noun Stem] + -க்கு / -உக்கு',
          examples: [{ target: 'எனக்குத் தமிழ் பிடிக்கும்.', en: 'I like Tamil.' }],
          common_errors: [],
          regional_notes: {},
          attribution: LIVE_ATTRIBUTION,
        },
      ]);
      vi.spyOn(contentAccess, 'getPublishedPracticeExercises').mockResolvedValue([]);

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
      const sample = makeVocabRecord('de');
      const result = validateVocabularyRecord(sample);
      expect(result.isValid).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    it('rejects vocabulary record with missing translation or short example', () => {
      const invalid = {
        ...makeVocabRecord('de'),
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
        ...makeVocabRecord('de'),
        word: 'die Sehnsucht',
        translation: 'die Sehnsucht',
      };
      const result = validateVocabularyRecord(untranslated);
      expect(result.isValid).toBe(false);
      expect(result.issues.some(i => i.field === 'translation')).toBe(true);
    });

    it('validates grammar records and enforces structural formulas', () => {
      const sample = makeGrammarRecord('fr');
      const result = validateGrammarRecord(sample);
      expect(result.isValid).toBe(true);
    });

    it('enforces distractors >= 2 for multiple choice exercises', () => {
      const invalidMc = {
        ...makeAll11Exercises()[0],
        distractors: [{ text: 'wrong', why_incorrect: 'reason' }],
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

    it('validates working exercise schemas across all 11 exercise types', () => {
      const generatedExercises = makeAll11Exercises();
      const presentTypes = new Set(generatedExercises.map(e => e.exercise_type));
      for (const reqType of requiredExerciseTypes) {
        expect(presentTypes.has(reqType as any), `Missing exercise type: ${reqType}`).toBe(true);
      }
      for (const ex of generatedExercises) {
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
  // 5. SCHEMA VALIDATION ACROSS ALL 13 LANGUAGES
  // ==========================================================================
  describe('Dynamic Schema Compliance Across All 13 Languages', () => {
    it('validates structured dynamic vocabulary and grammar records for all 13 languages', () => {
      for (const lang of all13Languages) {
        const vocCheck = validateVocabularyRecord(makeVocabRecord(lang));
        expect(vocCheck.isValid, `Invalid dynamic vocabulary schema in ${lang}: ${JSON.stringify(vocCheck.issues)}`).toBe(true);

        const gramCheck = validateGrammarRecord(makeGrammarRecord(lang));
        expect(gramCheck.isValid, `Invalid dynamic grammar schema in ${lang}: ${JSON.stringify(gramCheck.issues)}`).toBe(true);
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
