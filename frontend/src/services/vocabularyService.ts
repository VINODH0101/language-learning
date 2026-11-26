import {
  VocabularyEntry,
  EverydaySentenceEntry,
  VocabularyFilterState,
  VocabularyTopic,
  VocabularyPartOfSpeech,
} from '../types/vocabulary';
import { Language, CEFRLevel } from '../types';
import { contentAccess } from './contentAccess';
import { localDb, getCachedApiResponse, setCachedApiResponse } from './localDb';
import { ExamplesManager } from './providers/examples/examplesManager';
import { DictionaryManager } from './providers/dictionary/dictionaryManager';
import { FrequencyManager } from './providers/frequency/frequencyManager';

const dynamicVocabStore = new Map<string, VocabularyEntry>();
const dynamicSentenceStore = new Map<string, EverydaySentenceEntry>();

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export class VocabularyService {
  /**
   * Registers dynamically loaded or generated entries into the active in-memory catalog.
   */
  static setDynamicCatalog(
    vocab: VocabularyEntry[] = [],
    sentences: EverydaySentenceEntry[] = []
  ): void {
    for (const v of vocab) {
      dynamicVocabStore.set(v.id, v);
    }
    for (const s of sentences) {
      dynamicSentenceStore.set(s.id, s);
    }
  }

  /**
   * Clears dynamic in-memory catalog state (useful between tests or user track resets).
   */
  static clearDynamicCatalog(): void {
    dynamicVocabStore.clear();
    dynamicSentenceStore.clear();
  }

  /**
   * Loads live vocabulary and example sentences from:
   * 1) Published AI Content Engine entries
   * 2) User saved Phrasebook in IndexedDB
   * 3) Live open APIs (Wiktionary / FreeDictionary / Dicionário Aberto + Tatoeba)
   *    and IndexedDB API cache for offline persistence.
   */
  static async loadLiveCatalog(
    targetLang: Language,
    explanationLang: Language = 'en',
    query?: string
  ): Promise<{ vocabulary: VocabularyEntry[]; sentences: EverydaySentenceEntry[] }> {
    const cacheKey = `vocab_bundle:${targetLang}:${explanationLang}`;

    // 1. Restore cached live entries from Dexie if available
    try {
      const cached = (await getCachedApiResponse(
        'vocabulary_service',
        cacheKey
      )) as {
        vocabulary?: VocabularyEntry[];
        sentences?: EverydaySentenceEntry[];
      } | null;
      if (cached) {
        this.setDynamicCatalog(cached.vocabulary || [], cached.sentences || []);
      }
    } catch {
      // IndexedDB unavailable in headless contexts
    }

    // 2. Published AI Content Engine entries
    try {
      const aiVocab = await contentAccess.getPublishedVocabularyEntries(
        targetLang,
        explanationLang
      );
      for (const item of aiVocab) {
        dynamicVocabStore.set(item.id, item);
      }
    } catch {
      // Backend/Supabase optional offline
    }

    // 3. Saved IndexedDB Phrasebook entries
    try {
      const saved = await localDb.savedVocabulary.toArray();
      for (const s of saved) {
        if (s.source_lang !== targetLang) continue;
        const entryId = `saved-voc-${s.id}`;
        dynamicVocabStore.set(entryId, {
          id: entryId,
          lemma: s.source_text,
          target_language: targetLang,
          part_of_speech: (s.part_of_speech as VocabularyPartOfSpeech) || 'noun',
          cefr_level: 'B1',
          phonetic_ipa: s.phonetic_ipa,
          translations: { [s.target_lang]: s.translated_text },
          definitions: { [s.target_lang]: s.translated_text },
          example_sentence_target: s.context_sentence || s.source_text,
          example_sentence_translations: { [s.target_lang]: s.translated_text },
          topic: 'daily_life',
          attribution: {
            source_name: 'Personal Phrasebook',
            source_url: 'local',
            license_type: 'User-Curated',
            attribution_text: 'Saved by learner in IndexedDB.',
          },
        });
      }
    } catch {
      // Ignore if IndexedDB disabled
    }

    // 4. Query Open APIs (Dictionary + Tatoeba) when search query is supplied
    const cleanQuery = (query || '').trim();
    if (cleanQuery) {
      const freqMgr = FrequencyManager.getInstance();
      const dictMgr = DictionaryManager.getInstance();
      const exMgr = ExamplesManager.getInstance();

      const [dictRes, tatoebaRes] = await Promise.allSettled([
        dictMgr.lookup(cleanQuery, targetLang),
        exMgr.getExamples({
          query: cleanQuery,
          sourceLang: targetLang,
          targetLang: explanationLang,
          limit: 6,
        }),
      ]);

      const sentencesFromTatoeba =
        tatoebaRes.status === 'fulfilled' ? tatoebaRes.value : [];

      for (const pair of sentencesFromTatoeba) {
        const sentId = pair.id || `tatoeba-${targetLang}-${pair.sourceText.slice(0, 24)}`;
        dynamicSentenceStore.set(sentId, {
          id: sentId,
          sentence_target: pair.sourceText,
          target_language: targetLang,
          translations: {
            [targetLang]: pair.sourceText,
            [explanationLang]: pair.targetText,
          },
          cefr_level: 'B1',
          topic: 'daily_life',
          attribution: {
            source_name: 'Tatoeba / OPUS Open Corpus',
            source_url: 'https://tatoeba.org',
            license_type: 'CC-BY 2.0 FR',
            attribution_text: pair.attribution || 'Tatoeba Project',
          },
        });
      }

      if (dictRes.status === 'fulfilled' && dictRes.value) {
        const entry = dictRes.value;
        const firstMeaning = entry.meanings?.[0];
        const freq = await freqMgr
          .getWordFrequency({ word: entry.word, language: targetLang })
          .catch(() => null);
        const firstExample = sentencesFromTatoeba[0];
        const defText = firstMeaning?.definitions?.[0] || '';
        const vocabId = `api-voc-${targetLang}-${entry.word.toLowerCase()}`;

        dynamicVocabStore.set(vocabId, {
          id: vocabId,
          lemma: entry.word,
          target_language: targetLang,
          part_of_speech: (firstMeaning?.partOfSpeech as VocabularyPartOfSpeech) || 'noun',
          cefr_level: freq && freq.rank <= 500 ? 'A1' : freq && freq.rank <= 2000 ? 'B1' : 'B2',
          frequency_rank: freq?.rank,
          phonetic_ipa: entry.phonetic,
          translations: { [explanationLang]: firstExample?.targetText || defText },
          definitions: {
            [explanationLang]: defText || firstExample?.targetText || entry.word,
          },
          example_sentence_target:
            firstExample?.sourceText || firstMeaning?.examples?.[0] || entry.word,
          example_sentence_translations: {
            [explanationLang]: firstExample?.targetText || defText,
          },
          topic: 'daily_life',
          attribution: {
            source_name: entry.provider || 'Open Dictionary API',
            source_url: entry.sourceUrl || 'https://www.wiktionary.org',
            license_type: 'CC-BY-SA 4.0',
            attribution_text: `Retrieved live via ${entry.provider || 'Open Dictionary API'}.`,
          },
        });
      }
    }

    const vocabulary = this.getVocabulary({ target_language: targetLang });
    const sentences = this.getSentences(targetLang);

    // 5. Persist refreshed bundle in IndexedDB for offline access
    try {
      await setCachedApiResponse(
        'vocabulary_service',
        cacheKey,
        { vocabulary, sentences },
        CACHE_TTL_MS
      );
    } catch {
      // Ignore cache failure
    }

    return { vocabulary, sentences };
  }

  /**
   * Queries dynamic & cached vocabulary strictly scoped to target_language.
   */
  static getVocabulary(filters: VocabularyFilterState = {}): VocabularyEntry[] {
    const all = Array.from(dynamicVocabStore.values());
    return all.filter(entry => {
      if (filters.target_language && entry.target_language !== filters.target_language) {
        return false;
      }

      if (filters.cefr_level && filters.cefr_level !== 'all') {
        if (entry.cefr_level !== filters.cefr_level) return false;
      }

      if (filters.part_of_speech && filters.part_of_speech !== 'all') {
        if (entry.part_of_speech !== filters.part_of_speech) return false;
      }

      if (filters.topic && filters.topic !== 'all') {
        if (entry.topic !== filters.topic) return false;
      }

      if (filters.is_top_200) {
        if (!entry.frequency_rank || entry.frequency_rank > 200) return false;
      }

      if (filters.search_query && filters.search_query.trim().length > 0) {
        const q = filters.search_query.toLowerCase().trim();
        const matchesLemma = entry.lemma.toLowerCase().includes(q);
        const matchesTrans = Object.values(entry.translations).some(
          t => t && t.toLowerCase().includes(q)
        );
        const matchesDef = Object.values(entry.definitions).some(
          d => d && d.toLowerCase().includes(q)
        );
        const matchesEx = entry.example_sentence_target.toLowerCase().includes(q);

        if (!matchesLemma && !matchesTrans && !matchesDef && !matchesEx) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Retrieves Top 200 frequency-ranked dynamic/cached vocabulary for a target language.
   */
  static getTop200(targetLang: Language): VocabularyEntry[] {
    return this.getVocabulary({ target_language: targetLang, is_top_200: true }).sort(
      (a, b) => (a.frequency_rank || 9999) - (b.frequency_rank || 9999)
    );
  }

  /**
   * Retrieves everyday/corpus example sentences filtered by language, topic, and CEFR level.
   */
  static getSentences(
    targetLang: Language,
    topic: VocabularyTopic | 'all' = 'all',
    cefrLevel: CEFRLevel | 'all' = 'all',
    searchQuery?: string
  ): EverydaySentenceEntry[] {
    const all = Array.from(dynamicSentenceStore.values());
    return all.filter(sent => {
      if (sent.target_language !== targetLang) return false;
      if (topic !== 'all' && sent.topic !== topic) return false;
      if (cefrLevel !== 'all' && sent.cefr_level !== cefrLevel) return false;

      if (searchQuery && searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTarget = sent.sentence_target.toLowerCase().includes(q);
        const matchesTrans = Object.values(sent.translations).some(
          t => t && t.toLowerCase().includes(q)
        );
        if (!matchesTarget && !matchesTrans) return false;
      }

      return true;
    });
  }

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

  static getAvailableCounts(targetLang: Language): {
    totalVocab: number;
    top200: number;
    sentences: number;
  } {
    const vocab = this.getVocabulary({ target_language: targetLang });
    const top200 = vocab.filter(v => (v.frequency_rank || 999) <= 200);
    const sentences = this.getSentences(targetLang);

    return {
      totalVocab: vocab.length,
      top200: top200.length,
      sentences: sentences.length,
    };
  }
}
