import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VocabularyService } from '../services/vocabularyService';
import { PdfService } from '../services/pdfService';
import { Language } from '../types';
import type { VocabularyEntry, EverydaySentenceEntry } from '../types/vocabulary';

const ATTR = {
  source_name: 'Kaikki / Tatoeba Live Feed',
  source_url: 'https://tatoeba.org',
  license_type: 'CC-BY-SA-4.0',
  attribution_text: 'Generated and validated for Lexilume',
};

const MOCK_VOCAB_CATALOG: VocabularyEntry[] = [
  {
    id: 'v_en_1',
    lemma: 'resilience',
    target_language: 'en',
    part_of_speech: 'noun',
    cefr_level: 'C1',
    frequency_rank: 10,
    translations: { en: 'resilience', pt: 'resiliência', es: 'resiliencia' },
    definitions: {
      en: 'Capacity to recover quickly from difficulties.',
      pt: 'Capacidade de superar adversidades.',
      es: 'Capacidad de recuperarse ante dificultades.',
    },
    example_sentence_target: 'Urban resilience requires planning.',
    example_sentence_translations: {
      en: 'Urban resilience requires planning.',
      pt: 'A resiliência urbana exige planejamento.',
      es: 'La resiliencia urbana requiere planificación.',
    },
    topic: 'work',
    attribution: ATTR,
  },
  {
    id: 'v_en_2',
    lemma: 'itinerary',
    target_language: 'en',
    part_of_speech: 'noun',
    cefr_level: 'B1',
    frequency_rank: 45,
    translations: { en: 'itinerary', pt: 'roteiro', es: 'itinerario' },
    definitions: {
      en: 'A planned route or journey.',
      pt: 'Um trajeto ou plano de viagem.',
      es: 'Una ruta planificada.',
    },
    example_sentence_target: 'Review the itinerary before boarding.',
    example_sentence_translations: {
      en: 'Review the itinerary before boarding.',
      pt: 'Revise o roteiro antes do embarque.',
      es: 'Revisa el itinerario antes de embarcar.',
    },
    topic: 'travel',
    attribution: ATTR,
  },
  {
    id: 'v_pt_1',
    lemma: 'cotidiano',
    target_language: 'pt',
    part_of_speech: 'noun',
    cefr_level: 'B2',
    frequency_rank: 12,
    translations: { en: 'daily life', pt: 'cotidiano', es: 'cotidianidad' },
    definitions: {
      en: 'Everyday routine or ordinary life.',
      pt: 'Rotina diária.',
      es: 'Vida diaria.',
    },
    example_sentence_target: 'O cotidiano na cidade é dinâmico.',
    example_sentence_translations: {
      en: 'Daily life in the city is dynamic.',
      pt: 'O cotidiano na cidade é dinâmico.',
      es: 'La vida diaria en la ciudad es dinámica.',
    },
    topic: 'daily_life',
    attribution: ATTR,
  },
  {
    id: 'v_pt_2',
    lemma: 'refeição',
    target_language: 'pt',
    part_of_speech: 'noun',
    cefr_level: 'A2',
    frequency_rank: 28,
    translations: { en: 'meal', pt: 'refeição', es: 'comida' },
    definitions: {
      en: 'Food eaten on one occasion.',
      pt: 'Alimento ingerido num momento do dia.',
      es: 'Alimento que se toma a ciertas horas.',
    },
    example_sentence_target: 'Partilhamos uma refeição em família.',
    example_sentence_translations: {
      en: 'We shared a family meal.',
      pt: 'Partilhamos uma refeição em família.',
      es: 'Compartimos una comida en familia.',
    },
    topic: 'food_drink',
    attribution: ATTR,
  },
  {
    id: 'v_es_1',
    lemma: 'entorno',
    target_language: 'es',
    part_of_speech: 'noun',
    cefr_level: 'B2',
    frequency_rank: 18,
    translations: { en: 'environment', pt: 'entorno / ambiente', es: 'entorno' },
    definitions: {
      en: 'Surroundings or conditions.',
      pt: 'Conjunto de condições ao redor.',
      es: 'Ambiente que rodea a alguien o algo.',
    },
    example_sentence_target: 'Protegemos el entorno natural.',
    example_sentence_translations: {
      en: 'We protect the natural environment.',
      pt: 'Protegemos o entorno natural.',
      es: 'Protegemos el entorno natural.',
    },
    topic: 'daily_life',
    attribution: ATTR,
  },
];

const MOCK_SENTENCES: EverydaySentenceEntry[] = [
  {
    id: 's_en_travel',
    sentence_target: 'Where does the train to Porto depart?',
    target_language: 'en',
    cefr_level: 'A2',
    topic: 'travel',
    translations: {
      en: 'Where does the train to Porto depart?',
      pt: 'De onde parte o trem para o Porto?',
      es: '¿De dónde sale el tren hacia Oporto?',
    },
    attribution: ATTR,
  },
  {
    id: 's_pt_food',
    sentence_target: 'Gostaria de ver a ementa do dia.',
    target_language: 'pt',
    cefr_level: 'A2',
    topic: 'food_drink',
    translations: {
      en: 'I would like to see the daily menu.',
      pt: 'Gostaria de ver a ementa do dia.',
      es: 'Me gustaría ver el menú del día.',
    },
    attribution: ATTR,
  },
  {
    id: 's_es_travel',
    sentence_target: '¿Podría indicarme dónde está la estación central?',
    target_language: 'es',
    cefr_level: 'A2',
    topic: 'travel',
    translations: {
      en: 'Could you tell me where the central station is?',
      pt: 'Poderia indicar-me onde fica a estação central?',
      es: '¿Podría indicarme dónde está la estación central?',
    },
    attribution: ATTR,
  },
];

describe('Multilingual Vocabulary Service', () => {
  const languages: Language[] = ['en', 'pt', 'es'];

  beforeEach(() => {
    VocabularyService.setDynamicCatalog(MOCK_VOCAB_CATALOG, MOCK_SENTENCES);
  });

  afterEach(() => {
    VocabularyService.clearDynamicCatalog();
  });

  it('starts strictly empty when no dynamic or API content has been loaded (zero seeded fixtures)', () => {
    VocabularyService.clearDynamicCatalog();
    languages.forEach(lang => {
      expect(VocabularyService.getVocabulary({ target_language: lang })).toHaveLength(0);
      expect(VocabularyService.getSentences(lang)).toHaveLength(0);
    });
  });

  it('provides vocabulary entries across all supported languages from dynamic store', () => {
    languages.forEach(lang => {
      const vocab = VocabularyService.getVocabulary({ target_language: lang });
      expect(vocab.length).toBeGreaterThan(0);
      vocab.forEach(entry => {
        expect(entry.target_language).toBe(lang);
        expect(entry.lemma).toBeTruthy();
        expect(entry.translations).toBeDefined();
        expect(entry.definitions).toBeDefined();
      });
    });
  });

  it('supports 9-way translation and definition matrix across EN, PT, ES', () => {
    languages.forEach(targetLang => {
      const entries = VocabularyService.getVocabulary({ target_language: targetLang });
      expect(entries.length).toBeGreaterThan(0);

      entries.forEach(entry => {
        languages.forEach(explanationLang => {
          const trans = entry.translations[explanationLang];
          const def = entry.definitions[explanationLang];
          const exTrans = entry.example_sentence_translations[explanationLang];

          expect(trans, `Missing translation for entry ${entry.id} in ${explanationLang}`).toBeDefined();
          expect(trans!.length).toBeGreaterThan(0);
          expect(def, `Missing definition for entry ${entry.id} in ${explanationLang}`).toBeDefined();
          expect(def!.length).toBeGreaterThan(0);
          expect(exTrans, `Missing example translation for entry ${entry.id} in ${explanationLang}`).toBeDefined();
          expect(exTrans!.length).toBeGreaterThan(0);
        });
      });
    });
  });

  it('filters strictly without silent fallback to unrequested target language', () => {
    const ptVocab = VocabularyService.getVocabulary({ target_language: 'pt' });
    expect(ptVocab.every(v => v.target_language === 'pt')).toBe(true);

    const esVocab = VocabularyService.getVocabulary({ target_language: 'es' });
    expect(esVocab.every(v => v.target_language === 'es')).toBe(true);

    const enVocab = VocabularyService.getVocabulary({ target_language: 'en' });
    expect(enVocab.every(v => v.target_language === 'en')).toBe(true);

    const empty = VocabularyService.getVocabulary({
      target_language: 'en',
      search_query: 'xyznonexistentword12345',
    });
    expect(empty).toEqual([]);
  });

  it('retrieves Top 200 ranked vocabulary in ascending order', () => {
    languages.forEach(lang => {
      const top200 = VocabularyService.getTop200(lang);
      expect(top200.length).toBeGreaterThan(0);
      for (let i = 1; i < top200.length; i++) {
        const prev = top200[i - 1].frequency_rank || 999;
        const curr = top200[i].frequency_rank || 999;
        expect(curr).toBeGreaterThanOrEqual(prev);
      }
    });
  });

  it('retrieves everyday sentences for all languages with 9-way translations', () => {
    languages.forEach(lang => {
      const sentences = VocabularyService.getSentences(lang);
      expect(sentences.length).toBeGreaterThan(0);

      sentences.forEach(sent => {
        expect(sent.target_language).toBe(lang);
        languages.forEach(expLang => {
          expect(sent.translations[expLang]).toBeDefined();
          expect(sent.translations[expLang]!.length).toBeGreaterThan(0);
        });
      });
    });
  });

  it('filters everyday sentences by topic and CEFR level', () => {
    const travelSentences = VocabularyService.getSentences('en', 'travel', 'all');
    expect(travelSentences.length).toBeGreaterThan(0);
    expect(travelSentences.every(s => s.topic === 'travel')).toBe(true);

    const foodSentences = VocabularyService.getSentences('pt', 'food_drink', 'all');
    expect(foodSentences.length).toBeGreaterThan(0);
    expect(foodSentences.every(s => s.topic === 'food_drink')).toBe(true);
  });

  it('calculates available counts accurately', () => {
    const counts = VocabularyService.getAvailableCounts('en');
    expect(counts.totalVocab).toBeGreaterThan(0);
    expect(counts.top200).toBeGreaterThan(0);
    expect(counts.sentences).toBeGreaterThan(0);
  });
});

vi.mock('jspdf', () => {
  class MockJsPdf {
    internal = {
      pageSize: { getWidth: () => 210, getHeight: () => 297 },
      getNumberOfPages: () => 1,
    };
    setFont = vi.fn();
    setFontSize = vi.fn();
    setTextColor = vi.fn();
    setDrawColor = vi.fn();
    setFillColor = vi.fn();
    setLineWidth = vi.fn();
    line = vi.fn();
    text = vi.fn();
    roundedRect = vi.fn();
    splitTextToSize = vi.fn((text: string) => [text]);
    addPage = vi.fn();
    setPage = vi.fn();
    save = vi.fn();
  }
  return { jsPDF: MockJsPdf };
});

describe('Client-Side PDF Service', () => {
  it('generates vocabulary PDF study pack without error', () => {
    VocabularyService.setDynamicCatalog(MOCK_VOCAB_CATALOG, MOCK_SENTENCES);
    expect(() => {
      PdfService.generatePdf({
        target_language: 'en',
        explanation_language: 'pt',
        cefr_level: 'all',
        topic: 'all',
        part_of_speech: 'all',
        resource_type: 'top_200',
        include_translations: true,
        include_definitions: true,
        include_examples: true,
        include_grammar_notes: true,
        include_practice_quiz: true,
        title: 'Custom English Guide for Portuguese Speakers',
      });
    }).not.toThrow();
  });

  it('generates sentences PDF pack with answer key without error', () => {
    VocabularyService.setDynamicCatalog(MOCK_VOCAB_CATALOG, MOCK_SENTENCES);
    expect(() => {
      PdfService.generatePdf({
        target_language: 'es',
        explanation_language: 'en',
        cefr_level: 'A2',
        topic: 'travel',
        part_of_speech: 'all',
        resource_type: 'all',
        include_translations: true,
        include_definitions: false,
        include_examples: true,
        include_grammar_notes: true,
        include_practice_quiz: true,
      });
    }).not.toThrow();
  });
});
