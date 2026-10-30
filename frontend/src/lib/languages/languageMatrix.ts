/**
 * Polyglot C1 Daily — Language Decoupling Core Matrix
 * 
 * Enforces the strict separation between:
 * 1. Interface Language (UI chrome, buttons, navigation, modals, system messages)
 * 2. Learning Language (Target language actively studied: words, passages, exercises)
 * 3. Explanation Language (Pedagogical language: grammar notes, definitions, answer explanations)
 * 4. Regional Variety (Dialectal qualification of the learning language: phonetics, audio, syntax notes)
 */

export type InterfaceLanguage =
  | 'en'
  | 'pt'
  | 'pt-BR'
  | 'pt-PT'
  | 'es'
  | 'fr'
  | 'de'
  | 'it'
  | 'ja'
  | 'ko'
  | 'ru'
  | 'nl'
  | 'zh-Hans'
  | 'tr'
  | 'ta';

export type LearningLanguage =
  | 'en'
  | 'pt'
  | 'es'
  | 'fr'
  | 'de'
  | 'it'
  | 'ja'
  | 'ko'
  | 'ru'
  | 'nl'
  | 'zh'
  | 'tr'
  | 'ta';

export type ExplanationLanguage = 'en' | 'pt' | 'es';

export type RegionalVariety =
  // Portuguese varieties
  | 'pt-BR'
  | 'pt-PT'
  // Spanish varieties
  | 'es-ES'
  | 'es-419'
  | 'es-MX'
  | 'es-AR'
  // English varieties
  | 'en-US'
  | 'en-GB'
  // French varieties
  | 'fr-FR'
  | 'fr-CA'
  // German varieties
  | 'de-DE'
  | 'de-AT'
  | 'de-CH'
  // Italian varieties
  | 'it-IT'
  // Japanese varieties
  | 'ja-JP'
  // Korean varieties
  | 'ko-KR'
  // Russian varieties
  | 'ru-RU'
  // Dutch varieties
  | 'nl-NL'
  | 'nl-BE'
  // Chinese varieties
  | 'zh-Hans'
  | 'zh-CN'
  // Turkish varieties
  | 'tr-TR'
  // Tamil varieties
  | 'ta-IN'
  | 'ta-LK'
  // Universal neutral
  | 'all';

export const SUPPORTED_INTERFACE_LANGUAGES: readonly InterfaceLanguage[] = [
  'en',
  'pt',
  'pt-BR',
  'pt-PT',
  'es',
  'fr',
  'de',
  'it',
  'ja',
  'ko',
  'ru',
  'nl',
  'zh-Hans',
  'tr',
  'ta',
] as const;

export const SUPPORTED_LEARNING_LANGUAGES: readonly LearningLanguage[] = [
  'en',
  'pt',
  'es',
  'fr',
  'de',
  'it',
  'ja',
  'ko',
  'ru',
  'nl',
  'zh',
  'tr',
  'ta',
] as const;

export const SUPPORTED_EXPLANATION_LANGUAGES: readonly ExplanationLanguage[] = ['en', 'pt', 'es'] as const;

/**
 * Strict mapping of valid Regional Varieties for each Learning Language.
 * A regional variety is ALWAYS bound to a specific learning language.
 */
export const REGIONAL_VARIETIES_BY_LANGUAGE: Record<LearningLanguage, readonly RegionalVariety[]> = {
  en: ['en-US', 'en-GB', 'all'],
  pt: ['pt-BR', 'pt-PT', 'all'],
  es: ['es-ES', 'es-419', 'es-MX', 'es-AR', 'all'],
  fr: ['fr-FR', 'fr-CA', 'all'],
  de: ['de-DE', 'de-AT', 'de-CH', 'all'],
  it: ['it-IT', 'all'],
  ja: ['ja-JP', 'all'],
  ko: ['ko-KR', 'all'],
  ru: ['ru-RU', 'all'],
  nl: ['nl-NL', 'nl-BE', 'all'],
  zh: ['zh-Hans', 'zh-CN', 'all'],
  tr: ['tr-TR', 'all'],
  ta: ['ta-IN', 'ta-LK', 'all'],
};

/**
 * Default regional variety per learning language when unspecified or invalid.
 */
export const DEFAULT_REGIONAL_VARIETY: Record<LearningLanguage, RegionalVariety> = {
  en: 'en-US',
  pt: 'pt-BR',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  it: 'it-IT',
  ja: 'ja-JP',
  ko: 'ko-KR',
  ru: 'ru-RU',
  nl: 'nl-NL',
  zh: 'zh-Hans',
  tr: 'tr-TR',
  ta: 'ta-IN',
};

export interface LanguageMetadata {
  code: LearningLanguage;
  nameEn: string;
  namePt: string;
  nameEs: string;
  flag: string;
  defaultVariety: RegionalVariety;
}

export const LANGUAGE_METADATA: Record<LearningLanguage, LanguageMetadata> = {
  en: {
    code: 'en',
    nameEn: 'English',
    namePt: 'Inglês',
    nameEs: 'Inglés',
    flag: '🇺🇸',
    defaultVariety: 'en-US',
  },
  pt: {
    code: 'pt',
    nameEn: 'Portuguese',
    namePt: 'Português',
    nameEs: 'Portugués',
    flag: '🇧🇷',
    defaultVariety: 'pt-BR',
  },
  es: {
    code: 'es',
    nameEn: 'Spanish',
    namePt: 'Espanhol',
    nameEs: 'Español',
    flag: '🇪🇸',
    defaultVariety: 'es-ES',
  },
  fr: {
    code: 'fr',
    nameEn: 'French',
    namePt: 'Francês',
    nameEs: 'Francés',
    flag: '🇫🇷',
    defaultVariety: 'fr-FR',
  },
  de: {
    code: 'de',
    nameEn: 'German',
    namePt: 'Alemão',
    nameEs: 'Alemán',
    flag: '🇩🇪',
    defaultVariety: 'de-DE',
  },
  it: {
    code: 'it',
    nameEn: 'Italian',
    namePt: 'Italiano',
    nameEs: 'Italiano',
    flag: '🇮🇹',
    defaultVariety: 'it-IT',
  },
  ja: {
    code: 'ja',
    nameEn: 'Japanese',
    namePt: 'Japonês',
    nameEs: 'Japonés',
    flag: '🇯🇵',
    defaultVariety: 'ja-JP',
  },
  ko: {
    code: 'ko',
    nameEn: 'Korean',
    namePt: 'Coreano',
    nameEs: 'Coreano',
    flag: '🇰🇷',
    defaultVariety: 'ko-KR',
  },
  ru: {
    code: 'ru',
    nameEn: 'Russian',
    namePt: 'Russo',
    nameEs: 'Ruso',
    flag: '🇷🇺',
    defaultVariety: 'ru-RU',
  },
  nl: {
    code: 'nl',
    nameEn: 'Dutch',
    namePt: 'Holandês',
    nameEs: 'Holandés',
    flag: '🇳🇱',
    defaultVariety: 'nl-NL',
  },
  zh: {
    code: 'zh',
    nameEn: 'Mandarin Chinese',
    namePt: 'Chinês Mandarim',
    nameEs: 'Chino Mandarín',
    flag: '🇨🇳',
    defaultVariety: 'zh-Hans',
  },
  tr: {
    code: 'tr',
    nameEn: 'Turkish',
    namePt: 'Turco',
    nameEs: 'Turco',
    flag: '🇹🇷',
    defaultVariety: 'tr-TR',
  },
  ta: {
    code: 'ta',
    nameEn: 'Tamil',
    namePt: 'Tâmil',
    nameEs: 'Tamil',
    flag: '🇮🇳',
    defaultVariety: 'ta-IN',
  },
};

export interface RegionalVarietyMetadata {
  code: RegionalVariety;
  language: LearningLanguage | 'all';
  labelEn: string;
  labelPt: string;
  labelEs: string;
  flag: string;
  voiceLocale: string;
}

export const REGIONAL_VARIETY_METADATA: Record<RegionalVariety, RegionalVarietyMetadata> = {
  'en-US': {
    code: 'en-US',
    language: 'en',
    labelEn: 'American English (en-US)',
    labelPt: 'Inglês Americano (en-US)',
    labelEs: 'Inglés Americano (en-US)',
    flag: '🇺🇸',
    voiceLocale: 'en-US',
  },
  'en-GB': {
    code: 'en-GB',
    language: 'en',
    labelEn: 'British English (en-GB)',
    labelPt: 'Inglês Britânico (en-GB)',
    labelEs: 'Inglés Británico (en-GB)',
    flag: '🇬🇧',
    voiceLocale: 'en-GB',
  },
  'pt-BR': {
    code: 'pt-BR',
    language: 'pt',
    labelEn: 'Brazilian Portuguese (pt-BR)',
    labelPt: 'Português Brasileiro (pt-BR)',
    labelEs: 'Portugués Brasileño (pt-BR)',
    flag: '🇧🇷',
    voiceLocale: 'pt-BR',
  },
  'pt-PT': {
    code: 'pt-PT',
    language: 'pt',
    labelEn: 'European Portuguese (pt-PT)',
    labelPt: 'Português Europeu (pt-PT)',
    labelEs: 'Portugués Europeo (pt-PT)',
    flag: '🇵🇹',
    voiceLocale: 'pt-PT',
  },
  'es-ES': {
    code: 'es-ES',
    language: 'es',
    labelEn: 'Peninsular Spanish (es-ES)',
    labelPt: 'Espanhol Peninsular (es-ES)',
    labelEs: 'Español Peninsular (es-ES)',
    flag: '🇪🇸',
    voiceLocale: 'es-ES',
  },
  'es-419': {
    code: 'es-419',
    language: 'es',
    labelEn: 'Latin American Spanish (es-419)',
    labelPt: 'Espanhol Hispano-americano (es-419)',
    labelEs: 'Español Hispanoamericano (es-419)',
    flag: '🌎',
    voiceLocale: 'es-MX',
  },
  'es-MX': {
    code: 'es-MX',
    language: 'es',
    labelEn: 'Mexican Spanish (es-MX)',
    labelPt: 'Espanhol Mexicano (es-MX)',
    labelEs: 'Español Mexicano (es-MX)',
    flag: '🇲🇽',
    voiceLocale: 'es-MX',
  },
  'es-AR': {
    code: 'es-AR',
    language: 'es',
    labelEn: 'Rioplatense Spanish (es-AR)',
    labelPt: 'Espanhol Rioplatense (es-AR)',
    labelEs: 'Español Rioplatense (es-AR)',
    flag: '🇦🇷',
    voiceLocale: 'es-AR',
  },
  'fr-FR': {
    code: 'fr-FR',
    language: 'fr',
    labelEn: 'Metropolitan French (fr-FR)',
    labelPt: 'Francês Metropolitano (fr-FR)',
    labelEs: 'Francés Metropolitano (fr-FR)',
    flag: '🇫🇷',
    voiceLocale: 'fr-FR',
  },
  'fr-CA': {
    code: 'fr-CA',
    language: 'fr',
    labelEn: 'Canadian French (fr-CA)',
    labelPt: 'Francês Canadense (fr-CA)',
    labelEs: 'Francés Canadiense (fr-CA)',
    flag: '🇨🇦',
    voiceLocale: 'fr-CA',
  },
  'de-DE': {
    code: 'de-DE',
    language: 'de',
    labelEn: 'German (Germany) (de-DE)',
    labelPt: 'Alemão (Alemanha) (de-DE)',
    labelEs: 'Alemán (Alemania) (de-DE)',
    flag: '🇩🇪',
    voiceLocale: 'de-DE',
  },
  'de-AT': {
    code: 'de-AT',
    language: 'de',
    labelEn: 'Austrian German (de-AT)',
    labelPt: 'Alemão Austríaco (de-AT)',
    labelEs: 'Alemán Austríaco (de-AT)',
    flag: '🇦🇹',
    voiceLocale: 'de-AT',
  },
  'de-CH': {
    code: 'de-CH',
    language: 'de',
    labelEn: 'Swiss German (de-CH)',
    labelPt: 'Alemão Suíço (de-CH)',
    labelEs: 'Alemán Suizo (de-CH)',
    flag: '🇨🇭',
    voiceLocale: 'de-CH',
  },
  'it-IT': {
    code: 'it-IT',
    language: 'it',
    labelEn: 'Standard Italian (it-IT)',
    labelPt: 'Italiano Padrão (it-IT)',
    labelEs: 'Italiano Estándar (it-IT)',
    flag: '🇮🇹',
    voiceLocale: 'it-IT',
  },
  'ja-JP': {
    code: 'ja-JP',
    language: 'ja',
    labelEn: 'Standard Japanese (ja-JP)',
    labelPt: 'Japonês Padrão (ja-JP)',
    labelEs: 'Japonés Estándar (ja-JP)',
    flag: '🇯🇵',
    voiceLocale: 'ja-JP',
  },
  'ko-KR': {
    code: 'ko-KR',
    language: 'ko',
    labelEn: 'Standard Korean (ko-KR)',
    labelPt: 'Coreano Padrão (ko-KR)',
    labelEs: 'Coreano Estándar (ko-KR)',
    flag: '🇰🇷',
    voiceLocale: 'ko-KR',
  },
  'ru-RU': {
    code: 'ru-RU',
    language: 'ru',
    labelEn: 'Standard Russian (ru-RU)',
    labelPt: 'Russo Padrão (ru-RU)',
    labelEs: 'Ruso Estándar (ru-RU)',
    flag: '🇷🇺',
    voiceLocale: 'ru-RU',
  },
  'nl-NL': {
    code: 'nl-NL',
    language: 'nl',
    labelEn: 'Standard Dutch (nl-NL)',
    labelPt: 'Holandês Padrão (nl-NL)',
    labelEs: 'Holandés Estándar (nl-NL)',
    flag: '🇳🇱',
    voiceLocale: 'nl-NL',
  },
  'nl-BE': {
    code: 'nl-BE',
    language: 'nl',
    labelEn: 'Flemish Dutch (nl-BE)',
    labelPt: 'Holandês Flamengo (nl-BE)',
    labelEs: 'Holandés Flamenco (nl-BE)',
    flag: '🇧🇪',
    voiceLocale: 'nl-BE',
  },
  'zh-Hans': {
    code: 'zh-Hans',
    language: 'zh',
    labelEn: 'Simplified Chinese (zh-Hans)',
    labelPt: 'Chinês Simplificado (zh-Hans)',
    labelEs: 'Chino Simplificado (zh-Hans)',
    flag: '🇨🇳',
    voiceLocale: 'zh-CN',
  },
  'zh-CN': {
    code: 'zh-CN',
    language: 'zh',
    labelEn: 'Mandarin (Mainland) (zh-CN)',
    labelPt: 'Mandarim (China) (zh-CN)',
    labelEs: 'Mandarín (China) (zh-CN)',
    flag: '🇨🇳',
    voiceLocale: 'zh-CN',
  },
  'tr-TR': {
    code: 'tr-TR',
    language: 'tr',
    labelEn: 'Standard Turkish (tr-TR)',
    labelPt: 'Turco Padrão (tr-TR)',
    labelEs: 'Turco Estándar (tr-TR)',
    flag: '🇹🇷',
    voiceLocale: 'tr-TR',
  },
  'ta-IN': {
    code: 'ta-IN',
    language: 'ta',
    labelEn: 'Indian Tamil (ta-IN)',
    labelPt: 'Tâmil Indiano (ta-IN)',
    labelEs: 'Tamil Indio (ta-IN)',
    flag: '🇮🇳',
    voiceLocale: 'ta-IN',
  },
  'ta-LK': {
    code: 'ta-LK',
    language: 'ta',
    labelEn: 'Sri Lankan Tamil (ta-LK)',
    labelPt: 'Tâmil Ceilanês (ta-LK)',
    labelEs: 'Tamil de Sri Lanka (ta-LK)',
    flag: '🇱🇰',
    voiceLocale: 'ta-LK',
  },
  'all': {
    code: 'all',
    language: 'all',
    labelEn: 'Neutral / Universal (all)',
    labelPt: 'Neutro / Universal (all)',
    labelEs: 'Neutro / Universal (all)',
    flag: '🌐',
    voiceLocale: 'en-US',
  },
};

/**
 * Checks whether a regional variety is valid for a given learning language.
 */
export function isValidRegionalVariety(
  learningLanguage: LearningLanguage,
  variety: RegionalVariety | string | null | undefined
): variety is RegionalVariety {
  if (!variety) return false;
  const allowed = REGIONAL_VARIETIES_BY_LANGUAGE[learningLanguage];
  return allowed ? allowed.includes(variety as RegionalVariety) : false;
}

/**
 * Enforces that a regional variety belongs strictly to the given learning language.
 * Returns the provided variety if valid, otherwise returns the language's default regional variety.
 */
export function enforceRegionalVariety(
  learningLanguage: LearningLanguage,
  variety?: string | null
): RegionalVariety {
  if (isValidRegionalVariety(learningLanguage, variety)) {
    return variety;
  }
  return DEFAULT_REGIONAL_VARIETY[learningLanguage] || 'all';
}

import { isForbiddenLanguage } from '../../config/languages/languageRegistry';

export function isValidInterfaceLanguage(lang: unknown): lang is InterfaceLanguage {
  return typeof lang === 'string' && SUPPORTED_INTERFACE_LANGUAGES.includes(lang as InterfaceLanguage);
}

export function isValidLearningLanguage(lang: unknown): lang is LearningLanguage {
  if (isForbiddenLanguage(lang)) return false;
  return typeof lang === 'string' && SUPPORTED_LEARNING_LANGUAGES.includes(lang as LearningLanguage);
}

export function isValidExplanationLanguage(lang: unknown): lang is ExplanationLanguage {
  return typeof lang === 'string' && SUPPORTED_EXPLANATION_LANGUAGES.includes(lang as ExplanationLanguage);
}

export interface DecoupledLanguageMatrix {
  interfaceLanguage: InterfaceLanguage;
  learningLanguage: LearningLanguage;
  explanationLanguage: ExplanationLanguage;
  regionalVariety: RegionalVariety;
}

/**
 * Validates and normalizes all 4 language dimensions into a coherent, decoupled matrix.
 * Enforces that:
 * - interfaceLanguage is one of 'en' | 'pt' | 'es' (default: 'en')
 * - learningLanguage is one of 'pt' | 'es' | 'en' (default: 'pt')
 * - explanationLanguage is one of 'en' | 'pt' | 'es' (default: 'en')
 * - regionalVariety is strictly validated against learningLanguage (falls back to default variety)
 */
export function enforceDecoupledLanguageMatrix(
  input: Partial<DecoupledLanguageMatrix>
): DecoupledLanguageMatrix {
  const interfaceLanguage: InterfaceLanguage = isValidInterfaceLanguage(input.interfaceLanguage)
    ? input.interfaceLanguage
    : 'en';

  const learningLanguage: LearningLanguage = isValidLearningLanguage(input.learningLanguage)
    ? input.learningLanguage
    : 'pt';

  const explanationLanguage: ExplanationLanguage = isValidExplanationLanguage(input.explanationLanguage)
    ? input.explanationLanguage
    : 'en';

  const regionalVariety = enforceRegionalVariety(learningLanguage, input.regionalVariety);

  return {
    interfaceLanguage,
    learningLanguage,
    explanationLanguage,
    regionalVariety,
  };
}

/**
 * Retrieves human-readable label for a learning language localized to the active interface language.
 */
export function getLanguageName(
  lang: LearningLanguage,
  interfaceLang: InterfaceLanguage = 'en'
): string {
  const meta = LANGUAGE_METADATA[lang];
  if (!meta) return lang;
  if (interfaceLang === 'pt') return meta.namePt;
  if (interfaceLang === 'es') return meta.nameEs;
  return meta.nameEn;
}

/**
 * Retrieves human-readable label for a regional variety localized to the active interface language.
 */
export function getRegionalVarietyLabel(
  variety: RegionalVariety,
  interfaceLang: InterfaceLanguage = 'en'
): string {
  const meta = REGIONAL_VARIETY_METADATA[variety];
  if (!meta) return variety;
  if (interfaceLang === 'pt') return meta.labelPt;
  if (interfaceLang === 'es') return meta.labelEs;
  return meta.labelEn;
}
