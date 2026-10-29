/**
 * Core type definitions for the External API Integration Layer.
 * Polyglot C1 Daily — Open, Local-First Architecture.
 */

export type ProviderType =
  | 'translation'
  | 'dictionary'
  | 'reading'
  | 'proofreading'
  | 'culture'
  | 'content_generator';

export type ProviderStatus = 'idle' | 'ready' | 'degraded' | 'offline' | 'error';

export interface ProviderMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  cachedRequests: number;
  lastRequestAt?: string;
  lastError?: string;
  averageLatencyMs: number;
}

export interface ProviderMetadata {
  id: string;
  name: string;
  description: string;
  type: ProviderType;
  attribution: string;
  attributionUrl?: string;
  isPaid: boolean;
  requiresKey: boolean;
  rateLimitInfo?: {
    maxRequests: number;
    windowMs: number;
  };
}

export interface CacheOptions {
  ttlMs?: number;
  bypassCache?: boolean;
}

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
}

// ============================================================================
// NORMALIZED DOMAIN MODELS
// ============================================================================

export interface NormalizedTranslationResult {
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  provider: string;
  isVerified: boolean;
  isApproximate: boolean;
  matchConfidence?: number;
  notes?: string;
  fromCache?: boolean;
}

export interface NormalizedDictionaryMeaning {
  partOfSpeech: string;
  definitions: string[];
  examples?: string[];
  synonyms?: string[];
  antonyms?: string[];
}

export interface NormalizedDictionaryEntry {
  word: string;
  language: string;
  phonetic?: string;
  phoneticAudioUrl?: string;
  meanings: NormalizedDictionaryMeaning[];
  etymology?: string;
  provider: string;
  sourceUrl?: string;
}

export interface NormalizedReadingArticle {
  id: string;
  title: string;
  language: string;
  summary: string;
  contentParagraphs: string[];
  thumbnailUrl?: string;
  sourceUrl?: string;
  estimatedCefrLevel?: string;
  category?: string;
  publishedAt?: string;
  provider: string;
  attribution: string;
}

export interface NormalizedProofreadMatch {
  id: string;
  message: string;
  shortMessage?: string;
  offset: number;
  length: number;
  replacements: string[];
  ruleId: string;
  category: string;
  issueType: string;
}

export interface NormalizedProofreadResult {
  text: string;
  language: string;
  matches: NormalizedProofreadMatch[];
  provider: string;
  hasErrors: boolean;
}

export interface NormalizedCulturalEntity {
  id: string;
  title: string;
  japaneseTitle?: string;
  summary: string;
  imageUrl?: string;
  category: string;
  readingPassage: string;
  glossary: Record<string, string>;
  cefrLevel: string;
  sourceUrl?: string;
  provider: string;
}
