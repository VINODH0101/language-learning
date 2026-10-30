/**
 * Domain Response Normalization Layer
 * Converts heterogeneous external API payloads into consistent, strongly-typed internal domain models.
 */

import {
  NormalizedTranslationResult,
  NormalizedDictionaryEntry,
  NormalizedReadingArticle,
  NormalizedProofreadResult,
} from '../../integrations/external-apis/core/types';

export interface NormalizedSentencePair {
  id: string;
  sourceText: string;
  targetText: string;
  sourceLanguage: string;
  targetLanguage: string;
  provider: string;
  attribution: string;
  license: string;
  isPedagogicallyVerified: boolean;
  audioUrl?: string;
}

export interface NormalizedBook {
  id: string;
  title: string;
  authors: string[];
  languages: string[];
  subjects: string[];
  coverUrl?: string;
  readableFormatUrl?: string;
  epubUrl?: string;
  provider: string;
  isPublicDomain: boolean;
}

export interface NormalizedMediaItem {
  id: string;
  title: string;
  mediaType: 'image' | 'audio';
  url: string;
  thumbnailUrl?: string;
  author: string;
  license: string;
  licenseUrl?: string;
  attribution: string;
  provider: string;
}

export interface NormalizedFrequencyItem {
  word: string;
  language: string;
  rank: number;
  frequencyPerMillion: number;
  datasetSource: string;
  datasetVersion: string;
}

/**
 * Normalizes translation responses.
 */
export function normalizeTranslation(
  translatedText: string,
  sourceLang: string,
  targetLang: string,
  provider: string,
  options?: {
    isVerified?: boolean;
    isApproximate?: boolean;
    matchConfidence?: number;
    notes?: string;
    fromCache?: boolean;
  }
): NormalizedTranslationResult {
  return {
    translatedText: translatedText.trim(),
    sourceLang: sourceLang.toLowerCase(),
    targetLang: targetLang.toLowerCase(),
    provider,
    isVerified: options?.isVerified ?? false,
    isApproximate: options?.isApproximate ?? true,
    matchConfidence: options?.matchConfidence ?? 0.85,
    notes: options?.notes,
    fromCache: options?.fromCache ?? false,
  };
}

/**
 * Normalizes dictionary entries.
 */
export function normalizeDictionary(
  word: string,
  language: string,
  meanings: Array<{
    partOfSpeech: string;
    definitions: string[];
    examples?: string[];
    synonyms?: string[];
    antonyms?: string[];
  }>,
  provider: string,
  extra?: {
    phonetic?: string;
    phoneticAudioUrl?: string;
    etymology?: string;
    sourceUrl?: string;
  }
): NormalizedDictionaryEntry {
  return {
    word: word.trim(),
    language: language.toLowerCase(),
    phonetic: extra?.phonetic,
    phoneticAudioUrl: extra?.phoneticAudioUrl,
    meanings: meanings.map(m => ({
      partOfSpeech: m.partOfSpeech.toLowerCase(),
      definitions: m.definitions.filter(d => d && d.trim().length > 0),
      examples: m.examples?.filter(e => e && e.trim().length > 0),
      synonyms: m.synonyms?.filter(s => s && s.trim().length > 0),
      antonyms: m.antonyms?.filter(a => a && a.trim().length > 0),
    })),
    etymology: extra?.etymology,
    provider,
    sourceUrl: extra?.sourceUrl,
  };
}

/**
 * Normalizes Tatoeba / OPUS example sentence pairs.
 */
export function normalizeSentencePair(
  id: string,
  sourceText: string,
  targetText: string,
  sourceLanguage: string,
  targetLanguage: string,
  provider: string,
  attribution: string,
  license: string,
  options?: {
    isPedagogicallyVerified?: boolean;
    audioUrl?: string;
  }
): NormalizedSentencePair {
  return {
    id,
    sourceText: sourceText.trim(),
    targetText: targetText.trim(),
    sourceLanguage: sourceLanguage.toLowerCase(),
    targetLanguage: targetLanguage.toLowerCase(),
    provider,
    attribution,
    license,
    isPedagogicallyVerified: options?.isPedagogicallyVerified ?? false,
    audioUrl: options?.audioUrl,
  };
}

/**
 * Normalizes Gutendex and OpenLibrary books.
 */
export function normalizeBook(
  id: string,
  title: string,
  authors: string[],
  languages: string[],
  provider: string,
  isPublicDomain: boolean,
  extra?: {
    subjects?: string[];
    coverUrl?: string;
    readableFormatUrl?: string;
    epubUrl?: string;
  }
): NormalizedBook {
  return {
    id,
    title: title.trim(),
    authors: authors.map(a => a.trim()),
    languages: languages.map(l => l.toLowerCase()),
    subjects: extra?.subjects || [],
    coverUrl: extra?.coverUrl,
    readableFormatUrl: extra?.readableFormatUrl,
    epubUrl: extra?.epubUrl,
    provider,
    isPublicDomain,
  };
}

/**
 * Normalizes Wikimedia Commons / Openverse media resources.
 */
export function normalizeMediaItem(
  id: string,
  title: string,
  mediaType: 'image' | 'audio',
  url: string,
  author: string,
  license: string,
  attribution: string,
  provider: string,
  options?: {
    thumbnailUrl?: string;
    licenseUrl?: string;
  }
): NormalizedMediaItem {
  return {
    id,
    title: title.trim(),
    mediaType,
    url,
    thumbnailUrl: options?.thumbnailUrl,
    author: author.trim() || 'Unknown Creator',
    license,
    licenseUrl: options?.licenseUrl,
    attribution,
    provider,
  };
}
