import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TranslationService } from '../services/translate';
import { contentAccess } from '../services/contentAccess';
import { VocabularyService } from '../services/vocabularyService';
import type { VocabularyEntry } from '../types/vocabulary';

const ATTR = {
  source_name: 'Lexilume Content Engine',
  source_url: 'https://lexilume.local',
  license_type: 'Original-Curated',
  attribution_text: 'Generated for test',
};

const LIVE_ENTRIES: VocabularyEntry[] = [
  {
    id: 'tr_prerrogativa',
    lemma: 'prerrogativa',
    target_language: 'pt',
    part_of_speech: 'noun',
    cefr_level: 'C1',
    translations: { pt: 'prerrogativa', en: 'prerogative', es: 'prerrogativa' },
    definitions: {
      pt: 'Direito exclusivo inerente a um cargo.',
      en: 'An exclusive right or privilege.',
      es: 'Derecho exclusivo.',
    },
    example_sentence_target: 'É prerrogativa da direção aprovar o orçamento.',
    example_sentence_translations: {
      en: 'It is management prerogative to approve the budget.',
      pt: 'É prerrogativa da direção aprovar o orçamento.',
      es: 'Es prerrogativa de la dirección aprobar el presupuesto.',
    },
    topic: 'work',
    attribution: ATTR,
  },
  {
    id: 'tr_no_obstante',
    lemma: 'no obstante',
    target_language: 'es',
    part_of_speech: 'conjunction',
    cefr_level: 'C1',
    translations: { es: 'no obstante', en: 'nevertheless', pt: 'não obstante' },
    definitions: {
      es: 'Expresión concesiva formal.',
      en: 'In spite of that; however.',
      pt: 'Conjunção adversativa formal.',
    },
    example_sentence_target: 'No obstante las lluvias, continuamos.',
    example_sentence_translations: {
      en: 'Nevertheless, despite the rains, we continued.',
      pt: 'Não obstante as chuvas, continuamos.',
      es: 'No obstante las lluvias, continuamos.',
    },
    topic: 'daily_life',
    attribution: ATTR,
  },
  {
    id: 'tr_actually',
    lemma: 'actually',
    target_language: 'en',
    part_of_speech: 'adverb',
    cefr_level: 'B1',
    translations: { en: 'actually', pt: 'na verdade', es: 'en realidad' },
    definitions: {
      en: 'In truth or really.',
      pt: 'Falso cognato: não significa atualmente, e sim na verdade.',
      es: 'En verdad (no actualmente).',
    },
    grammar_notes: 'False cognate alert: do not confuse with "atualmente" (currently).',
    example_sentence_target: "Actually, I don't agree with that decision.",
    example_sentence_translations: {
      en: "Actually, I don't agree with that decision.",
      pt: 'Na verdade, não concordo com essa decisão.',
      es: 'En realidad, no estoy de acuerdo con esa decisión.',
    },
    topic: 'daily_life',
    attribution: ATTR,
  },
];

describe('TranslationService (Live Lookup & Learning Challenges)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    VocabularyService.clearDynamicCatalog();
    vi.spyOn(contentAccess, 'getPublishedVocabularyEntries').mockImplementation(async (lang?: string) => {
      if (!lang) return LIVE_ENTRIES;
      return LIVE_ENTRIES.filter(v => v.target_language === lang);
    });
  });

  afterEach(() => {
    VocabularyService.clearDynamicCatalog();
    vi.restoreAllMocks();
  });

  it('searches Portuguese to English terms from live content engine & corpus', async () => {
    const results = await TranslationService.searchLive('prerrogativa', 'pt-en');
    expect(results.length).toBeGreaterThan(0);
    const item = results[0];
    expect(item.sourceText).toContain('prerrogativa');
    expect(item.targetText.toLowerCase()).toContain('prerogative');
    expect(item.targetLang).toBe('en');
  });

  it('searches Spanish to English terms from live content engine & corpus', async () => {
    const results = await TranslationService.searchLive('no obstante', 'es-en');
    expect(results.length).toBeGreaterThan(0);
    const item = results[0];
    expect(item.sourceText).toContain('no obstante');
    expect(item.targetText.toLowerCase()).toContain('nevertheless');
    expect(item.targetLang).toBe('en');
  });

  it('searches English to Portuguese/Spanish with false cognate notes', async () => {
    const results = await TranslationService.searchLive('actually', 'en-pt');
    expect(results.length).toBeGreaterThan(0);
    const item = results[0];
    expect(item.sourceText).toBe('actually');
    expect(item.targetText).toContain('na verdade');
    expect(item.notes).toContain('atualmente');
  });

  it('retrieves English challenges from live Content Engine for PT and ES speakers', async () => {
    vi.spyOn(contentAccess, 'getPublishedPracticeExercises').mockResolvedValue([
      {
        id: 'ch_pt_1',
        curriculum_node_id: 'node_1',
        language: 'pt',
        exercise_type: 'translation',
        prompt: 'Na verdade, eu não concordo com essa decisão.',
        acceptable_solutions: ["Actually, I don't agree with that decision."],
        distractors: [
          {
            text: "Currently, I don't agree with that decision.",
            why_incorrect: 'False cognate: use "Actually" rather than "Currently".',
          },
        ],
        explanation: 'Use "Actually" to clarify truth; "atualmente" translates to "Currently".',
        difficulty: 2,
        attribution: ATTR,
      },
    ]);

    const ptChallenges = await TranslationService.getLiveChallenges('pt');
    expect(ptChallenges.length).toBeGreaterThan(0);
    expect(ptChallenges[0].source_lang).toBe('pt');

    const ptChallenge = ptChallenges[0];
    const correctRes = TranslationService.checkChallenge(
      ptChallenge,
      "Actually, I don't agree with that decision."
    );
    expect(correctRes.isCorrect).toBe(true);

    const wrongRes = TranslationService.checkChallenge(
      ptChallenge,
      "Currently, I don't agree with that decision."
    );
    expect(wrongRes.isCorrect).toBe(false);
    expect(wrongRes.feedback).toContain('Actually');
  });

  it('rejects translation requests exceeding 1,000 characters', async () => {
    const longText = 'A'.repeat(1005);
    const res = await TranslationService.translateOnline(longText, 'pt', 'en', false);
    expect(res.success).toBe(false);
    expect(res.error).toContain('1,000 characters');
  });

  it('prioritizes verified Content Engine entry in translateOnline', async () => {
    const res = await TranslationService.translateOnline('prerrogativa', 'pt', 'en', true);
    expect(res.success).toBe(true);
    expect(res.result?.isVerified).toBe(true);
    expect(res.result?.providerName).toBe('content_engine');
    expect(res.result?.translatedText.toLowerCase()).toContain('prerogative');
  });
});
