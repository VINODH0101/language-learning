/**
 * Lexilume — Centralized i18next Configuration
 * 
 * Invariants:
 * 1. Initialized exactly once across the application lifecycle.
 * 2. Bundles all 11 namespaces across 15 authorized locales locally for 100% offline functionality.
 * 3. Fallback to English ('en') for missing keys with regional variant fallback rules.
 * 4. Hindi is strictly excluded.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { LanguageDetector } from './languageDetector';

// Import Locale Resources
// English (en)
import enCommon from './locales/en/common.json';
import enNav from './locales/en/navigation.json';
import enDash from './locales/en/dashboard.json';
import enLearn from './locales/en/learning.json';
import enPractice from './locales/en/practice.json';
import enProgress from './locales/en/progress.json';
import enAdmin from './locales/en/admin.json';
import enSettings from './locales/en/settings.json';
import enAuth from './locales/en/auth.json';
import enWorld from './locales/en/world.json';
import enErrors from './locales/en/errors.json';

// Portuguese (pt)
import ptCommon from './locales/pt/common.json';
import ptNav from './locales/pt/navigation.json';
import ptDash from './locales/pt/dashboard.json';
import ptLearn from './locales/pt/learning.json';
import ptPractice from './locales/pt/practice.json';
import ptProgress from './locales/pt/progress.json';
import ptAdmin from './locales/pt/admin.json';
import ptSettings from './locales/pt/settings.json';
import ptAuth from './locales/pt/auth.json';
import ptWorld from './locales/pt/world.json';
import ptErrors from './locales/pt/errors.json';

// Portuguese Brazil (pt-BR)
import ptBrCommon from './locales/pt-BR/common.json';
import ptBrNav from './locales/pt-BR/navigation.json';
import ptBrDash from './locales/pt-BR/dashboard.json';
import ptBrLearn from './locales/pt-BR/learning.json';
import ptBrPractice from './locales/pt-BR/practice.json';
import ptBrProgress from './locales/pt-BR/progress.json';
import ptBrAdmin from './locales/pt-BR/admin.json';
import ptBrSettings from './locales/pt-BR/settings.json';
import ptBrAuth from './locales/pt-BR/auth.json';
import ptBrWorld from './locales/pt-BR/world.json';
import ptBrErrors from './locales/pt-BR/errors.json';

// Portuguese Portugal (pt-PT)
import ptPtCommon from './locales/pt-PT/common.json';
import ptPtNav from './locales/pt-PT/navigation.json';
import ptPtDash from './locales/pt-PT/dashboard.json';
import ptPtLearn from './locales/pt-PT/learning.json';
import ptPtPractice from './locales/pt-PT/practice.json';
import ptPtProgress from './locales/pt-PT/progress.json';
import ptPtAdmin from './locales/pt-PT/admin.json';
import ptPtSettings from './locales/pt-PT/settings.json';
import ptPtAuth from './locales/pt-PT/auth.json';
import ptPtWorld from './locales/pt-PT/world.json';
import ptPtErrors from './locales/pt-PT/errors.json';

// Spanish (es)
import esCommon from './locales/es/common.json';
import esNav from './locales/es/navigation.json';
import esDash from './locales/es/dashboard.json';
import esLearn from './locales/es/learning.json';
import esPractice from './locales/es/practice.json';
import esProgress from './locales/es/progress.json';
import esAdmin from './locales/es/admin.json';
import esSettings from './locales/es/settings.json';
import esAuth from './locales/es/auth.json';
import esWorld from './locales/es/world.json';
import esErrors from './locales/es/errors.json';

// French (fr)
import frCommon from './locales/fr/common.json';
import frNav from './locales/fr/navigation.json';
import frDash from './locales/fr/dashboard.json';
import frLearn from './locales/fr/learning.json';
import frPractice from './locales/fr/practice.json';
import frProgress from './locales/fr/progress.json';
import frAdmin from './locales/fr/admin.json';
import frSettings from './locales/fr/settings.json';
import frAuth from './locales/fr/auth.json';
import frWorld from './locales/fr/world.json';
import frErrors from './locales/fr/errors.json';

// German (de)
import deCommon from './locales/de/common.json';
import deNav from './locales/de/navigation.json';
import deDash from './locales/de/dashboard.json';
import deLearn from './locales/de/learning.json';
import dePractice from './locales/de/practice.json';
import deProgress from './locales/de/progress.json';
import deAdmin from './locales/de/admin.json';
import deSettings from './locales/de/settings.json';
import deAuth from './locales/de/auth.json';
import deWorld from './locales/de/world.json';
import deErrors from './locales/de/errors.json';

// Italian (it)
import itCommon from './locales/it/common.json';
import itNav from './locales/it/navigation.json';
import itDash from './locales/it/dashboard.json';
import itLearn from './locales/it/learning.json';
import itPractice from './locales/it/practice.json';
import itProgress from './locales/it/progress.json';
import itAdmin from './locales/it/admin.json';
import itSettings from './locales/it/settings.json';
import itAuth from './locales/it/auth.json';
import itWorld from './locales/it/world.json';
import itErrors from './locales/it/errors.json';

// Japanese (ja)
import jaCommon from './locales/ja/common.json';
import jaNav from './locales/ja/navigation.json';
import jaDash from './locales/ja/dashboard.json';
import jaLearn from './locales/ja/learning.json';
import jaPractice from './locales/ja/practice.json';
import jaProgress from './locales/ja/progress.json';
import jaAdmin from './locales/ja/admin.json';
import jaSettings from './locales/ja/settings.json';
import jaAuth from './locales/ja/auth.json';
import jaWorld from './locales/ja/world.json';
import jaErrors from './locales/ja/errors.json';

// Korean (ko)
import koCommon from './locales/ko/common.json';
import koNav from './locales/ko/navigation.json';
import koDash from './locales/ko/dashboard.json';
import koLearn from './locales/ko/learning.json';
import koPractice from './locales/ko/practice.json';
import koProgress from './locales/ko/progress.json';
import koAdmin from './locales/ko/admin.json';
import koSettings from './locales/ko/settings.json';
import koAuth from './locales/ko/auth.json';
import koWorld from './locales/ko/world.json';
import koErrors from './locales/ko/errors.json';

// Russian (ru)
import ruCommon from './locales/ru/common.json';
import ruNav from './locales/ru/navigation.json';
import ruDash from './locales/ru/dashboard.json';
import ruLearn from './locales/ru/learning.json';
import ruPractice from './locales/ru/practice.json';
import ruProgress from './locales/ru/progress.json';
import ruAdmin from './locales/ru/admin.json';
import ruSettings from './locales/ru/settings.json';
import ruAuth from './locales/ru/auth.json';
import ruWorld from './locales/ru/world.json';
import ruErrors from './locales/ru/errors.json';

// Dutch (nl)
import nlCommon from './locales/nl/common.json';
import nlNav from './locales/nl/navigation.json';
import nlDash from './locales/nl/dashboard.json';
import nlLearn from './locales/nl/learning.json';
import nlPractice from './locales/nl/practice.json';
import nlProgress from './locales/nl/progress.json';
import nlAdmin from './locales/nl/admin.json';
import nlSettings from './locales/nl/settings.json';
import nlAuth from './locales/nl/auth.json';
import nlWorld from './locales/nl/world.json';
import nlErrors from './locales/nl/errors.json';

// Simplified Chinese (zh-Hans)
import zhHansCommon from './locales/zh-Hans/common.json';
import zhHansNav from './locales/zh-Hans/navigation.json';
import zhHansDash from './locales/zh-Hans/dashboard.json';
import zhHansLearn from './locales/zh-Hans/learning.json';
import zhHansPractice from './locales/zh-Hans/practice.json';
import zhHansProgress from './locales/zh-Hans/progress.json';
import zhHansAdmin from './locales/zh-Hans/admin.json';
import zhHansSettings from './locales/zh-Hans/settings.json';
import zhHansAuth from './locales/zh-Hans/auth.json';
import zhHansWorld from './locales/zh-Hans/world.json';
import zhHansErrors from './locales/zh-Hans/errors.json';

// Turkish (tr)
import trCommon from './locales/tr/common.json';
import trNav from './locales/tr/navigation.json';
import trDash from './locales/tr/dashboard.json';
import trLearn from './locales/tr/learning.json';
import trPractice from './locales/tr/practice.json';
import trProgress from './locales/tr/progress.json';
import trAdmin from './locales/tr/admin.json';
import trSettings from './locales/tr/settings.json';
import trAuth from './locales/tr/auth.json';
import trWorld from './locales/tr/world.json';
import trErrors from './locales/tr/errors.json';

// Tamil (ta)
import taCommon from './locales/ta/common.json';
import taNav from './locales/ta/navigation.json';
import taDash from './locales/ta/dashboard.json';
import taLearn from './locales/ta/learning.json';
import taPractice from './locales/ta/practice.json';
import taProgress from './locales/ta/progress.json';
import taAdmin from './locales/ta/admin.json';
import taSettings from './locales/ta/settings.json';
import taAuth from './locales/ta/auth.json';
import taWorld from './locales/ta/world.json';
import taErrors from './locales/ta/errors.json';

export const NAMESPACES = [
  'common',
  'navigation',
  'dashboard',
  'learning',
  'practice',
  'progress',
  'admin',
  'settings',
  'auth',
  'world',
  'errors',
] as const;

export const resources = {
  en: {
    common: enCommon,
    navigation: enNav,
    dashboard: enDash,
    learning: enLearn,
    practice: enPractice,
    progress: enProgress,
    admin: enAdmin,
    settings: enSettings,
    auth: enAuth,
    world: enWorld,
    errors: enErrors,
  },
  pt: {
    common: ptCommon,
    navigation: ptNav,
    dashboard: ptDash,
    learning: ptLearn,
    practice: ptPractice,
    progress: ptProgress,
    admin: ptAdmin,
    settings: ptSettings,
    auth: ptAuth,
    world: ptWorld,
    errors: ptErrors,
  },
  'pt-BR': {
    common: ptBrCommon,
    navigation: ptBrNav,
    dashboard: ptBrDash,
    learning: ptBrLearn,
    practice: ptBrPractice,
    progress: ptBrProgress,
    admin: ptBrAdmin,
    settings: ptBrSettings,
    auth: ptBrAuth,
    world: ptBrWorld,
    errors: ptBrErrors,
  },
  'pt-PT': {
    common: ptPtCommon,
    navigation: ptPtNav,
    dashboard: ptPtDash,
    learning: ptPtLearn,
    practice: ptPtPractice,
    progress: ptPtProgress,
    admin: ptPtAdmin,
    settings: ptPtSettings,
    auth: ptPtAuth,
    world: ptPtWorld,
    errors: ptPtErrors,
  },
  es: {
    common: esCommon,
    navigation: esNav,
    dashboard: esDash,
    learning: esLearn,
    practice: esPractice,
    progress: esProgress,
    admin: esAdmin,
    settings: esSettings,
    auth: esAuth,
    world: esWorld,
    errors: esErrors,
  },
  fr: {
    common: frCommon,
    navigation: frNav,
    dashboard: frDash,
    learning: frLearn,
    practice: frPractice,
    progress: frProgress,
    admin: frAdmin,
    settings: frSettings,
    auth: frAuth,
    world: frWorld,
    errors: frErrors,
  },
  de: {
    common: deCommon,
    navigation: deNav,
    dashboard: deDash,
    learning: deLearn,
    practice: dePractice,
    progress: deProgress,
    admin: deAdmin,
    settings: deSettings,
    auth: deAuth,
    world: deWorld,
    errors: deErrors,
  },
  it: {
    common: itCommon,
    navigation: itNav,
    dashboard: itDash,
    learning: itLearn,
    practice: itPractice,
    progress: itProgress,
    admin: itAdmin,
    settings: itSettings,
    auth: itAuth,
    world: itWorld,
    errors: itErrors,
  },
  ja: {
    common: jaCommon,
    navigation: jaNav,
    dashboard: jaDash,
    learning: jaLearn,
    practice: jaPractice,
    progress: jaProgress,
    admin: jaAdmin,
    settings: jaSettings,
    auth: jaAuth,
    world: jaWorld,
    errors: jaErrors,
  },
  ko: {
    common: koCommon,
    navigation: koNav,
    dashboard: koDash,
    learning: koLearn,
    practice: koPractice,
    progress: koProgress,
    admin: koAdmin,
    settings: koSettings,
    auth: koAuth,
    world: koWorld,
    errors: koErrors,
  },
  ru: {
    common: ruCommon,
    navigation: ruNav,
    dashboard: ruDash,
    learning: ruLearn,
    practice: ruPractice,
    progress: ruProgress,
    admin: ruAdmin,
    settings: ruSettings,
    auth: ruAuth,
    world: ruWorld,
    errors: ruErrors,
  },
  nl: {
    common: nlCommon,
    navigation: nlNav,
    dashboard: nlDash,
    learning: nlLearn,
    practice: nlPractice,
    progress: nlProgress,
    admin: nlAdmin,
    settings: nlSettings,
    auth: nlAuth,
    world: nlWorld,
    errors: nlErrors,
  },
  'zh-Hans': {
    common: zhHansCommon,
    navigation: zhHansNav,
    dashboard: zhHansDash,
    learning: zhHansLearn,
    practice: zhHansPractice,
    progress: zhHansProgress,
    admin: zhHansAdmin,
    settings: zhHansSettings,
    auth: zhHansAuth,
    world: zhHansWorld,
    errors: zhHansErrors,
  },
  tr: {
    common: trCommon,
    navigation: trNav,
    dashboard: trDash,
    learning: trLearn,
    practice: trPractice,
    progress: trProgress,
    admin: trAdmin,
    settings: trSettings,
    auth: trAuth,
    world: trWorld,
    errors: trErrors,
  },
  ta: {
    common: taCommon,
    navigation: taNav,
    dashboard: taDash,
    learning: taLearn,
    practice: taPractice,
    progress: taProgress,
    admin: taAdmin,
    settings: taSettings,
    auth: taAuth,
    world: taWorld,
    errors: taErrors,
  },
};

const initialLang = LanguageDetector.detectLanguage();

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: initialLang,
      fallbackLng: {
        'pt-BR': ['pt', 'en'],
        'pt-PT': ['pt', 'en'],
        zh: ['zh-Hans', 'en'],
        default: ['en'],
      },
      ns: NAMESPACES as unknown as string[],
      defaultNS: 'common',
      supportedLngs: [
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
      ],
      interpolation: {
        escapeValue: false, // React safely escapes strings
      },
      returnNull: false,
      returnEmptyString: false,
    });

  LanguageDetector.persistSelection(initialLang);
}

export default i18n;
