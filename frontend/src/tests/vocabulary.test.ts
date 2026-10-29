import { describe, it, expect, vi } from 'vitest';
import { VocabularyService } from '../services/vocabularyService';
import { PdfService } from '../services/pdfService';
import { jsPDF } from 'jspdf';
import { Language } from '../types';

describe('Multilingual Vocabulary Service', () => {
  const languages: Language[] = ['en', 'pt', 'es'];

  it('provides vocabulary entries across all supported languages', () => {
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
          expect(typeof trans).toBe('string');
          expect(trans.length).toBeGreaterThan(0);

          expect(def, `Missing definition for entry ${entry.id} in ${explanationLang}`).toBeDefined();
          expect(typeof def).toBe('string');
          expect(def.length).toBeGreaterThan(0);

          expect(exTrans, `Missing example translation for entry ${entry.id} in ${explanationLang}`).toBeDefined();
          expect(typeof exTrans).toBe('string');
          expect(exTrans.length).toBeGreaterThan(0);
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

    // Unmatched search query returns empty array
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
          expect(sent.translations[expLang].length).toBeGreaterThan(0);
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
    expect(() => {
      PdfService.generatePdf({
        target_language: 'es',
        explanation_language: 'en',
        cefr_level: 'A1',
        topic: 'food_drink',
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
