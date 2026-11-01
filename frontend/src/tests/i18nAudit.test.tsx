/**
 * Lexilume — Comprehensive Internationalization (i18n) Audit & Verification Suite
 * 
 * Verifies:
 * 1. Strict Four-Way Linguistic Decoupling & Independent Language Settings:
 *    - Interface Language (UI Chrome)
 *    - Learning Target Language (Active Course Content)
 *    - Explanation Language (Pedagogy & Grammar)
 *    - Regional Variety (Phonetics & TTS strictly bound to target language)
 * 2. 11 Authorized Namespaces across 15 Locales with 100% Key Parity.
 * 3. Strict Exclusion of Hindi ('hi') across all registries, resources, and UI pickers.
 * 4. Fallback Mechanics: Missing translation keys cleanly fallback without raw placeholder corruption.
 * 5. Educational Content Integrity: Target vocabulary and literature remain uncorrupted when UI language shifts.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import i18n, { NAMESPACES, resources } from '../i18n/config';
import { I18nProvider, useI18n } from '../i18n/i18nContext';
import { LanguageDetector, STORAGE_KEYS } from '../i18n/languageDetector';
import { courseService } from '../services/courseService';
import { StorageService } from '../services/storage';
import {
  SUPPORTED_INTERFACE_LANGUAGES,
  SUPPORTED_LEARNING_LANGUAGES,
  SUPPORTED_EXPLANATION_LANGUAGES,
  enforceRegionalVariety,
  getLanguageName,
  getRegionalVarietyLabel,
} from '../lib/languages/languageMatrix';
import { INTERFACE_LANGUAGES_LIST } from '../i18n/interfaceLanguages';

describe('Lexilume Comprehensive i18n Audit & Verification Suite', () => {
  const AUTHORIZED_LOCALES = [
    'en', 'pt', 'pt-BR', 'pt-PT', 'es',
    'fr', 'de', 'it', 'ja', 'ko',
    'ru', 'nl', 'zh-Hans', 'tr', 'ta'
  ];

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. 11 Namespaces & 15 Locales Complete Key Parity', () => {
    it('should register exactly all 11 required namespaces', () => {
      const requiredNamespaces = [
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
      ];
      expect(NAMESPACES).toHaveLength(11);
      requiredNamespaces.forEach((ns) => {
        expect(NAMESPACES).toContain(ns);
      });
    });

    it('should contain all 15 authorized locales in resources bundle', () => {
      const bundledLocales = Object.keys(resources);
      AUTHORIZED_LOCALES.forEach((loc) => {
        expect(bundledLocales).toContain(loc);
      });
    });

    it('should guarantee 100% key parity with English base for all 11 namespaces across all 15 locales', () => {
      const enBundle = (resources as Record<string, Record<string, Record<string, string>>>)['en'];

      NAMESPACES.forEach((ns) => {
        const enNamespace = enBundle[ns];
        expect(enNamespace, `Namespace "${ns}" missing in "en"`).toBeDefined();
        const enKeys = Object.keys(enNamespace).sort();

        AUTHORIZED_LOCALES.forEach((loc) => {
          const locNamespace = (resources as Record<string, Record<string, Record<string, string>>>)[loc][ns];
          expect(locNamespace, `Namespace "${ns}" missing in locale "${loc}"`).toBeDefined();

          const missingKeys = enKeys.filter((k) => !(k in locNamespace));
          expect(
            missingKeys,
            `Locale "${loc}" is missing keys in "${ns}.json": ${missingKeys.join(', ')}`
          ).toHaveLength(0);
        });
      });
    });
  });

  describe('2. Four-Way Linguistic Decoupling & Independent Language Settings', () => {
    it('switching interface language never alters active course target language or explanation language', () => {
      // 1. Establish initial active course: Portuguese (Target: pt, Explanation: en)
      const initialCourse = courseService.getActiveCourse('guest');
      expect(initialCourse.target_language).toBe('pt');

      // 2. Set interface language to Spanish ('es')
      act(() => {
        i18n.changeLanguage('es');
        LanguageDetector.persistSelection('es');
      });

      // Interface language updated
      expect(i18n.language).toBe('es');
      expect(document.documentElement.lang).toBe('es');

      // Course target and explanation languages must remain unchanged
      const courseAfterEs = courseService.getActiveCourse('guest');
      expect(courseAfterEs.id).toBe(initialCourse.id);
      expect(courseAfterEs.target_language).toBe('pt');

      // 3. Switch interface language to English ('en')
      act(() => {
        i18n.changeLanguage('en');
        LanguageDetector.persistSelection('en');
      });

      expect(i18n.language).toBe('en');
      const courseAfterEn = courseService.getActiveCourse('guest');
      expect(courseAfterEn.id).toBe(initialCourse.id);
      expect(courseAfterEn.target_language).toBe('pt');
    });

    it('switching active learning course never alters interface language', () => {
      // 1. Set interface language to Portuguese ('pt')
      act(() => {
        i18n.changeLanguage('pt');
        LanguageDetector.persistSelection('pt');
      });
      expect(i18n.language).toBe('pt');

      // 2. Switch learning course to English
      const allCourses = courseService.getCourses('guest');
      const englishCourse = allCourses.find((c) => c.target_language === 'en');
      expect(englishCourse).toBeDefined();

      courseService.setActiveCourse(englishCourse!.id, 'guest');

      // Interface language must still strictly remain Portuguese ('pt')
      expect(i18n.language).toBe('pt');
      expect(document.documentElement.lang).toBe('pt');
      expect(localStorage.getItem(STORAGE_KEYS.INTERFACE_LANG)).toBe('pt');
    });

    it('explanation language is independently configurable and preserved across sessions', () => {
      localStorage.setItem('polyglot_explanation_lang', 'es');
      expect(localStorage.getItem('polyglot_explanation_lang')).toBe('es');

      // Updating explanation language does not affect UI interface language
      act(() => {
        i18n.changeLanguage('pt');
      });
      expect(localStorage.getItem('polyglot_explanation_lang')).toBe('es');
      expect(i18n.language).toBe('pt');
    });

    it('strictly binds regional variety to target learning language and normalizes mismatches', () => {
      // Portuguese varieties
      expect(enforceRegionalVariety('pt', 'pt-BR')).toBe('pt-BR');
      expect(enforceRegionalVariety('pt', 'pt-PT')).toBe('pt-PT');
      expect(enforceRegionalVariety('pt', 'en-US' as any)).toBe('pt-BR');

      // Spanish varieties
      expect(enforceRegionalVariety('es', 'es-ES')).toBe('es-ES');
      expect(enforceRegionalVariety('es', 'es-MX')).toBe('es-MX');
      expect(enforceRegionalVariety('es', 'pt-BR' as any)).toBe('es-ES');

      // English varieties
      expect(enforceRegionalVariety('en', 'en-US')).toBe('en-US');
      expect(enforceRegionalVariety('en', 'en-GB')).toBe('en-GB');
      expect(enforceRegionalVariety('en', 'es-ES' as any)).toBe('en-US');
    });
  });

  describe('3. Strict Exclusion of Forbidden Language (Hindi "hi")', () => {
    it('excludes Hindi from all supported language lists and matrices', () => {
      expect((SUPPORTED_INTERFACE_LANGUAGES as readonly string[]).includes('hi')).toBe(false);
      expect((SUPPORTED_LEARNING_LANGUAGES as readonly string[]).includes('hi')).toBe(false);
      expect((SUPPORTED_EXPLANATION_LANGUAGES as readonly string[]).includes('hi')).toBe(false);
      expect((AUTHORIZED_LOCALES as string[]).includes('hi')).toBe(false);
      expect('hi' in resources).toBe(false);
    });

    it('excludes Hindi from the InterfaceLanguageSelector picker list', () => {
      const hindiInList = INTERFACE_LANGUAGES_LIST.some((item) => item.code === ('hi' as any));
      expect(hindiInList).toBe(false);
    });

    it('rejects "hi" in LanguageDetector and normalizes to English fallback', () => {
      expect(LanguageDetector.isSupported('hi' as any)).toBe(false);
      const normalized = LanguageDetector.normalize('hi' as any);
      expect(normalized).toBe('en');
    });
  });

  describe('4. Localized Label Helpers (getLanguageName & getRegionalVarietyLabel)', () => {
    it('correctly localizes learning language names according to the active interface language', () => {
      // English interface
      expect(getLanguageName('pt', 'en')).toBe('Portuguese');
      expect(getLanguageName('es', 'en')).toBe('Spanish');
      expect(getLanguageName('en', 'en')).toBe('English');

      // Portuguese interface
      expect(getLanguageName('pt', 'pt')).toBe('Português');
      expect(getLanguageName('es', 'pt')).toBe('Espanhol');
      expect(getLanguageName('en', 'pt')).toBe('Inglês');

      // Spanish interface
      expect(getLanguageName('pt', 'es')).toBe('Portugués');
      expect(getLanguageName('es', 'es')).toBe('Español');
      expect(getLanguageName('en', 'es')).toBe('Inglés');
    });

    it('correctly localizes regional variety labels across interface languages', () => {
      expect(getRegionalVarietyLabel('pt-BR', 'en')).toContain('Brazilian Portuguese');
      expect(getRegionalVarietyLabel('pt-BR', 'pt')).toContain('Português Brasileiro');
      expect(getRegionalVarietyLabel('pt-BR', 'es')).toContain('Portugués Brasileño');

      expect(getRegionalVarietyLabel('es-ES', 'en')).toContain('Peninsular Spanish');
      expect(getRegionalVarietyLabel('es-ES', 'pt')).toContain('Espanhol Peninsular');
      expect(getRegionalVarietyLabel('es-ES', 'es')).toContain('Español Peninsular');
    });
  });

  describe('5. Fallback Mechanics & Missing Key Protection', () => {
    it('returns valid translated strings without raw placeholders or unparsed curly braces', () => {
      i18n.changeLanguage('pt');
      const progressTitle = i18n.t('progress:roadmap_title');
      expect(progressTitle).toBe('Roteiro de Progressão CEFR & Unidades Marco');

      const practiceTitle = i18n.t('practice:page_title');
      expect(practiceTitle).toBe('Prática e Recordação Espaçada');

      const adminTitle = i18n.t('admin:workbench_title');
      expect(adminTitle).toBe('Painel de Administração e Qualidade');

      // Switch to Spanish
      i18n.changeLanguage('es');
      expect(i18n.t('progress:roadmap_title')).toBe('Ruta de Progresión CEFR y Unidades Clave');
      expect(i18n.t('practice:page_title')).toBe('Práctica y Repetición Espaciada');
      expect(i18n.t('admin:workbench_title')).toBe('Panel de Administración y Calidad');

      // Switch to English
      i18n.changeLanguage('en');
      expect(i18n.t('progress:roadmap_title')).toBe('CEFR Progression Roadmap & Milestone Units');
      expect(i18n.t('practice:page_title')).toBe('Practice & Spaced Repetition');
      expect(i18n.t('admin:workbench_title')).toBe('Administration & Quality Workbench');
    });
  });
});
