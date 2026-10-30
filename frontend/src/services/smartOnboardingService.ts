/**
 * Smart Onboarding Service
 * 
 * Detects browser preferences and timezone using zero-cost, privacy-first client APIs:
 * - navigator.language & navigator.languages
 * - Intl.DateTimeFormat().resolvedOptions().timeZone
 * 
 * INVARIANTS:
 * 1. Never silently request GPS coordinates.
 * 2. Never infer nationality from IP addresses.
 * 3. Never force a country based on timezone; all fields are suggestions with 100% user overrides.
 * 4. Transparent explanations provided to the user with an option to skip detection.
 */

import { InterfaceLanguage, LearningLanguage, ExplanationLanguage } from '../lib/languages/languageMatrix';

export interface SmartOnboardingSuggestions {
  browserLanguage: string;
  detectedTimezone: string;
  suggestedInterfaceLanguage: InterfaceLanguage;
  suggestedTargetLanguage: LearningLanguage;
  suggestedExplanationLanguage: ExplanationLanguage;
  suggestedCountryCode: string;
  suggestedLearningHour: number; // e.g. 19 (7 PM)
}

export class SmartOnboardingService {
  /**
   * Derives smart non-intrusive onboarding suggestions based solely on browser APIs.
   */
  public static getSmartSuggestions(): SmartOnboardingSuggestions {
    let browserLang = 'en';
    if (typeof navigator !== 'undefined' && navigator.language) {
      browserLang = navigator.language.toLowerCase();
    }

    let detectedTz = 'UTC';
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      try {
        detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      } catch {
        detectedTz = 'UTC';
      }
    }

    // 1. Suggest Interface Language
    let suggestedInterface: InterfaceLanguage = 'en';
    if (browserLang.startsWith('pt')) suggestedInterface = 'pt';
    else if (browserLang.startsWith('es')) suggestedInterface = 'es';

    // 2. Suggest Country Code from Timezone
    let suggestedCountry = 'PT';
    if (detectedTz.includes('Sao_Paulo') || detectedTz.includes('Fortaleza') || detectedTz.includes('Manaus')) {
      suggestedCountry = 'BR';
    } else if (detectedTz.includes('Lisbon') || detectedTz.includes('Madeira') || detectedTz.includes('Azores')) {
      suggestedCountry = 'PT';
    } else if (detectedTz.includes('Madrid') || detectedTz.includes('Canary')) {
      suggestedCountry = 'ES';
    } else if (detectedTz.includes('Paris')) {
      suggestedCountry = 'FR';
    } else if (detectedTz.includes('Berlin')) {
      suggestedCountry = 'DE';
    } else if (detectedTz.includes('Rome')) {
      suggestedCountry = 'IT';
    } else if (detectedTz.includes('Tokyo')) {
      suggestedCountry = 'JP';
    } else if (detectedTz.includes('Seoul')) {
      suggestedCountry = 'KR';
    } else if (detectedTz.includes('Moscow')) {
      suggestedCountry = 'RU';
    } else if (detectedTz.includes('Amsterdam')) {
      suggestedCountry = 'NL';
    } else if (detectedTz.includes('Shanghai') || detectedTz.includes('Beijing')) {
      suggestedCountry = 'CN';
    } else if (detectedTz.includes('Istanbul')) {
      suggestedCountry = 'TR';
    } else if (detectedTz.includes('Kolkata') || detectedTz.includes('Chennai')) {
      suggestedCountry = 'IN';
    } else if (detectedTz.includes('London')) {
      suggestedCountry = 'GB';
    } else if (detectedTz.includes('New_York') || detectedTz.includes('Chicago') || detectedTz.includes('Los_Angeles')) {
      suggestedCountry = 'US';
    }

    // 3. Suggest Learning Language (default complementary to interface)
    let suggestedTarget: LearningLanguage = 'pt';
    if (suggestedInterface === 'pt') suggestedTarget = 'es';
    else if (suggestedInterface === 'es') suggestedTarget = 'pt';
    else suggestedTarget = 'pt';

    // 4. Suggest Explanation Language
    const suggestedExplanation: ExplanationLanguage = suggestedInterface;

    return {
      browserLanguage: browserLang,
      detectedTimezone: detectedTz,
      suggestedInterfaceLanguage: suggestedInterface,
      suggestedTargetLanguage: suggestedTarget,
      suggestedExplanationLanguage: suggestedExplanation,
      suggestedCountryCode: suggestedCountry,
      suggestedLearningHour: 19, // 7:00 PM default evening review
    };
  }
}
