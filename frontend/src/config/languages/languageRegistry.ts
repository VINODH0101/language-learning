/**
 * Lexilume — Centralized Multilingual Language Registry
 * 
 * Scalable configuration matrix for all 13 supported languages.
 * Hindi ('hi') is strictly excluded.
 */

import {
  SupportedLanguage,
  LanguageConfiguration,
  RegionalVariant,
  ScriptCode,
} from './types';
import { DEFAULT_CEFR_WORD_RULES, STANDARD_CEFR_LEVELS } from './cefrRules';

export const LANGUAGE_REGISTRY: Record<SupportedLanguage, LanguageConfiguration> = {
  en: {
    id: 'en',
    displayName: 'English',
    nativeName: 'English',
    defaultLocale: 'en-US',
    script: 'Latn',
    textDirection: 'ltr',
    flag: '🇺🇸',
    cefrAvailability: STANDARD_CEFR_LEVELS,
    supportedDictionaryProviders: ['free_dictionary', 'wiktionary', 'local_fallback'],
    supportedTranslationProviders: ['mymemory', 'local_dictionary'],
    supportedSentenceProviders: ['tatoeba', 'wikipedia', 'curated'],
    ttsSupport: {
      isSupported: true,
      defaultVoiceLocale: 'en-US',
      supportedLocales: ['en-US', 'en-GB'],
    },
    sttSupport: {
      isSupported: true,
      defaultVoiceLocale: 'en-US',
      supportedLocales: ['en-US', 'en-GB'],
    },
    grammarCheckingSupport: {
      isSupported: true,
      provider: 'languagetool',
      languageToolCode: 'en-US',
    },
    readingResourceAvailability: {
      hasWikipedia: true,
      hasCuratedPassages: true,
      wikipediaCode: 'en',
    },
    writingPracticeAvailability: {
      isSupported: true,
    },
    regionalVariants: [
      {
        code: 'en-US',
        displayName: 'American English',
        nativeName: 'American English',
        locale: 'en-US',
        flag: '🇺🇸',
        isDefault: true,
      },
      {
        code: 'en-GB',
        displayName: 'British English',
        nativeName: 'British English',
        locale: 'en-GB',
        flag: '🇬🇧',
        isDefault: false,
      },
    ],
    validationRules: DEFAULT_CEFR_WORD_RULES,
  },

  pt: {
    id: 'pt',
    displayName: 'Portuguese',
    nativeName: 'Português',
    defaultLocale: 'pt-BR',
    script: 'Latn',
    textDirection: 'ltr',
    flag: '🇧🇷',
    cefrAvailability: STANDARD_CEFR_LEVELS,
    supportedDictionaryProviders: ['dicionario_aberto', 'wiktionary', 'local_fallback'],
    supportedTranslationProviders: ['mymemory', 'local_dictionary'],
    supportedSentenceProviders: ['tatoeba', 'wikipedia', 'curated'],
    ttsSupport: {
      isSupported: true,
      defaultVoiceLocale: 'pt-BR',
      supportedLocales: ['pt-BR', 'pt-PT'],
    },
    sttSupport: {
      isSupported: true,
      defaultVoiceLocale: 'pt-BR',
      supportedLocales: ['pt-BR', 'pt-PT'],
    },
    grammarCheckingSupport: {
      isSupported: true,
      provider: 'languagetool',
      languageToolCode: 'pt-BR',
    },
    readingResourceAvailability: {
      hasWikipedia: true,
      hasCuratedPassages: true,
      wikipediaCode: 'pt',
    },
    writingPracticeAvailability: {
      isSupported: true,
    },
    regionalVariants: [
      {
        code: 'pt-BR',
        displayName: 'Brazilian Portuguese',
        nativeName: 'Português Brasileiro',
        locale: 'pt-BR',
        flag: '🇧🇷',
        isDefault: true,
      },
      {
        code: 'pt-PT',
        displayName: 'European Portuguese',
        nativeName: 'Português Europeu',
        locale: 'pt-PT',
        flag: '🇵🇹',
        isDefault: false,
      },
    ],
    validationRules: DEFAULT_CEFR_WORD_RULES,
  },

  es: {
    id: 'es',
    displayName: 'Spanish',
    nativeName: 'Español',
    defaultLocale: 'es-ES',
    script: 'Latn',
    textDirection: 'ltr',
    flag: '🇪🇸',
    cefrAvailability: STANDARD_CEFR_LEVELS,
    supportedDictionaryProviders: ['free_dictionary', 'wiktionary', 'local_fallback'],
    supportedTranslationProviders: ['mymemory', 'local_dictionary'],
    supportedSentenceProviders: ['tatoeba', 'wikipedia', 'curated'],
    ttsSupport: {
      isSupported: true,
      defaultVoiceLocale: 'es-ES',
      supportedLocales: ['es-ES', 'es-MX', 'es-AR', 'es-419'],
    },
    sttSupport: {
      isSupported: true,
      defaultVoiceLocale: 'es-ES',
      supportedLocales: ['es-ES', 'es-MX'],
    },
    grammarCheckingSupport: {
      isSupported: true,
      provider: 'languagetool',
      languageToolCode: 'es',
    },
    readingResourceAvailability: {
      hasWikipedia: true,
      hasCuratedPassages: true,
      wikipediaCode: 'es',
    },
    writingPracticeAvailability: {
      isSupported: true,
    },
    regionalVariants: [
      {
        code: 'es-ES',
        displayName: 'Peninsular Spanish',
        nativeName: 'Español Peninsular',
        locale: 'es-ES',
        flag: '🇪🇸',
        isDefault: true,
      },
      {
        code: 'es-MX',
        displayName: 'Mexican Spanish',
        nativeName: 'Español Mexicano',
        locale: 'es-MX',
        flag: '🇲🇽',
        isDefault: false,
      },
      {
        code: 'es-419',
        displayName: 'Latin American Spanish',
        nativeName: 'Español Hispanoamericano',
        locale: 'es-419',
        flag: '🌎',
        isDefault: false,
      },
      {
        code: 'es-AR',
        displayName: 'Rioplatense Spanish',
        nativeName: 'Español Rioplatense',
        locale: 'es-AR',
        flag: '🇦🇷',
        isDefault: false,
      },
    ],
    validationRules: DEFAULT_CEFR_WORD_RULES,
  },

  fr: {
    id: 'fr',
    displayName: 'French',
    nativeName: 'Français',
    defaultLocale: 'fr-FR',
    script: 'Latn',
    textDirection: 'ltr',
    flag: '🇫🇷',
    cefrAvailability: STANDARD_CEFR_LEVELS,
    supportedDictionaryProviders: ['free_dictionary', 'wiktionary', 'local_fallback'],
    supportedTranslationProviders: ['mymemory', 'local_dictionary'],
    supportedSentenceProviders: ['tatoeba', 'wikipedia', 'curated'],
    ttsSupport: {
      isSupported: true,
      defaultVoiceLocale: 'fr-FR',
      supportedLocales: ['fr-FR', 'fr-CA'],
    },
    sttSupport: {
      isSupported: true,
      defaultVoiceLocale: 'fr-FR',
      supportedLocales: ['fr-FR'],
    },
    grammarCheckingSupport: {
      isSupported: true,
      provider: 'languagetool',
      languageToolCode: 'fr',
    },
    readingResourceAvailability: {
      hasWikipedia: true,
      hasCuratedPassages: true,
      wikipediaCode: 'fr',
    },
    writingPracticeAvailability: {
      isSupported: true,
    },
    regionalVariants: [
      {
        code: 'fr-FR',
        displayName: 'Metropolitan French',
        nativeName: 'Français Métropolitain',
        locale: 'fr-FR',
        flag: '🇫🇷',
        isDefault: true,
      },
      {
        code: 'fr-CA',
        displayName: 'Canadian French',
        nativeName: 'Français Canadien',
        locale: 'fr-CA',
        flag: '🇨🇦',
        isDefault: false,
      },
    ],
    validationRules: DEFAULT_CEFR_WORD_RULES,
  },

  de: {
    id: 'de',
    displayName: 'German',
    nativeName: 'Deutsch',
    defaultLocale: 'de-DE',
    script: 'Latn',
    textDirection: 'ltr',
    flag: '🇩🇪',
    cefrAvailability: STANDARD_CEFR_LEVELS,
    supportedDictionaryProviders: ['free_dictionary', 'wiktionary', 'local_fallback'],
    supportedTranslationProviders: ['mymemory', 'local_dictionary'],
    supportedSentenceProviders: ['tatoeba', 'wikipedia', 'curated'],
    ttsSupport: {
      isSupported: true,
      defaultVoiceLocale: 'de-DE',
      supportedLocales: ['de-DE', 'de-AT', 'de-CH'],
    },
    sttSupport: {
      isSupported: true,
      defaultVoiceLocale: 'de-DE',
      supportedLocales: ['de-DE'],
    },
    grammarCheckingSupport: {
      isSupported: true,
      provider: 'languagetool',
      languageToolCode: 'de-DE',
    },
    readingResourceAvailability: {
      hasWikipedia: true,
      hasCuratedPassages: true,
      wikipediaCode: 'de',
    },
    writingPracticeAvailability: {
      isSupported: true,
    },
    regionalVariants: [
      {
        code: 'de-DE',
        displayName: 'German (Germany)',
        nativeName: 'Deutsch (Deutschland)',
        locale: 'de-DE',
        flag: '🇩🇪',
        isDefault: true,
      },
      {
        code: 'de-AT',
        displayName: 'Austrian German',
        nativeName: 'Österreichisches Deutsch',
        locale: 'de-AT',
        flag: '🇦🇹',
        isDefault: false,
      },
      {
        code: 'de-CH',
        displayName: 'Swiss German',
        nativeName: 'Schweizer Hochdeutsch',
        locale: 'de-CH',
        flag: '🇨🇭',
        isDefault: false,
      },
    ],
    validationRules: DEFAULT_CEFR_WORD_RULES,
  },

  it: {
    id: 'it',
    displayName: 'Italian',
    nativeName: 'Italiano',
    defaultLocale: 'it-IT',
    script: 'Latn',
    textDirection: 'ltr',
    flag: '🇮🇹',
    cefrAvailability: STANDARD_CEFR_LEVELS,
    supportedDictionaryProviders: ['free_dictionary', 'wiktionary', 'local_fallback'],
    supportedTranslationProviders: ['mymemory', 'local_dictionary'],
    supportedSentenceProviders: ['tatoeba', 'wikipedia', 'curated'],
    ttsSupport: {
      isSupported: true,
      defaultVoiceLocale: 'it-IT',
      supportedLocales: ['it-IT'],
    },
    sttSupport: {
      isSupported: true,
      defaultVoiceLocale: 'it-IT',
      supportedLocales: ['it-IT'],
    },
    grammarCheckingSupport: {
      isSupported: true,
      provider: 'languagetool',
      languageToolCode: 'it',
    },
    readingResourceAvailability: {
      hasWikipedia: true,
      hasCuratedPassages: true,
      wikipediaCode: 'it',
    },
    writingPracticeAvailability: {
      isSupported: true,
    },
    regionalVariants: [
      {
        code: 'it-IT',
        displayName: 'Standard Italian',
        nativeName: 'Italiano Standard',
        locale: 'it-IT',
        flag: '🇮🇹',
        isDefault: true,
      },
    ],
    validationRules: DEFAULT_CEFR_WORD_RULES,
  },

  ja: {
    id: 'ja',
    displayName: 'Japanese',
    nativeName: '日本語',
    defaultLocale: 'ja-JP',
    script: 'Jpan',
    textDirection: 'ltr',
    flag: '🇯🇵',
    cefrAvailability: STANDARD_CEFR_LEVELS,
    supportedDictionaryProviders: ['jisho', 'wiktionary', 'local_fallback'],
    supportedTranslationProviders: ['mymemory', 'local_dictionary'],
    supportedSentenceProviders: ['tatoeba', 'wikipedia', 'curated'],
    ttsSupport: {
      isSupported: true,
      defaultVoiceLocale: 'ja-JP',
      supportedLocales: ['ja-JP'],
    },
    sttSupport: {
      isSupported: true,
      defaultVoiceLocale: 'ja-JP',
      supportedLocales: ['ja-JP'],
    },
    grammarCheckingSupport: {
      isSupported: true,
      provider: 'rule_based',
    },
    readingResourceAvailability: {
      hasWikipedia: true,
      hasCuratedPassages: true,
      wikipediaCode: 'ja',
    },
    writingPracticeAvailability: {
      isSupported: true,
      supportsKanaKanji: true,
    },
    regionalVariants: [
      {
        code: 'ja-JP',
        displayName: 'Standard Japanese',
        nativeName: '標準日本語',
        locale: 'ja-JP',
        flag: '🇯🇵',
        isDefault: true,
      },
    ],
    validationRules: DEFAULT_CEFR_WORD_RULES,
  },

  ko: {
    id: 'ko',
    displayName: 'Korean',
    nativeName: '한국어',
    defaultLocale: 'ko-KR',
    script: 'Kore',
    textDirection: 'ltr',
    flag: '🇰🇷',
    cefrAvailability: STANDARD_CEFR_LEVELS,
    supportedDictionaryProviders: ['wiktionary', 'local_fallback'],
    supportedTranslationProviders: ['mymemory', 'local_dictionary'],
    supportedSentenceProviders: ['tatoeba', 'wikipedia', 'curated'],
    ttsSupport: {
      isSupported: true,
      defaultVoiceLocale: 'ko-KR',
      supportedLocales: ['ko-KR'],
    },
    sttSupport: {
      isSupported: true,
      defaultVoiceLocale: 'ko-KR',
      supportedLocales: ['ko-KR'],
    },
    grammarCheckingSupport: {
      isSupported: true,
      provider: 'rule_based',
    },
    readingResourceAvailability: {
      hasWikipedia: true,
      hasCuratedPassages: true,
      wikipediaCode: 'ko',
    },
    writingPracticeAvailability: {
      isSupported: true,
      supportsHangul: true,
    },
    regionalVariants: [
      {
        code: 'ko-KR',
        displayName: 'Standard Korean',
        nativeName: '표준어',
        locale: 'ko-KR',
        flag: '🇰🇷',
        isDefault: true,
      },
    ],
    validationRules: DEFAULT_CEFR_WORD_RULES,
  },

  ru: {
    id: 'ru',
    displayName: 'Russian',
    nativeName: 'Русский',
    defaultLocale: 'ru-RU',
    script: 'Cyrl',
    textDirection: 'ltr',
    flag: '🇷🇺',
    cefrAvailability: STANDARD_CEFR_LEVELS,
    supportedDictionaryProviders: ['free_dictionary', 'wiktionary', 'local_fallback'],
    supportedTranslationProviders: ['mymemory', 'local_dictionary'],
    supportedSentenceProviders: ['tatoeba', 'wikipedia', 'curated'],
    ttsSupport: {
      isSupported: true,
      defaultVoiceLocale: 'ru-RU',
      supportedLocales: ['ru-RU'],
    },
    sttSupport: {
      isSupported: true,
      defaultVoiceLocale: 'ru-RU',
      supportedLocales: ['ru-RU'],
    },
    grammarCheckingSupport: {
      isSupported: true,
      provider: 'languagetool',
      languageToolCode: 'ru-RU',
    },
    readingResourceAvailability: {
      hasWikipedia: true,
      hasCuratedPassages: true,
      wikipediaCode: 'ru',
    },
    writingPracticeAvailability: {
      isSupported: true,
    },
    regionalVariants: [
      {
        code: 'ru-RU',
        displayName: 'Standard Russian',
        nativeName: 'Русский Литературный',
        locale: 'ru-RU',
        flag: '🇷🇺',
        isDefault: true,
      },
    ],
    validationRules: DEFAULT_CEFR_WORD_RULES,
  },

  nl: {
    id: 'nl',
    displayName: 'Dutch',
    nativeName: 'Nederlands',
    defaultLocale: 'nl-NL',
    script: 'Latn',
    textDirection: 'ltr',
    flag: '🇳🇱',
    cefrAvailability: STANDARD_CEFR_LEVELS,
    supportedDictionaryProviders: ['free_dictionary', 'wiktionary', 'local_fallback'],
    supportedTranslationProviders: ['mymemory', 'local_dictionary'],
    supportedSentenceProviders: ['tatoeba', 'wikipedia', 'curated'],
    ttsSupport: {
      isSupported: true,
      defaultVoiceLocale: 'nl-NL',
      supportedLocales: ['nl-NL', 'nl-BE'],
    },
    sttSupport: {
      isSupported: true,
      defaultVoiceLocale: 'nl-NL',
      supportedLocales: ['nl-NL'],
    },
    grammarCheckingSupport: {
      isSupported: true,
      provider: 'languagetool',
      languageToolCode: 'nl',
    },
    readingResourceAvailability: {
      hasWikipedia: true,
      hasCuratedPassages: true,
      wikipediaCode: 'nl',
    },
    writingPracticeAvailability: {
      isSupported: true,
    },
    regionalVariants: [
      {
        code: 'nl-NL',
        displayName: 'Standard Dutch (Netherlands)',
        nativeName: 'Standaardnederlands',
        locale: 'nl-NL',
        flag: '🇳🇱',
        isDefault: true,
      },
      {
        code: 'nl-BE',
        displayName: 'Flemish Dutch (Belgium)',
        nativeName: 'Vlaams',
        locale: 'nl-BE',
        flag: '🇧🇪',
        isDefault: false,
      },
    ],
    validationRules: DEFAULT_CEFR_WORD_RULES,
  },

  zh: {
    id: 'zh',
    displayName: 'Mandarin Chinese',
    nativeName: '中文 (简体)',
    defaultLocale: 'zh-Hans',
    script: 'Hans',
    textDirection: 'ltr',
    flag: '🇨🇳',
    cefrAvailability: STANDARD_CEFR_LEVELS,
    supportedDictionaryProviders: ['hanzi', 'wiktionary', 'local_fallback'],
    supportedTranslationProviders: ['mymemory', 'local_dictionary'],
    supportedSentenceProviders: ['tatoeba', 'wikipedia', 'curated'],
    ttsSupport: {
      isSupported: true,
      defaultVoiceLocale: 'zh-CN',
      supportedLocales: ['zh-CN', 'zh-TW', 'zh-HK'],
    },
    sttSupport: {
      isSupported: true,
      defaultVoiceLocale: 'zh-CN',
      supportedLocales: ['zh-CN'],
    },
    grammarCheckingSupport: {
      isSupported: true,
      provider: 'rule_based',
    },
    readingResourceAvailability: {
      hasWikipedia: true,
      hasCuratedPassages: true,
      wikipediaCode: 'zh',
    },
    writingPracticeAvailability: {
      isSupported: true,
      supportsPinyin: true,
    },
    regionalVariants: [
      {
        code: 'zh-Hans',
        displayName: 'Simplified Chinese',
        nativeName: '简体中文',
        locale: 'zh-Hans',
        flag: '🇨🇳',
        isDefault: true,
      },
      {
        code: 'zh-CN',
        displayName: 'Mandarin (China Mainland)',
        nativeName: '普通话 (中国大陆)',
        locale: 'zh-CN',
        flag: '🇨🇳',
        isDefault: false,
      },
    ],
    validationRules: DEFAULT_CEFR_WORD_RULES,
  },

  tr: {
    id: 'tr',
    displayName: 'Turkish',
    nativeName: 'Türkçe',
    defaultLocale: 'tr-TR',
    script: 'Latn',
    textDirection: 'ltr',
    flag: '🇹🇷',
    cefrAvailability: STANDARD_CEFR_LEVELS,
    supportedDictionaryProviders: ['free_dictionary', 'wiktionary', 'local_fallback'],
    supportedTranslationProviders: ['mymemory', 'local_dictionary'],
    supportedSentenceProviders: ['tatoeba', 'wikipedia', 'curated'],
    ttsSupport: {
      isSupported: true,
      defaultVoiceLocale: 'tr-TR',
      supportedLocales: ['tr-TR'],
    },
    sttSupport: {
      isSupported: true,
      defaultVoiceLocale: 'tr-TR',
      supportedLocales: ['tr-TR'],
    },
    grammarCheckingSupport: {
      isSupported: true,
      provider: 'rule_based',
    },
    readingResourceAvailability: {
      hasWikipedia: true,
      hasCuratedPassages: true,
      wikipediaCode: 'tr',
    },
    writingPracticeAvailability: {
      isSupported: true,
    },
    regionalVariants: [
      {
        code: 'tr-TR',
        displayName: 'Standard Turkish',
        nativeName: 'Standart Türkçe',
        locale: 'tr-TR',
        flag: '🇹🇷',
        isDefault: true,
      },
    ],
    validationRules: DEFAULT_CEFR_WORD_RULES,
  },

  ta: {
    id: 'ta',
    displayName: 'Tamil',
    nativeName: 'தமிழ்',
    defaultLocale: 'ta-IN',
    script: 'Taml',
    textDirection: 'ltr',
    flag: '🇮🇳',
    cefrAvailability: STANDARD_CEFR_LEVELS,
    supportedDictionaryProviders: ['wiktionary', 'local_fallback'],
    supportedTranslationProviders: ['mymemory', 'local_dictionary'],
    supportedSentenceProviders: ['tatoeba', 'wikipedia', 'curated'],
    ttsSupport: {
      isSupported: true,
      defaultVoiceLocale: 'ta-IN',
      supportedLocales: ['ta-IN', 'ta-LK'],
    },
    sttSupport: {
      isSupported: true,
      defaultVoiceLocale: 'ta-IN',
      supportedLocales: ['ta-IN'],
    },
    grammarCheckingSupport: {
      isSupported: true,
      provider: 'rule_based',
    },
    readingResourceAvailability: {
      hasWikipedia: true,
      hasCuratedPassages: true,
      wikipediaCode: 'ta',
    },
    writingPracticeAvailability: {
      isSupported: true,
      supportsLigatures: true,
    },
    regionalVariants: [
      {
        code: 'ta-IN',
        displayName: 'Indian Tamil',
        nativeName: 'இந்தியத் தமிழ்',
        locale: 'ta-IN',
        flag: '🇮🇳',
        isDefault: true,
      },
      {
        code: 'ta-LK',
        displayName: 'Sri Lankan Tamil',
        nativeName: 'இலங்கைத் தமிழ்',
        locale: 'ta-LK',
        flag: '🇱🇰',
        isDefault: false,
      },
    ],
    validationRules: DEFAULT_CEFR_WORD_RULES,
  },
};

/**
 * Checks if a language code refers to an explicitly excluded language (e.g. Hindi).
 */
export function isForbiddenLanguage(code: unknown): boolean {
  if (typeof code !== 'string') return false;
  const normalized = code.toLowerCase().trim();
  return (
    normalized === 'hi' ||
    normalized === 'hin' ||
    normalized === 'hindi' ||
    normalized.startsWith('hi-')
  );
}

/**
 * Type guard checking if a code represents an actively supported language in Lexilume.
 */
export function isLanguageSupported(code: unknown): code is SupportedLanguage {
  if (isForbiddenLanguage(code)) return false;
  return typeof code === 'string' && Object.prototype.hasOwnProperty.call(LANGUAGE_REGISTRY, code);
}

/**
 * Retrieves configuration for a supported language. Throws descriptive error if unsupported.
 */
export function getLanguageConfig(lang: SupportedLanguage): LanguageConfiguration {
  if (isForbiddenLanguage(lang)) {
    throw new Error(`Language '${lang}' is explicitly excluded from Lexilume.`);
  }
  const config = LANGUAGE_REGISTRY[lang];
  if (!config) {
    throw new Error(`Unsupported language code: '${lang}'`);
  }
  return config;
}

/**
 * Returns list of all 13 supported languages.
 */
export function getAllSupportedLanguages(): LanguageConfiguration[] {
  return Object.values(LANGUAGE_REGISTRY);
}

/**
 * Returns all regional variants defined for a language.
 */
export function getRegionalVariants(lang: SupportedLanguage): readonly RegionalVariant[] {
  const config = getLanguageConfig(lang);
  return config.regionalVariants;
}

/**
 * Returns default variant code for a language.
 */
export function getDefaultVariant(lang: SupportedLanguage): string {
  const config = getLanguageConfig(lang);
  const def = config.regionalVariants.find(v => v.isDefault);
  return def ? def.code : config.defaultLocale;
}

/**
 * Validates whether a regional variety code belongs to the specified language.
 */
export function isValidRegionalVariant(lang: SupportedLanguage, variant?: string | null): boolean {
  if (!variant) return false;
  if (variant === 'all') return true;
  const config = getLanguageConfig(lang);
  return config.regionalVariants.some(v => v.code === variant);
}

/**
 * Enforces a valid regional variety code for a language, falling back to default.
 */
export function enforceRegionalVariant(lang: SupportedLanguage, variant?: string | null): string {
  if (isValidRegionalVariant(lang, variant)) {
    return variant!;
  }
  return getDefaultVariant(lang);
}

/**
 * Returns human-readable localized display name.
 */
export function getLanguageDisplayName(lang: SupportedLanguage): string {
  return getLanguageConfig(lang).displayName;
}

/**
 * Returns native endonym.
 */
export function getLanguageNativeName(lang: SupportedLanguage): string {
  return getLanguageConfig(lang).nativeName;
}

/**
 * Returns script code for a language.
 */
export function getLanguageScript(lang: SupportedLanguage): ScriptCode {
  return getLanguageConfig(lang).script;
}
