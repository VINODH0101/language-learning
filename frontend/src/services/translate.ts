/**
 * Lexilume — Translation & Cross-Linguistic Search Service.
 *
 * Searches AI Content Engine generated vocabulary, saved IndexedDB phrasebook,
 * and live open external APIs (MyMemory, Wiktionary/FreeDictionary/Dicionário Aberto, Tatoeba).
 * Zero static seed fixtures.
 */

import type { EnglishLearningChallenge } from '../data/translationData';
import { StorageService } from './storage';
import { MyMemoryAdapter } from '../integrations/external-apis/adapters/mymemory/MyMemoryAdapter';
import { ExamplesManager } from './providers/examples/examplesManager';
import { contentAccess } from './contentAccess';
import { VocabularyService } from './vocabularyService';
import { localDb } from './localDb';

const myMemoryAdapter = new MyMemoryAdapter();
const examplesManager = ExamplesManager.getInstance();

export type TranslationDirection = 'pt-en' | 'es-en' | 'en-pt' | 'en-es' | 'pt-es' | 'es-pt' | 'all';

export interface SearchResultItem {
  id: string;
  sourceText: string;
  sourceLang: 'pt' | 'es' | 'en';
  targetText: string;
  targetLang: 'pt' | 'es' | 'en';
  partOfSpeech?: string;
  phoneticTarget?: string;
  exampleSource?: string;
  exampleTarget?: string;
  falseFriendWarning?: string;
  category?: string;
  notes?: string;
  isVerified?: boolean;
  isApproximate?: boolean;
  providerName?: string;
  fromCache?: boolean;
}

export interface TranslateOnlineResult {
  translatedText: string;
  sourceLang: 'pt' | 'es' | 'en';
  targetLang: 'pt' | 'es' | 'en';
  providerName: 'dictionary' | 'mymemory' | 'content_engine' | 'fallback';
  isVerified: boolean;
  isApproximate: boolean;
  notes?: string;
  fromCache?: boolean;
}

// In-memory bounded cache for live translations & indexed live results
const translationMemoryCache = new Map<string, TranslateOnlineResult>();
const dynamicSearchIndex = new Map<string, SearchResultItem>();

function parseDirection(direction: TranslationDirection): {
  src: 'pt' | 'es' | 'en';
  tgt: 'pt' | 'es' | 'en';
} {
  if (direction === 'all') return { src: 'pt', tgt: 'en' };
  const [src, tgt] = direction.split('-') as ['pt' | 'es' | 'en', 'pt' | 'es' | 'en'];
  return { src, tgt };
}

export class TranslationService {
  /**
   * Synchronously searches cached live/generated results already indexed in memory.
   */
  static search(query: string, direction: TranslationDirection = 'all'): SearchResultItem[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const results: SearchResultItem[] = [];
    for (const item of dynamicSearchIndex.values()) {
      const dirMatch =
        direction === 'all' || `${item.sourceLang}-${item.targetLang}` === direction;
      if (!dirMatch) continue;
      if (
        item.sourceText.toLowerCase().includes(q) ||
        item.targetText.toLowerCase().includes(q)
      ) {
        results.push(item);
      }
    }
    return results;
  }

  /**
   * Asynchronously searches AI Content Engine generated vocabulary, saved IndexedDB entries,
   * Tatoeba example sentences, and live MyMemory translation memory.
   */
  static async searchLive(
    query: string,
    direction: TranslationDirection = 'all'
  ): Promise<SearchResultItem[]> {
    const clean = query.trim();
    const q = clean.toLowerCase();
    if (!q) return [];

    const results: SearchResultItem[] = [];
    const seenKeys = new Set<string>();
    const addResult = (item: SearchResultItem) => {
      const k = `${item.sourceLang}:${item.targetLang}:${item.sourceText.toLowerCase()}`;
      if (seenKeys.has(k)) return;
      seenKeys.add(k);
      dynamicSearchIndex.set(item.id, item);
      results.push(item);
    };

    const { src, tgt } = parseDirection(direction);
    const langsToCheck: Array<{ s: 'pt' | 'es' | 'en'; t: 'pt' | 'es' | 'en' }> =
      direction === 'all'
        ? [
            { s: 'pt', t: 'en' },
            { s: 'es', t: 'en' },
            { s: 'en', t: 'pt' },
            { s: 'en', t: 'es' },
          ]
        : [{ s: src, t: tgt }];

    // 1. Saved Phrasebook in IndexedDB
    try {
      const saved = await localDb.savedVocabulary.toArray();
      for (const rec of saved) {
        if (
          rec.source_text.toLowerCase().includes(q) ||
          rec.translated_text.toLowerCase().includes(q)
        ) {
          if (
            direction === 'all' ||
            (rec.source_lang === src && rec.target_lang === tgt)
          ) {
            addResult({
              id: `saved-${rec.id}`,
              sourceText: rec.source_text,
              sourceLang: rec.source_lang as 'pt' | 'es' | 'en',
              targetText: rec.translated_text,
              targetLang: rec.target_lang as 'pt' | 'es' | 'en',
              partOfSpeech: rec.part_of_speech,
              phoneticTarget: rec.phonetic_ipa,
              exampleSource: rec.context_sentence,
              isVerified: rec.is_verified,
              providerName: 'saved_phrasebook',
            });
          }
        }
      }
    } catch {
      // IndexedDB unavailable in non-browser context
    }

    // 2. Published AI Content Engine & dynamic VocabularyService catalog
    for (const pair of langsToCheck) {
      try {
        const aiVocab = await contentAccess.getPublishedVocabularyEntries(pair.s, pair.t);
        const dynamicVocab = VocabularyService.getVocabulary({ target_language: pair.s });
        const mergedVocab = [...aiVocab];
        for (const dv of dynamicVocab) {
          if (!mergedVocab.some(m => m.id === dv.id || m.lemma.toLowerCase() === dv.lemma.toLowerCase())) {
            mergedVocab.push(dv);
          }
        }
        for (const voc of mergedVocab) {
          const translation =
            voc.translations[pair.t] || voc.definitions[pair.t] || voc.translations.en || voc.definitions.en || '';
          if (
            voc.lemma.toLowerCase().includes(q) ||
            translation.toLowerCase().includes(q)
          ) {
            addResult({
              id: `ai-${voc.id}-${pair.s}-${pair.t}`,
              sourceText: voc.lemma,
              sourceLang: pair.s,
              targetText: translation,
              targetLang: pair.t,
              partOfSpeech: voc.part_of_speech,
              phoneticTarget: voc.phonetic_ipa,
              exampleSource: voc.example_sentence_target,
              exampleTarget: voc.example_sentence_translations[pair.t],
              notes: voc.grammar_notes,
              isVerified: true,
              providerName: 'content_engine',
            });
          }
        }
      } catch {
        // Offline / backend unreachable
      }
    }

    // 3. Live Tatoeba Open Corpus Examples
    try {
      const pairs = await examplesManager.getExamples({
        query: clean,
        sourceLang: src,
        targetLang: tgt,
        limit: 5,
      });
      pairs.forEach((p, idx) => {
        addResult({
          id: `tatoeba-${src}-${tgt}-${idx}-${p.id}`,
          sourceText: p.sourceText,
          sourceLang: src,
          targetText: p.targetText,
          targetLang: tgt,
          category: 'corpus_example',
          notes: p.attribution,
          isVerified: p.isPedagogicallyVerified,
          providerName: 'tatoeba',
        });
      });
    } catch {
      // Ignore network/rate limit errors
    }

    // 4. Live MyMemory Translation Memory lookup if no exact hit yet
    if (results.length === 0) {
      try {
        const resp = await myMemoryAdapter.execute({
          text: clean,
          sourceLang: src,
          targetLang: tgt,
        });
        if (resp.translatedText && resp.provider !== 'fallback') {
          addResult({
            id: `mymemory-${src}-${tgt}-${q}`,
            sourceText: clean,
            sourceLang: src,
            targetText: resp.translatedText,
            targetLang: tgt,
            notes: resp.notes,
            isVerified: resp.isVerified,
            isApproximate: resp.isApproximate,
            providerName: resp.provider,
            fromCache: resp.fromCache,
          });
        }
      } catch {
        // Propagate empty honestly when offline
      }
    }

    return results;
  }

  /**
   * Fetches interactive English practice challenges published in the AI Content Engine.
   */
  static async getLiveChallenges(lang?: 'pt' | 'es'): Promise<EnglishLearningChallenge[]> {
    try {
      const exercises = await contentAccess.getPublishedPracticeExercises('en');
      const mapped: EnglishLearningChallenge[] = exercises.map(ex => ({
        id: ex.id,
        source_lang: lang || 'pt',
        source_text: ex.context_passage || ex.prompt,
        target_english: ex.acceptable_solutions[0] || '',
        accepted_answers: ex.acceptable_solutions,
        options: [
          ex.acceptable_solutions[0],
          ...(ex.distractors || []).map(d => d.text),
        ].filter(Boolean),
        explanation_pt: ex.explanation,
        explanation_es: ex.explanation,
        common_transfer_mistake: ex.distractors?.[0]?.why_incorrect || '',
        topic: ex.curriculum_node_id || 'AI Content Practice',
      }));
      return lang ? mapped.filter(c => c.source_lang === lang) : mapped;
    } catch {
      return [];
    }
  }

  /**
   * Check learner's answer to a dynamically loaded English translation challenge.
   */
  static checkChallenge(
    challenge: EnglishLearningChallenge,
    submittedAnswer: string
  ): { isCorrect: boolean; feedback: string } {
    const cleanSub = submittedAnswer.trim().toLowerCase().replace(/[.,!?;:]/g, '');
    const isAccepted = challenge.accepted_answers.some(
      ans => ans.trim().toLowerCase().replace(/[.,!?;:]/g, '') === cleanSub
    );

    if (isAccepted) {
      return {
        isCorrect: true,
        feedback: 'Correct! Your grammar and lexical choice match standard English usage.',
      };
    }

    return {
      isCorrect: false,
      feedback: `"${challenge.target_english}". ${
        challenge.source_lang === 'pt' ? challenge.explanation_pt : challenge.explanation_es
      }`,
    };
  }

  /**
   * Translate text via AI Content Engine cache/dictionary first, then live MyMemory API.
   */
  static async translateOnline(
    text: string,
    sourceLang: 'pt' | 'es' | 'en',
    targetLang: 'pt' | 'es' | 'en',
    isRegistered: boolean = false
  ): Promise<{ success: boolean; result?: TranslateOnlineResult; error?: string }> {
    const cleanText = text.trim();
    if (!cleanText) {
      return { success: false, error: 'Text for translation cannot be empty.' };
    }

    // 1. Enforce max input length (1,000 chars)
    if (cleanText.length > 1000) {
      return {
        success: false,
        error: `Text exceeds maximum allowed limit of 1,000 characters (${cleanText.length} sent).`,
      };
    }

    // 2. Check local in-memory cache
    const cacheKey = `${sourceLang}:${targetLang}:${cleanText.toLowerCase()}`;
    if (translationMemoryCache.has(cacheKey)) {
      const cached = translationMemoryCache.get(cacheKey)!;
      return { success: true, result: { ...cached, fromCache: true } };
    }

    // 3. Check published AI Content Engine vocabulary
    try {
      const aiVocab = await contentAccess.getPublishedVocabularyEntries(sourceLang, targetLang);
      const exactVocab = aiVocab.find(
        v => v.lemma.trim().toLowerCase() === cleanText.toLowerCase()
      );
      if (exactVocab) {
        const translated =
          exactVocab.translations[targetLang] ||
          exactVocab.definitions[targetLang] ||
          exactVocab.definitions.en;
        if (translated) {
          const verifiedResult: TranslateOnlineResult = {
            translatedText: translated,
            sourceLang,
            targetLang,
            providerName: 'content_engine',
            isVerified: true,
            isApproximate: false,
            notes: exactVocab.example_sentence_target,
          };
          translationMemoryCache.set(cacheKey, verifiedResult);
          return { success: true, result: verifiedResult };
        }
      }
    } catch {
      // Fall through to live API
    }

    // 4. Check indexed live results
    const dir = `${sourceLang}-${targetLang}` as TranslationDirection;
    const dictMatches = this.search(cleanText, dir).filter(
      m => m.sourceText.trim().toLowerCase() === cleanText.toLowerCase()
    );
    if (dictMatches.length > 0) {
      const best = dictMatches[0];
      const verifiedResult: TranslateOnlineResult = {
        translatedText: best.targetText,
        sourceLang,
        targetLang,
        providerName: 'dictionary',
        isVerified: Boolean(best.isVerified),
        isApproximate: Boolean(best.isApproximate),
        notes: best.notes || best.falseFriendWarning,
      };
      translationMemoryCache.set(cacheKey, verifiedResult);
      return { success: true, result: verifiedResult };
    }

    // 5. Check and consume daily ephemeral quota
    const quotaOk = StorageService.consumeTranslationQuotaToken(isRegistered);
    if (!quotaOk) {
      const quota = StorageService.getTranslationQuotaStatus(isRegistered);
      return {
        success: false,
        error: `Daily translation quota reached (${quota.limit} lookups/day).`,
      };
    }

    // 6. Query live external MyMemory API
    try {
      const adapterResult = await myMemoryAdapter.execute({
        text: cleanText,
        sourceLang,
        targetLang,
      });

      const apiResult: TranslateOnlineResult = {
        translatedText: adapterResult.translatedText,
        sourceLang,
        targetLang,
        providerName: (adapterResult.provider === 'mymemory' ? 'mymemory' : 'fallback') as
          | 'mymemory'
          | 'fallback',
        isVerified: adapterResult.isVerified,
        isApproximate: adapterResult.isApproximate,
        notes: adapterResult.notes,
        fromCache: adapterResult.fromCache,
      };

      if (translationMemoryCache.size > 500) {
        translationMemoryCache.clear();
      }
      translationMemoryCache.set(cacheKey, apiResult);
      return { success: true, result: apiResult };
    } catch (e) {
      console.warn('MyMemory adapter request error:', e);
    }

    // 7. Honest offline fallback
    return {
      success: true,
      result: {
        translatedText: cleanText,
        sourceLang,
        targetLang,
        providerName: 'fallback',
        isVerified: false,
        isApproximate: true,
        notes: 'Live translation temporarily unavailable offline.',
      },
    };
  }
}
