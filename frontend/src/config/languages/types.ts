/**
 * Lexilume — Multilingual Language Configuration & Capability Types
 * 
 * Strict four-way decoupling:
 * 1. Interface Language: UI navigation, chrome, buttons ('en' | 'pt' | 'es')
 * 2. Target Learning Language: The language actively being studied (13 supported languages)
 * 3. Explanation Language: Pedagogical language for grammar rules and notes ('en' | 'pt' | 'es')
 * 4. Regional Variety: Dialectal/accent variant strictly bound to the target learning language
 * 
 * Hindi ('hi') is strictly excluded from the platform.
 */

export type SupportedLanguage =
  | 'en' // English
  | 'pt' // Portuguese
  | 'es' // Spanish
  | 'fr' // French
  | 'de' // German
  | 'it' // Italian
  | 'ja' // Japanese
  | 'ko' // Korean
  | 'ru' // Russian
  | 'nl' // Dutch
  | 'zh' // Mandarin Chinese (Simplified)
  | 'tr' // Turkish
  | 'ta'; // Tamil

import type {
  InterfaceLanguage,
  ExplanationLanguage,
  DecoupledLanguageMatrix,
} from '../../lib/languages/languageMatrix';

export type { InterfaceLanguage, ExplanationLanguage, DecoupledLanguageMatrix };

export type ScriptCode =
  | 'Latn' // Latin
  | 'Jpan' // Japanese (Kanji, Hiragana, Katakana)
  | 'Kore' // Korean (Hangul)
  | 'Cyrl' // Cyrillic
  | 'Hans' // Simplified Chinese (Hanzi)
  | 'Hant' // Traditional Chinese
  | 'Taml'; // Tamil

export type TextDirection = 'ltr' | 'rtl';

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export type DictionaryProviderId =
  | 'wiktionary'
  | 'free_dictionary'
  | 'dicionario_aberto'
  | 'jisho'
  | 'hanzi'
  | 'tatoeba'
  | 'local_fallback';

export type TranslationProviderId =
  | 'mymemory'
  | 'libretranslate'
  | 'local_dictionary';

export type ExampleSentenceProviderId =
  | 'tatoeba'
  | 'wikipedia'
  | 'curated';

export interface RegionalVariant {
  code: string;
  displayName: string;
  nativeName: string;
  locale: string;
  flag: string;
  isDefault: boolean;
}

export interface TTSSupport {
  isSupported: boolean;
  defaultVoiceLocale: string;
  supportedLocales: string[];
}

export interface STTSupport {
  isSupported: boolean;
  defaultVoiceLocale: string;
  supportedLocales: string[];
}

export interface GrammarCheckingSupport {
  isSupported: boolean;
  provider: 'languagetool' | 'rule_based' | 'none';
  languageToolCode?: string;
}

export interface ReadingResourceAvailability {
  hasWikipedia: boolean;
  hasCuratedPassages: boolean;
  wikipediaCode?: string;
}

export interface WritingPracticeAvailability {
  isSupported: boolean;
  supportsKanaKanji?: boolean;
  supportsHangul?: boolean;
  supportsPinyin?: boolean;
  supportsLigatures?: boolean;
}

export interface CEFRContentValidationRule {
  minWords: number;
  maxWords: number;
  maxSentenceWords: number;
  minCharactersCJK?: number;
  maxCharactersCJK?: number;
}

export interface LanguageConfiguration {
  id: SupportedLanguage;
  displayName: string;
  nativeName: string;
  defaultLocale: string;
  script: ScriptCode;
  textDirection: TextDirection;
  flag: string;
  cefrAvailability: readonly CEFRLevel[];
  supportedDictionaryProviders: readonly DictionaryProviderId[];
  supportedTranslationProviders: readonly TranslationProviderId[];
  supportedSentenceProviders: readonly ExampleSentenceProviderId[];
  ttsSupport: TTSSupport;
  sttSupport: STTSupport;
  grammarCheckingSupport: GrammarCheckingSupport;
  readingResourceAvailability: ReadingResourceAvailability;
  writingPracticeAvailability: WritingPracticeAvailability;
  regionalVariants: readonly RegionalVariant[];
  validationRules: Record<CEFRLevel, CEFRContentValidationRule>;
}

export interface CEFRValidationResult {
  isValid: boolean;
  issues: string[];
  actualMetric: number;
  allowedRange: [number, number];
  isEditoriallyVerified: boolean;
}
