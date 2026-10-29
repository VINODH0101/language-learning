import React, { createContext, useContext, useState, useEffect } from 'react';
import { InterfaceLanguage, TranslationDictionary, translations } from './translations';

export type AppTheme = 'light' | 'dark' | 'system';

interface I18nContextValue {
  interfaceLanguage: InterfaceLanguage;
  setInterfaceLanguage: (lang: InterfaceLanguage) => void;
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  t: (key: keyof TranslationDictionary, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEYS = {
  LANG: 'polyglot_interface_lang',
  THEME: 'polyglot_theme',
};

function getInitialTheme(): AppTheme {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
  } catch {}
  return 'dark'; // Default dark theme
}

function getInitialLang(): InterfaceLanguage {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.LANG);
    if (saved === 'en' || saved === 'pt' || saved === 'es') {
      return saved;
    }
  } catch {}
  return 'en'; // English default
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [interfaceLanguage, setLangState] = useState<InterfaceLanguage>(getInitialLang);
  const [theme, setThemeState] = useState<AppTheme>(getInitialTheme);

  // Apply Theme to DOM root
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = typeof window !== 'undefined' && window.matchMedia
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

  const setInterfaceLanguage = (lang: InterfaceLanguage) => {
    setLangState(lang);
    try {
      localStorage.setItem(STORAGE_KEYS.LANG, lang);
    } catch {}
  };

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
    } catch {}
  };

  const t = (key: keyof TranslationDictionary, fallback?: string): string => {
    const dict = translations[interfaceLanguage] || translations.en;
    return dict[key] || fallback || translations.en[key] || (key as string);
  };

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
