import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ClientLessonGenerator } from '../services/lessonGenerator';
import { TranslationService } from '../services/translate';
import { VocabularyService } from '../services/vocabularyService';
import { ExamplesManager } from '../services/providers/examples/examplesManager';
import { sanitizeHtml, sanitizePlainText, isSafeUrl } from '../lib/security/contentSanitizer';
import type { VocabularyEntry } from '../types/vocabulary';

const ATTR = {
  source_name: 'Lexilume Live Engine',
  source_url: 'https://lexilume.local',
  license_type: 'Original-Curated',
  attribution_text: 'Generated for multilingual test',
};

function makeVocabPool(): VocabularyEntry[] {
  const langs = ['en', 'pt', 'es'] as const;
  const items: VocabularyEntry[] = [];
  for (const lang of langs) {
    for (let i = 0; i < 8; i++) {
      const lemma =
        i === 0
          ? lang === 'pt'
            ? 'prerrogativa'
            : lang === 'es'
            ? 'no obstante'
            : 'prerogative'
          : `${lang}_term_${i}`;
      const ptVal =
        i === 0
          ? lang === 'es'
            ? 'não obstante'
            : 'prerrogativa'
          : `termo_pt_${i}`;
      const enVal =
        i === 0
          ? lang === 'es'
            ? 'nevertheless'
            : 'prerogative'
          : `en_word_${i}`;
      const esVal =
        i === 0
          ? lang === 'en'
            ? 'prerrogativa'
            : lang === 'pt'
            ? 'prerrogativa'
            : 'no obstante'
          : `termo_es_${i}`;
      items.push({
        id: `ml_${lang}_${i}`,
        lemma,
        target_language: lang,
        part_of_speech: 'noun',
        cefr_level: 'C1',
        translations: { en: enVal, pt: ptVal, es: esVal },
        definitions: {
          en: `English meaning (${enVal})`,
          pt: `Significado em português (${ptVal})`,
          es: `Significado en español (${esVal})`,
        },
        example_sentence_target: `${lemma} appears in formal usage.`,
        example_sentence_translations: {
          en: `${enVal} appears in formal usage.`,
          pt: `${ptVal} aparece em uso formal.`,
          es: `${esVal} aparece en uso formal.`,
        },
        topic: 'work',
        attribution: ATTR,
      });
    }
  }
  items.push({
    id: 'ml_en_nevertheless',
    lemma: 'nevertheless',
    target_language: 'en',
    part_of_speech: 'conjunction',
    cefr_level: 'C1',
    translations: { en: 'nevertheless', pt: 'não obstante', es: 'no obstante' },
    definitions: { en: 'Despite that', pt: 'Apesar disso', es: 'A pesar de ello' },
    example_sentence_target: 'Nevertheless, the study persisted.',
    example_sentence_translations: {
      en: 'Nevertheless, the study persisted.',
      pt: 'Não obstante, o estudo continuou.',
      es: 'No obstante, el estudio continuó.',
    },
    topic: 'work',
    attribution: ATTR,
  });
  items.push({
    id: 'ml_es_exquisito',
    lemma: 'exquisito',
    target_language: 'es',
    part_of_speech: 'adjective',
    cefr_level: 'B2',
    translations: { en: 'exquisite / delicious', pt: 'delicioso / refinado', es: 'exquisito' },
    definitions: { en: 'Delightful', pt: 'Refinado', es: 'Muy agradable' },
    example_sentence_target: 'Un plato exquisito.',
    example_sentence_translations: {
      en: 'A delicious dish.',
      pt: 'Um prato delicioso.',
      es: 'Un plato exquisito.',
    },
    topic: 'food_drink',
    attribution: ATTR,
  });
  return items;
}

describe('Flexible Multilingual Learning System', () => {
  beforeEach(() => {
    localStorage.clear();
    VocabularyService.setDynamicCatalog(makeVocabPool());
    vi.spyOn(ExamplesManager.getInstance(), 'getExamples').mockResolvedValue([]);
  });

  afterEach(() => {
    VocabularyService.clearDynamicCatalog();
    vi.restoreAllMocks();
  });

  it('generates English lesson for Portuguese speaker with Portuguese explanations', () => {
    const lesson = ClientLessonGenerator.generateOrGetLesson({
      target_language: 'en',
      regional_variant: 'en-US',
      cefr_level: 'C1',
      explanation_language: 'pt',
    }, '2026-10-30');

    expect(lesson.language).toBe('en');
    expect(lesson.cefr_level).toBe('C1');
    expect(lesson.section_2_vocabulary.length).toBeGreaterThanOrEqual(6);
    expect(lesson.section_3_grammar).toBeDefined();
    expect(lesson.section_6_speaking.prompt).toContain('Oral Presentation');
    expect(lesson.section_7_writing.suggested_connectors).toContain('Nevertheless');
  });

  it('generates English lesson for Spanish speaker with Spanish explanations', () => {
    const lesson = ClientLessonGenerator.generateOrGetLesson({
      target_language: 'en',
      regional_variant: 'en-GB',
      cefr_level: 'C1',
      explanation_language: 'es',
    }, '2026-10-31');

    expect(lesson.language).toBe('en');
    expect(lesson.regional_variety).toBe('en-GB');
    expect(lesson.section_3_grammar.regional_notes['en-GB']).toBeDefined();
  });

  it('generates Portuguese lesson for Spanish speaker with Spanish explanations', () => {
    const lesson = ClientLessonGenerator.generateOrGetLesson({
      target_language: 'pt',
      regional_variant: 'pt-BR',
      cefr_level: 'C1',
      explanation_language: 'es',
    }, '2026-11-01');

    expect(lesson.language).toBe('pt');
    expect(lesson.section_6_speaking.prompt).toContain('Apresentação oral');
    expect(lesson.section_7_writing.suggested_connectors).toContain('Não obstante');
  });

  it('generates Spanish lesson for English speaker with English explanations', () => {
    const lesson = ClientLessonGenerator.generateOrGetLesson({
      target_language: 'es',
      regional_variant: 'es-ES',
      cefr_level: 'C1',
      explanation_language: 'en',
    }, '2026-11-02');

    expect(lesson.language).toBe('es');
    expect(lesson.section_6_speaking.prompt).toContain('Producción oral');
    expect(lesson.section_7_writing.suggested_connectors).toContain('No obstante');
  });

  it('supports symmetric bidirectional search across all pairs using live entries', async () => {
    const ptEn = await TranslationService.searchLive('prerrogativa', 'pt-en');
    expect(ptEn.length).toBeGreaterThan(0);
    expect(ptEn[0].targetText.toLowerCase()).toContain('prerogative');

    const enPt = await TranslationService.searchLive('prerogative', 'en-pt');
    expect(enPt.length).toBeGreaterThan(0);
    expect(enPt[0].targetText.toLowerCase()).toContain('prerrogativa');

    const esEn = await TranslationService.searchLive('no obstante', 'es-en');
    expect(esEn.length).toBeGreaterThan(0);
    expect(esEn[0].targetText.toLowerCase()).toContain('nevertheless');

    const enEs = await TranslationService.searchLive('nevertheless', 'en-es');
    expect(enEs.length).toBeGreaterThan(0);
    expect(enEs[0].targetText.toLowerCase()).toContain('no obstante');

    const ptEs = await TranslationService.searchLive('prerrogativa', 'pt-es');
    expect(ptEs.length).toBeGreaterThan(0);
    expect(ptEs[0].targetText.toLowerCase()).toContain('prerrogativa');

    const esPt = await TranslationService.searchLive('exquisito', 'es-pt');
    expect(esPt.length).toBeGreaterThan(0);
  });
});

describe('Security & Content Sanitization', () => {
  it('strips dangerous executable script tags from untrusted content', () => {
    const dirty = 'Here is an article <script>alert("hacked")</script> about solar energy.';
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toContain('<script>');
    expect(clean).not.toContain('alert');
    expect(clean).toContain('about solar energy.');
  });

  it('strips inline event handlers such as onerror and onclick', () => {
    const dirty = '<img src="x" onerror="stealCookies()" /> Clean paragraph';
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toContain('onerror');
    expect(clean).not.toContain('stealCookies');
  });

  it('strips javascript: pseudo-protocol URIs', () => {
    const dirty = '<a href="javascript:doBadStuff()">Click here</a>';
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toContain('javascript:');
  });

  it('strips all HTML tags in sanitizePlainText', () => {
    const rich = '<p>This is <strong>strong</strong> &amp; <em>emphasized</em> text.</p>';
    const plain = sanitizePlainText(rich);
    expect(plain).toBe('This is strong & emphasized text.');
  });

  it('validates safe and unsafe URLs', () => {
    expect(isSafeUrl('https://pt.wikipedia.org/wiki/Energia_solar')).toBe(true);
    expect(isSafeUrl('http://tatoeba.org')).toBe(true);
    expect(isSafeUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeUrl('data:text/html;base64,...')).toBe(false);
  });
});
