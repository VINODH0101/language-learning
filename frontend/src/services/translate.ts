/**
 * Polyglot C1 Daily — Translation & English Learning Service.
 * 
 * Provides search, cross-linguistic lookup, and interactive English practice
 * for Portuguese and Spanish native speakers.
 */

import { trilingualDictionary, englishChallenges, TrilingualEntry, EnglishLearningChallenge } from '../data/translationData';
import { ptVocabulary, esVocabulary, falseFriends } from '../data/seedData';
import { StorageService } from './storage';
import { MyMemoryAdapter } from '../integrations/external-apis/adapters/mymemory/MyMemoryAdapter';

const myMemoryAdapter = new MyMemoryAdapter();

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
  providerName: 'dictionary' | 'mymemory' | 'fallback';
  isVerified: boolean;
  isApproximate: boolean;
  notes?: string;
  fromCache?: boolean;
}

// In-memory bounded cache for translation queries
const translationMemoryCache = new Map<string, TranslateOnlineResult>();

export class TranslationService {
  /**
   * Search through trilingual corpus, seed vocabulary, and false friends.
   */
  static search(query: string, direction: TranslationDirection = 'all'): SearchResultItem[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const results: SearchResultItem[] = [];
    const seenIds = new Set<string>();

    // 1. Search trilingual dictionary
    for (const item of trilingualDictionary) {
      const matchEn = item.english.toLowerCase().includes(q);
      const matchPt = item.portuguese.toLowerCase().includes(q);
      const matchEs = item.spanish.toLowerCase().includes(q);

      if (direction === 'pt-en' && matchPt) {
        results.push({
          id: `tri-${item.id}-pt-en`,
          sourceText: item.portuguese,
          sourceLang: 'pt',
          targetText: item.english,
          targetLang: 'en',
          partOfSpeech: item.part_of_speech,
          phoneticTarget: item.phonetic_en,
          exampleSource: item.example_pt,
          exampleTarget: item.example_en,
          category: item.category,
          notes: item.notes_for_pt_speakers,
        });
        seenIds.add(item.id);
      } else if (direction === 'es-en' && matchEs) {
        results.push({
          id: `tri-${item.id}-es-en`,
          sourceText: item.spanish,
          sourceLang: 'es',
          targetText: item.english,
          targetLang: 'en',
          partOfSpeech: item.part_of_speech,
          phoneticTarget: item.phonetic_en,
          exampleSource: item.example_es,
          exampleTarget: item.example_en,
          category: item.category,
          notes: item.notes_for_es_speakers,
        });
        seenIds.add(item.id);
      } else if (direction === 'en-pt' && matchEn) {
        results.push({
          id: `tri-${item.id}-en-pt`,
          sourceText: item.english,
          sourceLang: 'en',
          targetText: item.portuguese,
          targetLang: 'pt',
          partOfSpeech: item.part_of_speech,
          phoneticTarget: item.phonetic_pt,
          exampleSource: item.example_en,
          exampleTarget: item.example_pt,
          category: item.category,
          notes: item.notes_for_pt_speakers,
        });
        seenIds.add(item.id);
      } else if (direction === 'en-es' && matchEn) {
        results.push({
          id: `tri-${item.id}-en-es`,
          sourceText: item.english,
          sourceLang: 'en',
          targetText: item.spanish,
          targetLang: 'es',
          partOfSpeech: item.part_of_speech,
          phoneticTarget: item.phonetic_es,
          exampleSource: item.example_en,
          exampleTarget: item.example_es,
          category: item.category,
          notes: item.notes_for_es_speakers,
        });
        seenIds.add(item.id);
      } else if (direction === 'pt-es' && matchPt) {
        results.push({
          id: `tri-${item.id}-pt-es`,
          sourceText: item.portuguese,
          sourceLang: 'pt',
          targetText: item.spanish,
          targetLang: 'es',
          partOfSpeech: item.part_of_speech,
          phoneticTarget: item.phonetic_es,
          exampleSource: item.example_pt,
          exampleTarget: item.example_es,
          category: item.category,
          notes: item.notes_for_pt_speakers,
        });
        seenIds.add(item.id);
      } else if (direction === 'es-pt' && matchEs) {
        results.push({
          id: `tri-${item.id}-es-pt`,
          sourceText: item.spanish,
          sourceLang: 'es',
          targetText: item.portuguese,
          targetLang: 'pt',
          partOfSpeech: item.part_of_speech,
          phoneticTarget: item.phonetic_pt,
          exampleSource: item.example_es,
          exampleTarget: item.example_pt,
          category: item.category,
          notes: item.notes_for_es_speakers,
        });
        seenIds.add(item.id);
      } else if (direction === 'all' && (matchEn || matchPt || matchEs)) {
        // Return rich trilingual card
        results.push({
          id: `tri-${item.id}-all`,
          sourceText: matchPt ? item.portuguese : (matchEs ? item.spanish : item.english),
          sourceLang: matchPt ? 'pt' : (matchEs ? 'es' : 'en'),
          targetText: matchEn ? `${item.portuguese} (PT) / ${item.spanish} (ES)` : item.english,
          targetLang: matchEn ? 'pt' : 'en',
          partOfSpeech: item.part_of_speech,
          phoneticTarget: item.phonetic_en,
          exampleSource: matchPt ? item.example_pt : (matchEs ? item.example_es : item.example_en),
          exampleTarget: item.example_en,
          category: item.category,
          notes: item.notes_for_pt_speakers || item.notes_for_es_speakers,
        });
        seenIds.add(item.id);
      }
    }

    // 2. Search Portuguese vocabulary seed pool
    if (direction === 'pt-en' || direction === 'all' || direction === 'en-pt') {
      for (const voc of ptVocabulary) {
        const matchPt = voc.lemma.toLowerCase().includes(q);
        const matchEn = voc.definition_en.toLowerCase().includes(q);

        if ((direction === 'pt-en' && matchPt) || (direction === 'en-pt' && matchEn) || (direction === 'all' && (matchPt || matchEn))) {
          if (!seenIds.has(voc.lemma)) {
            results.push({
              id: `voc-pt-${voc.id}`,
              sourceText: direction === 'en-pt' ? voc.definition_en : voc.lemma,
              sourceLang: direction === 'en-pt' ? 'en' : 'pt',
              targetText: direction === 'en-pt' ? voc.lemma : voc.definition_en,
              targetLang: direction === 'en-pt' ? 'pt' : 'en',
              partOfSpeech: voc.part_of_speech,
              phoneticTarget: voc.phonetic_ipa || undefined,
              exampleSource: direction === 'en-pt' ? voc.example_sentence_en : voc.example_sentence_target,
              exampleTarget: direction === 'en-pt' ? voc.example_sentence_target : voc.example_sentence_en,
              falseFriendWarning: voc.false_friend_warning || undefined,
            });
            seenIds.add(voc.lemma);
          }
        }
      }
    }

    // 3. Search Spanish vocabulary seed pool
    if (direction === 'es-en' || direction === 'all' || direction === 'en-es') {
      for (const voc of esVocabulary) {
        const matchEs = voc.lemma.toLowerCase().includes(q);
        const matchEn = voc.definition_en.toLowerCase().includes(q);

        if ((direction === 'es-en' && matchEs) || (direction === 'en-es' && matchEn) || (direction === 'all' && (matchEs || matchEn))) {
          if (!seenIds.has(voc.lemma)) {
            results.push({
              id: `voc-es-${voc.id}`,
              sourceText: direction === 'en-es' ? voc.definition_en : voc.lemma,
              sourceLang: direction === 'en-es' ? 'en' : 'es',
              targetText: direction === 'en-es' ? voc.lemma : voc.definition_en,
              targetLang: direction === 'en-es' ? 'es' : 'en',
              partOfSpeech: voc.part_of_speech,
              phoneticTarget: voc.phonetic_ipa || undefined,
              exampleSource: direction === 'en-es' ? voc.example_sentence_en : voc.example_sentence_target,
              exampleTarget: direction === 'en-es' ? voc.example_sentence_target : voc.example_sentence_en,
              falseFriendWarning: voc.false_friend_warning || undefined,
            });
            seenIds.add(voc.lemma);
          }
        }
      }
    }

    // 4. Search False Friends pool for Portuguese <-> Spanish interference warnings
    if (direction === 'pt-es' || direction === 'es-pt' || direction === 'all') {
      for (const ff of falseFriends) {
        const matchPt = ff.portuguese_term.toLowerCase().includes(q);
        const matchEs = ff.spanish_term.toLowerCase().includes(q);

        if ((direction === 'pt-es' && matchPt) || (direction === 'es-pt' && matchEs) || (direction === 'all' && (matchPt || matchEs))) {
          if (!seenIds.has(ff.id)) {
            results.push({
              id: `ff-${ff.id}`,
              sourceText: direction === 'es-pt' ? ff.spanish_term : ff.portuguese_term,
              sourceLang: direction === 'es-pt' ? 'es' : 'pt',
              targetText: direction === 'es-pt' ? `${ff.portuguese_term} (Significado PT: ${ff.pt_meaning_en})` : `${ff.spanish_term} (Significado ES: ${ff.es_meaning_en})`,
              targetLang: direction === 'es-pt' ? 'pt' : 'es',
              exampleSource: direction === 'es-pt' ? ff.es_example : ff.pt_example,
              exampleTarget: direction === 'es-pt' ? ff.pt_example : ff.es_example,
              falseFriendWarning: ff.interference_warning,
              category: 'false_cognate',
            });
            seenIds.add(ff.id);
          }
        }
      }
    }

    return results;
  }

  /**
   * Get interactive English learning challenges for Portuguese or Spanish speakers.
   */
  static getChallenges(lang?: 'pt' | 'es'): EnglishLearningChallenge[] {
    if (!lang) return englishChallenges;
    return englishChallenges.filter(c => c.source_lang === lang);
  }

  /**
   * Check learner's answer to an English translation challenge.
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
        feedback: 'Correto! Excellent translation! Your grammar and lexical choice match standard English C1 register.',
      };
    }

    return {
      isCorrect: false,
      feedback: `A resposta mais precisa seria: "${challenge.target_english}". ${challenge.source_lang === 'pt' ? challenge.explanation_pt : challenge.explanation_es} (${challenge.common_transfer_mistake})`,
    };
  }

  /**
   * Translate text with input validation, quota guard, in-memory cache, and multi-provider fallback.
   * Returns immediately without persisting a database row!
   */
  static async translateOnline(
    text: string,
    sourceLang: 'pt' | 'es' | 'en',
    targetLang: 'pt' | 'es' | 'en',
    isRegistered: boolean = false
  ): Promise<{ success: boolean; result?: TranslateOnlineResult; error?: string }> {
    const cleanText = text.trim();
    if (!cleanText) {
      return { success: false, error: 'O texto para tradução não pode estar vazio.' };
    }

    // 1. Enforce max input length (1,000 chars)
    if (cleanText.length > 1000) {
      return {
        success: false,
        error: `O texto excede o limite máximo permitido de 1.000 caracteres (foram enviados ${cleanText.length}).`,
      };
    }

    // 2. Check local in-memory cache
    const cacheKey = `${sourceLang}:${targetLang}:${cleanText.toLowerCase()}`;
    if (translationMemoryCache.has(cacheKey)) {
      const cached = translationMemoryCache.get(cacheKey)!;
      return { success: true, result: { ...cached, fromCache: true } };
    }

    // 3. Fast lookup in verified educational dictionary
    const dir = `${sourceLang}-${targetLang}` as TranslationDirection;
    const dictMatches = this.search(cleanText, dir);
    if (dictMatches.length > 0) {
      const best = dictMatches[0];
      const verifiedResult: TranslateOnlineResult = {
        translatedText: best.targetText,
        sourceLang,
        targetLang,
        providerName: 'dictionary',
        isVerified: true,
        isApproximate: false,
        notes: best.notes || best.falseFriendWarning,
      };
      translationMemoryCache.set(cacheKey, verifiedResult);
      return { success: true, result: verifiedResult };
    }

    // 4. Check and consume daily ephemeral quota
    const quotaOk = StorageService.consumeTranslationQuotaToken(isRegistered);
    if (!quotaOk) {
      const quota = StorageService.getTranslationQuotaStatus(isRegistered);
      return {
        success: false,
        error: `Limite diário de traduções atingido (${quota.limit} consultas/dia). Salve termos no seu vocabulário ou tente amanhã.`,
      };
    }

    // 5. Query external free MyMemory translation memory API through integration adapter
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
        providerName: (adapterResult.provider === 'mymemory' ? 'mymemory' : 'fallback') as 'mymemory' | 'fallback',
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

    // 6. Graceful Fallback if remote API is down or unavailable
    const fallbackResult: TranslateOnlineResult = {
      translatedText: cleanText,
      sourceLang,
      targetLang,
      providerName: 'fallback',
      isVerified: false,
      isApproximate: true,
      notes: 'Tradução automática indisponível no momento. Consulte termos isolados no dicionário de alta frequência.',
    };
    return { success: true, result: fallbackResult };
    return { success: true, result: fallbackResult };
  }
}
