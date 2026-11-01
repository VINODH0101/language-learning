/**
 * Lexilume — Privacy-First Interface Language Detector
 * 
 * Invariants:
 * 1. Explicit user selection ALWAYS takes priority over browser detection.
 * 2. Saved preference in localStorage or authenticated Supabase profile is respected across reloads.
 * 3. Never overwrite saved user preference with browser-detected locale.
 * 4. Fallback gracefully to English ('en').
 * 5. Hindi is strictly excluded.
 */

import { InterfaceLanguage } from '../types';
import { SUPPORTED_INTERFACE_LANGUAGES } from '../lib/languages/languageMatrix';

export const STORAGE_KEYS = {
  INTERFACE_LANG: 'lexilume_interface_lang',
  LEGACY_INTERFACE_LANG: 'polyglot_interface_lang',
};

export class LanguageDetector {
  /**
   * Resolves the active interface language adhering strictly to priority:
   * 1. localStorage explicit user setting
   * 2. Authenticated profile setting
   * 3. Browser navigator.language heuristic (only on first visit)
   * 4. English fallback ('en')
   */
  public static detectLanguage(userProfileLanguage?: string | null): InterfaceLanguage {
    // 0. URL Query Parameter override (useful for testing, automation, and direct links)
    try {
      if (typeof window !== 'undefined' && window.location?.search) {
        const params = new URLSearchParams(window.location.search);
        const queryLang = params.get('lang');
        if (queryLang && this.isSupported(queryLang)) {
          return queryLang as InterfaceLanguage;
        }
      }
    } catch {}

    // 1. Explicit local storage preference
    try {
      if (typeof localStorage !== 'undefined') {
        const saved =
          localStorage.getItem(STORAGE_KEYS.INTERFACE_LANG) ||
          localStorage.getItem(STORAGE_KEYS.LEGACY_INTERFACE_LANG);
        if (saved && this.isSupported(saved)) {
          return saved as InterfaceLanguage;
        }
      }
    } catch {}

    // 2. Authenticated user profile preference
    if (userProfileLanguage && this.isSupported(userProfileLanguage)) {
      return userProfileLanguage as InterfaceLanguage;
    }

    // 3. Browser navigator language (first visit only)
    try {
      if (typeof navigator !== 'undefined' && navigator.language) {
        const browserRaw = navigator.language.toLowerCase();
        
        // Exact regional match (e.g. pt-br, pt-pt)
        if (browserRaw === 'pt-br') return 'pt-BR';
        if (browserRaw === 'pt-pt') return 'pt-PT';
        if (browserRaw.startsWith('zh')) return 'zh-Hans';

        // Base language code
        const base = browserRaw.split('-')[0];
        if (this.isSupported(base)) {
          return base as InterfaceLanguage;
        }
      }
    } catch {}

    // 4. Default canonical fallback
    return 'en';
  }

  /**
   * Validates if a language code is an authorized interface language.
   */
  public static isSupported(lang: string): boolean {
    return (SUPPORTED_INTERFACE_LANGUAGES as readonly string[]).includes(lang);
  }

  /**
   * Normalizes any language code, safely falling back to 'en' for invalid or forbidden inputs.
   */
  public static normalize(lang: string | null | undefined): InterfaceLanguage {
    if (lang && this.isSupported(lang)) {
      return lang as InterfaceLanguage;
    }
    return 'en';
  }

  /**
   * Persists the selected interface language locally and synchronizes DOM HTML attribute.
   */
  public static persistSelection(lang: InterfaceLanguage): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.INTERFACE_LANG, lang);
        localStorage.setItem(STORAGE_KEYS.LEGACY_INTERFACE_LANG, lang);
      }
      if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.lang = lang;
        // Directionality check for future RTL readiness
        document.documentElement.dir = 'ltr';
      }
    } catch {}
  }
}
