import { VOCABULARY_CATALOG } from '../data/vocabularyData';
import { EVERYDAY_SENTENCES } from '../data/sentencesData';
import {
  VocabularyEntry,
  EverydaySentenceEntry,
  VocabularyFilterState,
  VocabularyTopic,
  VocabularyPartOfSpeech,
} from '../types/vocabulary';
import { Language, CEFRLevel } from '../types';

export class VocabularyService {
  /**
   * Filter vocabulary strictly based on user-selected criteria.
   * Never silently fall back to an unrequested language.
   */
  static getVocabulary(filters: VocabularyFilterState = {}): VocabularyEntry[] {
    return VOCABULARY_CATALOG.filter(entry => {
      // Target Language
      if (filters.target_language && entry.target_language !== filters.target_language) {
        return false;
      }

      // CEFR Level
      if (filters.cefr_level && filters.cefr_level !== 'all' && entry.cefr_level !== filters.cefr_level) {
        return false;
      }

      // Part of Speech
      if (filters.part_of_speech && filters.part_of_speech !== 'all' && entry.part_of_speech !== filters.part_of_speech) {
        return false;
      }

      // Topic
      if (filters.topic && filters.topic !== 'all' && entry.topic !== filters.topic) {
        return false;
      }

      // Top 200 filter
      if (filters.is_top_200 && (entry.frequency_rank === undefined || entry.frequency_rank > 200)) {
        return false;
      }

      // Search Query
      if (filters.search_query && filters.search_query.trim() !== '') {
        const query = filters.search_query.toLowerCase().trim();
        const matchesLemma = entry.lemma.toLowerCase().includes(query);
        const matchesTranslation = Object.values(entry.translations).some(t => t.toLowerCase().includes(query));
        const matchesDefinition = Object.values(entry.definitions).some(d => d.toLowerCase().includes(query));
        const matchesExample = entry.example_sentence_target.toLowerCase().includes(query);

        if (!matchesLemma && !matchesTranslation && !matchesDefinition && !matchesExample) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Get curated Top 200 list for the target language.
   */
  static getTop200(targetLang: Language): VocabularyEntry[] {
    return this.getVocabulary({ target_language: targetLang, is_top_200: true })
      .sort((a, b) => (a.frequency_rank || 999) - (b.frequency_rank || 999));
  }

  /**
   * Get everyday sentences with optional filters.
   */
  static getSentences(
    targetLang: Language,
    topic: VocabularyTopic | 'all' = 'all',
    level: CEFRLevel | 'all' = 'all',
    search: string = ''
  ): EverydaySentenceEntry[] {
    return EVERYDAY_SENTENCES.filter(sent => {
      if (sent.target_language !== targetLang) return false;
      if (topic !== 'all' && sent.topic !== topic) return false;
      if (level !== 'all' && sent.cefr_level !== level) return false;

      if (search && search.trim() !== '') {
        const q = search.toLowerCase().trim();
        const matchTarget = sent.sentence_target.toLowerCase().includes(q);
        const matchTrans = Object.values(sent.translations).some(t => t.toLowerCase().includes(q));
        if (!matchTarget && !matchTrans) return false;
      }

      return true;
    });
  }

  /**
   * Get distinct topics.
   */
  static getTopics(): VocabularyTopic[] {
    return [
      'daily_life',
      'food_drink',
      'travel',
      'work',
      'education',
      'family',
      'health',
      'shopping',
      'culture',
      'technology',
      'social',
    ];
  }

  /**
   * Get distinct parts of speech.
   */
  static getPartsOfSpeech(): VocabularyPartOfSpeech[] {
    return [
      'noun',
      'verb',
      'adjective',
      'adverb',
      'pronoun',
      'preposition',
      'conjunction',
      'expression',
      'numeral',
    ];
  }

  /**
   * Get actual item counts for a target language.
   */
  static getAvailableCounts(targetLang: Language): { totalVocab: number; top200: number; sentences: number } {
    const vocab = VOCABULARY_CATALOG.filter(v => v.target_language === targetLang);
    const top200 = vocab.filter(v => (v.frequency_rank || 999) <= 200);
    const sentences = EVERYDAY_SENTENCES.filter(s => s.target_language === targetLang);

    return {
      totalVocab: vocab.length,
      top200: top200.length,
      sentences: sentences.length,
    };
  }
}
