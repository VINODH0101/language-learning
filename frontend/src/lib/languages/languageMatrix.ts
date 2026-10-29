/**
 * Polyglot C1 Daily — Language Decoupling Core Matrix
 * 
 * Enforces the strict separation between:
 * 1. Interface Language (UI chrome, buttons, navigation, modals, system messages)
 * 2. Learning Language (Target language actively studied: words, passages, exercises)
 * 3. Explanation Language (Pedagogical language: grammar notes, definitions, answer explanations)
 * 4. Regional Variety (Dialectal qualification of the learning language: phonetics, audio, syntax notes)
 */

export type InterfaceLanguage = 'en' | 'pt' | 'es';

export type LearningLanguage = 'pt' | 'es' | 'en';

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
  // Universal neutral
  | 'all';

export const SUPPORTED_INTERFACE_LANGUAGES: readonly InterfaceLanguage[] = ['en', 'pt', 'es'] as const;

export const SUPPORTED_LEARNING_LANGUAGES: readonly LearningLanguage[] = ['pt', 'es', 'en'] as const;

export const SUPPORTED_EXPLANATION_LANGUAGES: readonly ExplanationLanguage[] = ['en', 'pt', 'es'] as const;

/**
 * Strict mapping of valid Regional Varieties for each Learning Language.
 * A regional variety is ALWAYS bound to a specific learning language.
 */
export const REGIONAL_VARIETIES_BY_LANGUAGE: Record<LearningLanguage, readonly RegionalVariety[]> = {
  pt: ['pt-BR', 'pt-PT', 'all'],
  es: ['es-ES', 'es-419', 'es-MX', 'es-AR', 'all'],
  en: ['en-US', 'en-GB', 'all'],
};

/**
 * Default regional variety per learning language when unspecified or invalid.
 */
export const DEFAULT_REGIONAL_VARIETY: Record<LearningLanguage, RegionalVariety> = {
  pt: 'pt-BR',
  es: 'es-ES',
  en: 'en-US',
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
  pt: {
    code: 'pt',
    nameEn: 'Portuguese',
    namePt: 'Português',
    nameEs: 'Portugués',
    flag: '🇵🇹',
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
  en: {
    code: 'en',
    nameEn: 'English',
    namePt: 'Inglês',
    nameEs: 'Inglés',
    flag: '🇬🇧',
    defaultVariety: 'en-US',
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

export function isValidInterfaceLanguage(lang: unknown): lang is InterfaceLanguage {
  return typeof lang === 'string' && SUPPORTED_INTERFACE_LANGUAGES.includes(lang as InterfaceLanguage);
}

export function isValidLearningLanguage(lang: unknown): lang is LearningLanguage {
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
