/**
 * Lexilume — Unified i18n Context & React Provider
 * 
 * Invariants:
 * 1. Interface Language, Learning Language, and Explanation Language remain strictly decoupled.
 * 2. Changing Interface Language updates the entire UI immediately without page reload.
 * 3. 100% of UI elements change language without corrupting learning tracks or progress.
 * 4. Supports all 13 application languages + Portuguese regional variants (pt-BR / pt-PT).
 * 5. Automatic synchronization with Supabase profile for authenticated users.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useTranslation as useI18nextTranslation } from 'react-i18next';
import { InterfaceLanguage } from '../types';
import i18n, { NAMESPACES } from './config';
import { LanguageDetector } from './languageDetector';
import { authService } from '../services/auth';
import { TranslationDictionary, translations } from './translations';

export { useTranslation, Trans } from 'react-i18next';

export type AppTheme = 'light' | 'dark' | 'system';

export interface I18nContextValue {
  interfaceLanguage: InterfaceLanguage;
  setInterfaceLanguage: (lang: InterfaceLanguage) => Promise<void>;
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  t: (key: string, fallback?: string, options?: Record<string, any>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEYS = {
  THEME: 'polyglot_theme',
};

function getInitialTheme(): AppTheme {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME);
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    }
  } catch {}
  return 'dark'; // Default dark theme
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [interfaceLanguage, setLangState] = useState<InterfaceLanguage>(() => {
    return LanguageDetector.detectLanguage();
  });
  const [theme, setThemeState] = useState<AppTheme>(getInitialTheme);
  const { t: i18nTranslate } = useI18nextTranslation();

  // Listen for authenticated user profile language synchronization
  useEffect(() => {
    const unsub = authService.subscribe((authState) => {
      if (authState.user?.interface_language) {
        const userLang = authState.user.interface_language as InterfaceLanguage;
        if (LanguageDetector.isSupported(userLang) && userLang !== interfaceLanguage) {
          setLangState(userLang);
          i18n.changeLanguage(userLang);
          LanguageDetector.persistSelection(userLang);
        }
      }
    });
    return unsub;
  }, [interfaceLanguage]);

  // Apply Theme to DOM root
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery =
      typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(prefers-color-scheme: dark)')
        : null;

    const applyThemeClass = () => {
      const isDark =
        theme === 'dark' || (theme === 'system' && (mediaQuery?.matches ?? false));

      if (isDark) {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
    };

    applyThemeClass();

    const handleSystemChange = () => {
      if (theme === 'system') applyThemeClass();
    };

    if (mediaQuery) {
      mediaQuery.addEventListener('change', handleSystemChange);
      return () => mediaQuery.removeEventListener('change', handleSystemChange);
    }
  }, [theme]);

  // Apply HTML lang attribute
  useEffect(() => {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.lang = interfaceLanguage;
    }
  }, [interfaceLanguage]);

  const setInterfaceLanguage = useCallback(async (lang: InterfaceLanguage) => {
    if (!LanguageDetector.isSupported(lang)) return;

    // 1. Immediately persist locally and update HTML lang synchronously
    LanguageDetector.persistSelection(lang);

    // 2. Immediately update React state for instant UI re-render
    setLangState(lang);

    // 3. Change active i18next language
    await i18n.changeLanguage(lang);

    // 4. Synchronize with Supabase profile if authenticated
    try {
      const auth = authService.getState();
      if (auth.user) {
        await authService.updateProfile({ interface_language: lang });
      }
    } catch {}
  }, []);

  const setTheme = useCallback((newTheme: AppTheme) => {
    setThemeState(newTheme);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
      }
    } catch {}
  }, []);

  /**
   * Universal, resilient translation helper.
   * Resolves keys across namespaces, legacy flat dictionary, and provides fallback.
   */
  const t = useCallback((key: string, fallback?: string, options?: Record<string, any>): string => {
    if (!key) return fallback || '';

    // 1. Check if key is namespaced (e.g., 'common:save' or 'dashboard.next_lesson_title')
    const hasColon = key.includes(':');
    if (hasColon) {
      const translated = i18n.t(key, { ...options, defaultValue: fallback });
      if (translated && translated !== key) return translated;
    }

    // 2. Try looking up in the currently active namespace and all known namespaces
    for (const ns of NAMESPACES) {
      const nsKey = `${ns}:${key}`;
      if (i18n.exists(nsKey)) {
        return i18n.t(nsKey, options);
      }
    }

    // 3. Try standard translation with fallback
    const directResult = i18nTranslate(key, { ...options, defaultValue: '' });
    if (directResult && directResult !== key) {
      return directResult;
    }

    // 4. Check legacy flat dictionary for backward compatibility
    const baseLang = interfaceLanguage.startsWith('pt') ? 'pt' : interfaceLanguage === 'es' ? 'es' : 'en';
    const legacyDict = translations[baseLang] || translations.en;
    const legacyVal = (legacyDict as any)?.[key];
    if (legacyVal) {
      return legacyVal;
    }

    // 5. English fallback from legacy dictionary
    const enFallback = (translations.en as any)?.[key];
    if (enFallback) {
      return enFallback;
    }

    // 6. Return explicit fallback parameter or key itself
    return fallback || key;
  }, [i18nTranslate, interfaceLanguage]);

  return (
    <I18nContext.Provider
      value={{
        interfaceLanguage,
        setInterfaceLanguage,
        theme,
        setTheme,
        t,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
}
