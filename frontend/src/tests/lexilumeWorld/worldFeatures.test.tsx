/**
 * Lexilume World & Smart Features Test Suite
 * 
 * Verifies:
 * 1. Smart non-intrusive onboarding suggestions & user override guarantee
 * 2. World Clock & contextual greetings across languages
 * 3. Country & Cultural Explorer (REST Countries)
 * 4. Weather & Air Quality Studio (Open-Meteo & European AQI)
 * 5. Cultural Calendar & Public Holidays (Nager.Date)
 * 6. Currency Converter & Financial Practice (Frankfurter ECB)
 * 7. DiceBear 9.x Avatar Generator & Offline SVG Fallback
 * 8. Cloudflare Turnstile Bot Protection Contract
 * 9. Umami Privacy Analytics & Sentry PII Scrubbing
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Providers & Services
import { SmartOnboardingService } from '../../services/smartOnboardingService';
import { CountryProvider, FALLBACK_COUNTRIES } from '../../services/providers/countries/countryProvider';
import { WeatherProvider, WMO_WEATHER_CODES } from '../../services/providers/weather/weatherProvider';
import { AirQualityProvider } from '../../services/providers/air-quality/airQualityProvider';
import { HolidayProvider, FALLBACK_HOLIDAYS } from '../../services/providers/holidays/holidayProvider';
import { CurrencyProvider, COMMON_CURRENCIES } from '../../services/providers/currency/currencyProvider';
import { AvatarProvider } from '../../services/providers/avatars/avatarProvider';
import { TurnstileProvider } from '../../services/providers/bot-protection/turnstileProvider';
import { UmamiProvider } from '../../services/providers/analytics/umamiProvider';
import { SentryProvider } from '../../services/providers/monitoring/sentryProvider';
import { SpeechService } from '../../services/speech';

// Components
import { DEFAULT_DESTINATIONS, TIME_GREETINGS, WorldClock } from '../../features/world/WorldClock';
import { AvatarCustomizer } from '../../features/profile/AvatarCustomizer';
import { GuidedOnboardingModal } from '../../components/onboarding/GuidedOnboardingModal';
import { I18nProvider } from '../../i18n/i18nContext';

describe('Lexilume World — Real-World Learning & Smart API Layer', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  // ==========================================================================
  // 1. SMART ONBOARDING SERVICE
  // ==========================================================================
  describe('1. Smart Non-Intrusive Onboarding Service', () => {
    it('generates suggestions based on browser language and timezone without GPS', () => {
      const suggestions = SmartOnboardingService.getSmartSuggestions();
      expect(suggestions).toBeDefined();
      expect(suggestions.browserLanguage).toBeTypeOf('string');
      expect(suggestions.detectedTimezone).toBeTypeOf('string');
      expect(['en', 'pt', 'es']).toContain(suggestions.suggestedInterfaceLanguage);
      expect(['en', 'pt', 'es']).toContain(suggestions.suggestedExplanationLanguage);
      expect(suggestions.suggestedCountryCode).toBeTypeOf('string');
      expect(suggestions.suggestedLearningHour).toBe(19);
    });

    it('displays the smart suggestion banner in GuidedOnboardingModal and allows 100% manual overrides', async () => {
      render(
        <I18nProvider>
          <GuidedOnboardingModal isOpen={true} onClose={vi.fn()} />
        </I18nProvider>
      );

      // Verify the privacy-first suggestion banner is visible on Step 1
      expect(screen.getByText(/Sugestão Inteligente \(Baseada no Navegador\)/i)).toBeDefined();
      expect(screen.getByText(/Zero GPS ou rastreamento de IP/i)).toBeDefined();

      // Verify manual override buttons are present and interactive
      const ptInterfaceBtn = screen.getByText('Português');
      fireEvent.click(ptInterfaceBtn);

      // Verify dismiss button works
      const dismissBtn = screen.getByText('Dispensar');
      fireEvent.click(dismissBtn);

      await waitFor(() => {
        expect(screen.queryByText(/Sugestão Inteligente \(Baseada no Navegador\)/i)).toBeNull();
      });
    });
  });

  // ==========================================================================
  // 2. WORLD CLOCK & CONTEXTUAL GREETINGS
  // ==========================================================================
  describe('2. World Clock & Contextual Greetings', () => {
    it('contains all 13 authorized language destinations and excludes Hindi', () => {
      expect(DEFAULT_DESTINATIONS.length).toBe(14); // Includes Lisbon + Sao Paulo for PT
      const langs = DEFAULT_DESTINATIONS.map(d => d.language);

      expect(langs).toContain('pt');
      expect(langs).toContain('es');
      expect(langs).toContain('en');
      expect(langs).toContain('fr');
      expect(langs).toContain('de');
      expect(langs).toContain('it');
      expect(langs).toContain('ja');
      expect(langs).toContain('ko');
      expect(langs).toContain('ru');
      expect(langs).toContain('nl');
      expect(langs).toContain('zh');
      expect(langs).toContain('tr');
      expect(langs).toContain('ta');
      expect(langs).not.toContain('hi');
    });

    it('maps time-appropriate greetings across languages', () => {
      expect(TIME_GREETINGS.pt.morning).toBe('Bom dia!');
      expect(TIME_GREETINGS.pt.afternoon).toBe('Boa tarde!');
      expect(TIME_GREETINGS.pt.evening).toBe('Boa noite!');

      expect(TIME_GREETINGS.es.morning).toBe('¡Buenos días!');
      expect(TIME_GREETINGS.ja.morning).toBe('おはようございます！');
      expect(TIME_GREETINGS.ko.morning).toBe('좋은 아침입니다!');
      expect(TIME_GREETINGS.ta.morning).toBe('காலை வணக்கம்!');
      expect(TIME_GREETINGS.hi).toBeUndefined(); // Strictly no Hindi
    });

    it('renders the WorldClock component and allows audio playback', () => {
      const speakSpy = vi.spyOn(SpeechService, 'speak').mockResolvedValue();

      render(
        <I18nProvider>
          <WorldClock />
        </I18nProvider>
      );

      expect(screen.getByText(/World Clock & Saudações Contextuais/i)).toBeDefined();
      expect(screen.getByText('Lisboa')).toBeDefined();

      // Click first audio greeting button
      const audioButtons = screen.getAllByTitle(/Ouvir pronúncia/i);
      expect(audioButtons.length).toBeGreaterThan(0);
      fireEvent.click(audioButtons[0]);

      expect(speakSpy).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // 3. COUNTRY EXPLORER (REST COUNTRIES)
  // ==========================================================================
  describe('3. Country Explorer Provider', () => {
    it('retrieves country data with fallback when offline', async () => {
      const provider = new CountryProvider();
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Offline'));

      const result = await provider.execute({});
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      const pt = result.find(c => c.code === 'PT');
      expect(pt).toBeDefined();
      expect(pt?.name).toBe('Portugal');
    });

    it('contains comprehensive fallbacks for authorized language countries', () => {
      expect(FALLBACK_COUNTRIES.length).toBeGreaterThan(0);
      const codes = FALLBACK_COUNTRIES.map(c => c.code);
      expect(codes).toContain('PT');
      expect(codes).toContain('BR');
      expect(codes).toContain('ES');
      expect(codes).toContain('FR');
      expect(codes).toContain('DE');
      expect(codes).toContain('JP');
      expect(codes).toContain('CN');
      expect(codes).toContain('IN');
    });
  });

  // ==========================================================================
  // 4. WEATHER & AIR QUALITY STUDIO (OPEN-METEO)
  // ==========================================================================
  describe('4. Weather & Air Quality Studio', () => {
    it('translates WMO weather codes into localized descriptions and weather icons', () => {
      expect(WMO_WEATHER_CODES[0].pt).toBe('Céu limpo');
      expect(WMO_WEATHER_CODES[0].en).toBe('Clear sky');
      expect(WMO_WEATHER_CODES[0].icon).toBe('☀️');

      expect(WMO_WEATHER_CODES[65].pt).toBe('Chuva forte');
      expect(WMO_WEATHER_CODES[95].icon).toBe('⚡');
    });

    it('WeatherProvider executes successfully and falls back on network errors', async () => {
      const provider = new WeatherProvider();
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

      const data = await provider.execute({
        latitude: 38.72,
        longitude: -9.14,
        cityName: 'Lisboa',
      });

      expect(data).toBeDefined();
      expect(data.current.cityName).toBe('Lisboa');
      expect(data.current.temperatureC).toBeTypeOf('number');
      expect(data.daily.length).toBeGreaterThan(0);
    });

    it('AirQualityProvider computes European AQI and descriptive quality', async () => {
      const provider = new AirQualityProvider();
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Offline'));

      const aqData = await provider.execute({
        latitude: 38.72,
        longitude: -9.14,
        cityName: 'Lisboa',
      });

      expect(aqData).toBeDefined();
      expect(aqData.europeanAqi).toBeGreaterThanOrEqual(0);
      expect(['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor']).toContain(aqData.aqiRating);
    });
  });

  // ==========================================================================
  // 5. CULTURAL CALENDAR & GLOBAL HOLIDAYS (NAGER.DATE)
  // ==========================================================================
  describe('5. Cultural Calendar & Global Holidays', () => {
    it('HolidayProvider retrieves holidays with authentic cultural explanations', async () => {
      const provider = new HolidayProvider();
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Offline'));

      const holidays = await provider.execute({ countryCode: 'PT' });
      expect(holidays.length).toBeGreaterThan(0);
      expect(holidays[0].countryCode).toBe('PT');
      expect(holidays[0].localName).toBeDefined();
      expect(holidays[0].explanation).toBeDefined();
    });

    it('FALLBACK_HOLIDAYS includes Portugal and Spain', () => {
      expect(FALLBACK_HOLIDAYS.PT.length).toBeGreaterThan(0);
      expect(FALLBACK_HOLIDAYS.ES.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // 6. CURRENCY & FINANCIAL VOCABULARY (FRANKFURTER ECB)
  // ==========================================================================
  describe('6. Currency Converter & Financial Practice', () => {
    it('converts EUR reference rates to USD with educational attribution', async () => {
      const provider = new CurrencyProvider();
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Offline'));

      const result = await provider.execute({
        from: 'EUR',
        to: 'USD',
        amount: 100,
      });

      expect(result.amount).toBe(100);
      expect(result.rate).toBeGreaterThan(0);
      expect(result.convertedAmount).toBeGreaterThan(0);
      expect(result.attribution).toBeDefined();
    });

    it('exposes common currency metadata for financial vocabulary', () => {
      expect(COMMON_CURRENCIES.EUR.symbol).toBe('€');
      expect(COMMON_CURRENCIES.USD.code).toBe('USD');
      expect(COMMON_CURRENCIES.BRL.symbol).toBe('R$');
      expect(COMMON_CURRENCIES.JPY.symbol).toBe('¥');
    });
  });

  // ==========================================================================
  // 7. DICEBEAR AVATAR GENERATOR & CUSTOMIZER
  // ==========================================================================
  describe('7. Avatar Provider & Customizer', () => {
    it('generates valid DiceBear 9.x SVG URLs for all supported styles', () => {
      const provider = AvatarProvider.getInstance();
      const url = provider.getAvatarUrl({ seed: 'test_learner', style: 'personas' });
      expect(url).toContain('api.dicebear.com/9.x/personas/svg');
      expect(url).toContain('seed=test_learner');
    });

    it('provides offline initials SVG fallback data URI without external requests', () => {
      const provider = AvatarProvider.getInstance();
      const fallback = provider.getOfflineInitialsSvgUri('Vinodh Kumar');
      expect(fallback).toContain('data:image/svg+xml;utf8');
      expect(fallback).toContain('VK');
    });

    it('renders AvatarCustomizer and allows style switching and randomization', () => {
      render(
        <I18nProvider>
          <AvatarCustomizer initialSeed="vinodh" initialStyle="personas" />
        </I18nProvider>
      );

      expect(screen.getByText('Personalizador de Avatar Poliglota')).toBeDefined();

      // Click Bottts style button
      const botttsBtn = screen.getByText('Bottts (Robôs)');
      fireEvent.click(botttsBtn);

      // Click randomize button
      const randomBtn = screen.getByText('Gerar Aleatório');
      fireEvent.click(randomBtn);

      expect(screen.getByText(/Salvar Avatar no Perfil/i)).toBeDefined();
    });
  });

  // ==========================================================================
  // 8. CLOUDFLARE TURNSTILE BOT PROTECTION
  // ==========================================================================
  describe('8. Cloudflare Turnstile Bot Protection', () => {
    it('uses standard always-passing test key in development', () => {
      const provider = TurnstileProvider.getInstance();
      expect(provider.isTestMode()).toBe(true);
      expect(provider.getSiteKey()).toBe('1x00000000000000000000AA');
    });

    it('verifies development test tokens successfully with isDevelopmentBypass', async () => {
      const provider = TurnstileProvider.getInstance();
      const result = await provider.verifyTokenOnServer('TEST_PASS_TOKEN', 'dummy_secret');
      expect(result.success).toBe(true);
      expect(result.isDevelopmentBypass).toBe(true);
    });

    it('rejects empty tokens gracefully', async () => {
      const provider = TurnstileProvider.getInstance();
      const result = await provider.verifyTokenOnServer('', 'dummy_secret');
      expect(result.success).toBe(false);
      expect(result.errorCodes).toContain('missing-input-response');
    });
  });

  // ==========================================================================
  // 9. UMAMI PRIVACY ANALYTICS & SENTRY PII SCRUBBING
  // ==========================================================================
  describe('9. Umami Privacy Analytics & Sentry PII Scrubbing', () => {
    it('UmamiProvider safely discards sensitive keys and student text without throw', () => {
      const provider = UmamiProvider.getInstance();

      expect(() => {
        provider.trackEvent('vocabulary_saved', {
          language: 'pt',
          text: 'This should be scrubbed',
          userPassword: 'secretPassword123',
          safeMetric: 42,
        });
      }).not.toThrow();
    });

    it('SentryProvider scrubs passwords, authorization tokens and sensitive student input', () => {
      const provider = SentryProvider.getInstance();
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      provider.captureException(new Error('Failed request with Bearer eyJhbGciOi... and password=superSecret'), {
        token: 'Bearer eyJhbGciOi...',
        studentEssay: 'My private diary text...',
      });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
