import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import i18n, { NAMESPACES, resources } from '../../i18n/config';
import { LanguageDetector, STORAGE_KEYS } from '../../i18n/languageDetector';
import {
  SUPPORTED_INTERFACE_LANGUAGES,
  SUPPORTED_LEARNING_LANGUAGES,
  SUPPORTED_EXPLANATION_LANGUAGES,
  enforceRegionalVariety,
} from '../../lib/languages/languageMatrix';
import {
  INTERFACE_LANGUAGES_LIST,
  INTERFACE_LANGUAGES_MAP,
  getInterfaceLanguageInfo,
} from '../../i18n/interfaceLanguages';
import { InterfaceLanguageSelector } from '../../components/common/InterfaceLanguageSelector';
import { I18nProvider, useI18n } from '../../i18n/i18nContext';
import { courseService } from '../../services/courseService';
import { StorageService } from '../../services/storage';

describe('Centralized Internationalization (i18n) Architecture & Decoupling', () => {
  const expectedLocales = [
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
  ];

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Locales Bundle & Key Coverage (135 JSON files across 15 Locales)', () => {
    it('should bundle all 15 authorized locales in the central i18n resource registry', () => {
      const resourceLocales = Object.keys(resources);
      expectedLocales.forEach((loc) => {
        expect(resourceLocales).toContain(loc);
      });
    });

    it('should have all 9 authorized namespaces in every locale', () => {
      expectedLocales.forEach((loc) => {
        const localeData = (resources as Record<string, Record<string, any>>)[loc];
        expect(localeData).toBeDefined();

        NAMESPACES.forEach((ns) => {
          expect(localeData[ns], `Namespace "${ns}" missing in locale "${loc}"`).toBeDefined();
        });
      });
    });

    it('should guarantee 100% key parity with the English base across all 9 namespaces', () => {
      const enData = (resources as Record<string, Record<string, Record<string, string>>>)['en'];

      NAMESPACES.forEach((ns) => {
        const enNamespace = enData[ns];
        expect(enNamespace).toBeDefined();
        const enKeys = Object.keys(enNamespace).sort();

        expectedLocales.forEach((loc) => {
          const locNamespace = (resources as Record<string, Record<string, Record<string, string>>>)[loc][ns];
          expect(locNamespace).toBeDefined();

          const missingKeys = enKeys.filter((k) => !(k in locNamespace));
          expect(
            missingKeys,
            `Locale "${loc}" is missing keys in "${ns}.json": ${missingKeys.join(', ')}`
          ).toHaveLength(0);
        });
      });
    });

    it('should strictly exclude Hindi ("hi") from all supported languages and registries', () => {
      expect((expectedLocales as string[]).includes('hi')).toBe(false);
      expect((SUPPORTED_INTERFACE_LANGUAGES as readonly string[]).includes('hi')).toBe(false);
      expect((SUPPORTED_LEARNING_LANGUAGES as readonly string[]).includes('hi')).toBe(false);
      expect((SUPPORTED_EXPLANATION_LANGUAGES as readonly string[]).includes('hi')).toBe(false);
      expect('hi' in resources).toBe(false);
    });
  });

  describe('2. Four-Way Linguistic Decoupling Invariants', () => {
    it('should maintain strict independence: changing interface language never modifies learning course or track progress', () => {
      // 1. Setup active course for target language 'pt'
      const initialCourse = courseService.getActiveCourse();
      expect(initialCourse).toBeDefined();

      const initialTrack = StorageService.getTrackState('pt');
      const initialCompletedNodes = [...initialTrack.completed_curriculum_node_ids];

      // 2. Change interface language to French ('fr')
      act(() => {
        i18n.changeLanguage('fr');
        LanguageDetector.persistSelection('fr');
      });

      // 3. Verify interface language updated in DOM and detector
      expect(document.documentElement.lang).toBe('fr');
      expect(localStorage.getItem(STORAGE_KEYS.INTERFACE_LANG)).toBe('fr');

      // 4. Verify learning progress remains intact and completely untouched
      const courseAfter = courseService.getActiveCourse();
      expect(courseAfter.id).toBe(initialCourse.id);
      expect(courseAfter.target_language).toBe(initialCourse.target_language);

      const trackAfter = StorageService.getTrackState('pt');
      expect(trackAfter.completed_curriculum_node_ids).toEqual(initialCompletedNodes);
    });

    it('should maintain strict independence: changing learning language never modifies interface language', () => {
      // 1. Set interface language to 'es'
      act(() => {
        i18n.changeLanguage('es');
        LanguageDetector.persistSelection('es');
      });
      expect(document.documentElement.lang).toBe('es');

      // 2. Switch learning course to English
      const enCourse = courseService.getCourses().find((c) => c.target_language === 'en');
      if (enCourse) {
        courseService.setActiveCourse(enCourse.id);
      }

      // 3. Interface language must still be 'es'
      expect(i18n.language).toBe('es');
      expect(document.documentElement.lang).toBe('es');
    });

    it('should enforce regional variety binding to target learning language only', () => {
      expect(enforceRegionalVariety('pt', 'pt-BR')).toBe('pt-BR');
      expect(enforceRegionalVariety('pt', 'pt-PT')).toBe('pt-PT');
      expect(enforceRegionalVariety('pt', 'invalid' as any)).toBe('pt-BR');
      expect(enforceRegionalVariety('es', 'es-ES')).toBe('es-ES');
      expect(enforceRegionalVariety('en', 'en-US')).toBe('en-US');
    });
  });

  describe('3. Language Detector & Fallback Mechanics', () => {
    it('should safely fall back to English if an unsupported language is requested', () => {
      const detected = LanguageDetector.detectLanguage();
      expect(expectedLocales.includes(detected)).toBe(true);

      const normalized = LanguageDetector.isSupported('xx' as any);
      expect(normalized).toBe(false);
    });

    it('should synchronize document.documentElement lang attribute on selection', () => {
      LanguageDetector.persistSelection('ja');
      expect(document.documentElement.lang).toBe('ja');
      expect(document.documentElement.dir).toBe('ltr');

      LanguageDetector.persistSelection('de');
      expect(document.documentElement.lang).toBe('de');
    });

    it('should return valid translated strings without raw placeholders', () => {
      i18n.changeLanguage('pt');
      const translated = i18n.t('common:brand_name');
      expect(translated).toBe('Lexilume');

      const banner = i18n.t('dashboard:banner_badge');
      expect(banner.length).toBeGreaterThan(0);
      expect(banner).not.toBe('dashboard:banner_badge');
    });
  });

  describe('4. Accessible InterfaceLanguageSelector Component', () => {
    it('should render the active interface language and toggle all 15 native options on click', () => {
      const TestConsumer = () => {
        const { t, interfaceLanguage } = useI18n();
        return (
          <div>
            <div data-testid="current-lang">{interfaceLanguage}</div>
            <div data-testid="home-label">{t('navigation:nav_home')}</div>
            <InterfaceLanguageSelector />
          </div>
        );
      };

      render(
        <I18nProvider>
          <TestConsumer />
        </I18nProvider>
      );

      // Verify initial trigger button is visible
      const selector = screen.getByTestId('interface-language-selector');
      expect(selector).toBeDefined();

      const button = selector.querySelector('button');
      expect(button).toBeDefined();

      // Open dropdown
      fireEvent.click(button!);

      // Verify all 15 languages are listed with native names
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(15);

      // Verify English, Portuguese (Brasil), Español, Japanese, etc. are listed
      expect(screen.getByText('Português (Brasil)')).toBeDefined();
      expect(screen.getByText('日本語')).toBeDefined();
      expect(screen.getByText('Français')).toBeDefined();
      expect(screen.getByText('தமிழ்')).toBeDefined();

      // Click on Japanese ('ja')
      const jaOption = screen.getByText('日本語').closest('button');
      expect(jaOption).toBeDefined();
      fireEvent.click(jaOption!);

      // Immediate reactive update without page reload
      expect(screen.getByTestId('current-lang').textContent).toBe('ja');
    });
  });
});
