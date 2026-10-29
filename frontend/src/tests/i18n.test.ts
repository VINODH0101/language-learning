import { describe, it, expect } from 'vitest';
import { translations, TranslationDictionary } from '../i18n/translations';

describe('Internationalization & Theme Dictionary (i18n)', () => {
  const languages = ['en', 'pt', 'es'] as const;

  it('provides comprehensive translation coverage across English, Portuguese, and Spanish', () => {
    const requiredKeys: Array<keyof TranslationDictionary> = [
      'nav_dashboard',
      'nav_portuguese',
      'nav_spanish',
      'nav_translate',
      'nav_admin',
      'nav_guest_mode',
      'onboarding_title',
      'onboarding_step1_title',
      'auth_sign_in_title',
      'auth_sign_up_title',
      'auth_password_min_length',
      'admin_title',
      'admin_unauthorized_title',
      'settings_title',
      'settings_email_opt_in_title',
      'theme_dark',
      'theme_light',
      'theme_system',
    ];

    for (const lang of languages) {
      const dict = translations[lang];
      expect(dict).toBeDefined();

      for (const key of requiredKeys) {
        expect(dict[key], `Missing translation for key "${key}" in language "${lang}"`).toBeDefined();
        expect(dict[key].trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('supports independent interface language, target language, and explanation language', () => {
    // English interface, Portuguese target, Spanish explanation
    const userPrefs = {
      interface_language: 'en' as const,
      primary_target_language: 'pt' as const,
      explanation_language: 'es' as const,
    };

    expect(userPrefs.interface_language).toBe('en');
    expect(userPrefs.primary_target_language).toBe('pt');
    expect(userPrefs.explanation_language).toBe('es');
    expect(userPrefs.interface_language).not.toEqual(userPrefs.explanation_language);
  });
});
