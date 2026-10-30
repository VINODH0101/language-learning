/**
 * Lexilume — Language Capability Detection System
 * 
 * Capability-based invariant: A feature must only appear as supported when its
 * provider or implementation has been tested and configured for that language.
 */

import {
  SupportedLanguage,
  DictionaryProviderId,
  ScriptCode,
  TextDirection,
} from './types';
import { getLanguageConfig, isLanguageSupported } from './languageRegistry';

export function hasTTS(lang: SupportedLanguage): boolean {
  if (!isLanguageSupported(lang)) return false;
  return getLanguageConfig(lang).ttsSupport.isSupported;
}

export function hasSTT(lang: SupportedLanguage): boolean {
  if (!isLanguageSupported(lang)) return false;
  return getLanguageConfig(lang).sttSupport.isSupported;
}

export function hasGrammarChecker(lang: SupportedLanguage): boolean {
  if (!isLanguageSupported(lang)) return false;
  return getLanguageConfig(lang).grammarCheckingSupport.isSupported;
}

export function hasDictionaryProvider(lang: SupportedLanguage, provider: DictionaryProviderId): boolean {
  if (!isLanguageSupported(lang)) return false;
  return getLanguageConfig(lang).supportedDictionaryProviders.includes(provider);
}

export function hasReadingResources(lang: SupportedLanguage): boolean {
  if (!isLanguageSupported(lang)) return false;
  const reading = getLanguageConfig(lang).readingResourceAvailability;
  return reading.hasWikipedia || reading.hasCuratedPassages;
}

export function hasWritingPractice(lang: SupportedLanguage): boolean {
  if (!isLanguageSupported(lang)) return false;
  return getLanguageConfig(lang).writingPracticeAvailability.isSupported;
}

export function getLanguageVoiceLocale(lang: SupportedLanguage, variant?: string): string {
  const config = getLanguageConfig(lang);
  if (variant && config.ttsSupport.supportedLocales.includes(variant)) {
    return variant;
  }
  return config.ttsSupport.defaultVoiceLocale;
}

export function getTextDirection(lang: SupportedLanguage): TextDirection {
  return getLanguageConfig(lang).textDirection;
}

/**
 * Returns true if language script is ideographic / character-based (Chinese, Japanese).
 */
export function isCJK(lang: SupportedLanguage): boolean {
  return lang === 'zh' || lang === 'ja';
}

/**
 * Returns true if language uses whitespace as primary word delimiter.
 */
export function isSpaceDelimited(lang: SupportedLanguage): boolean {
  return !isCJK(lang);
}

export interface LanguageCapabilitiesSummary {
  language: SupportedLanguage;
  displayName: string;
  nativeName: string;
  script: ScriptCode;
  textDirection: TextDirection;
  tts: boolean;
  stt: boolean;
  grammarCheck: boolean;
  grammarProvider: string;
  readingResources: boolean;
  writingPractice: boolean;
  isCJK: boolean;
  variantCount: number;
}

export function getLanguageCapabilities(lang: SupportedLanguage): LanguageCapabilitiesSummary {
  const config = getLanguageConfig(lang);
  return {
    language: lang,
    displayName: config.displayName,
    nativeName: config.nativeName,
    script: config.script,
    textDirection: config.textDirection,
    tts: config.ttsSupport.isSupported,
    stt: config.sttSupport.isSupported,
    grammarCheck: config.grammarCheckingSupport.isSupported,
    grammarProvider: config.grammarCheckingSupport.provider,
    readingResources: config.readingResourceAvailability.hasWikipedia,
    writingPractice: config.writingPracticeAvailability.isSupported,
    isCJK: isCJK(lang),
    variantCount: config.regionalVariants.length,
  };
}
