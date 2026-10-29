import { describe, it, expect, beforeEach } from 'vitest';
import { ClientLessonGenerator } from '../services/lessonGenerator';
import { TranslationService } from '../services/translate';
import { sanitizeHtml, sanitizePlainText, isSafeUrl } from '../lib/security/contentSanitizer';

describe('Flexible Multilingual Learning System', () => {
  beforeEach(() => {
    localStorage.clear();
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
    expect(lesson.section_4_reading.passage_target.length).toBeGreaterThan(20);
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

  it('supports symmetric bidirectional translation across all pairs', () => {
    // 1. PT -> EN
    const ptEn = TranslationService.search('prerrogativa', 'pt-en');
    expect(ptEn.length).toBeGreaterThan(0);
    expect(ptEn[0].targetText.toLowerCase()).toContain('prerogative');

    // 2. EN -> PT
    const enPt = TranslationService.search('prerogative', 'en-pt');
    expect(enPt.length).toBeGreaterThan(0);
    expect(enPt[0].targetText.toLowerCase()).toContain('prerrogativa');

    // 3. ES -> EN
    const esEn = TranslationService.search('prerrogativa', 'es-en');
    expect(esEn.length).toBeGreaterThan(0);
    expect(esEn[0].targetText.toLowerCase()).toContain('prerogative');

    // 4. EN -> ES
    const enEs = TranslationService.search('nevertheless', 'en-es');
    expect(enEs.length).toBeGreaterThan(0);
    expect(enEs[0].targetText.toLowerCase()).toContain('no obstante');

    // 5. PT -> ES
    const ptEs = TranslationService.search('prerrogativa', 'pt-es');
    expect(ptEs.length).toBeGreaterThan(0);
    expect(ptEs[0].targetText.toLowerCase()).toContain('prerrogativa');

    // 6. ES -> PT
    const esPt = TranslationService.search('exquisito', 'es-pt');
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
