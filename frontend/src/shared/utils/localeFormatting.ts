/**
 * Lexilume — Locale-Aware Formatting Utilities
 * 
 * Provides localized date, time, number, and percent formatting using
 * standard Intl APIs respecting the user's active locale.
 */

import { SupportedLanguage } from '../../config/languages/types';
import { getLanguageConfig, isLanguageSupported } from '../../config/languages/languageRegistry';

/**
 * Returns the best-matching BCP-47 locale string for a given language and optional variant.
 */
export function getLocaleForLanguage(lang: SupportedLanguage, variant?: string): string {
  if (!isLanguageSupported(lang)) return 'en-US';
  const config = getLanguageConfig(lang);

  if (variant) {
    const match = config.regionalVariants.find(v => v.code === variant);
    if (match) return match.locale;
  }

  return config.defaultLocale;
}

/**
 * Formats a date string or Date object using the specified locale.
 */
export function formatLocalizedDate(
  date: Date | string,
  locale: string = 'en-US',
  options?: Intl.DateTimeFormatOptions
): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return String(date);

    const defaultOptions: Intl.DateTimeFormatOptions = options || {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };

    return new Intl.DateTimeFormat(locale, defaultOptions).format(d);
  } catch (err) {
    console.warn(`Error formatting date for locale ${locale}`, err);
    return String(date);
  }
}

/**
 * Formats a number using the specified locale.
 */
export function formatLocalizedNumber(
  num: number,
  locale: string = 'en-US',
  options?: Intl.NumberFormatOptions
): string {
  try {
    return new Intl.NumberFormat(locale, options).format(num);
  } catch (err) {
    console.warn(`Error formatting number for locale ${locale}`, err);
    return String(num);
  }
}

/**
 * Formats a fractional ratio (0.0 to 1.0) or percentage as a localized percentage string.
 */
export function formatLocalizedPercent(
  ratio: number,
  locale: string = 'en-US',
  fractionDigits: number = 0
): string {
  try {
    // If passed value > 1 (e.g. 85 instead of 0.85), normalize
    const normalized = ratio > 1 ? ratio / 100 : ratio;
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(normalized);
  } catch {
    return `${Math.round(ratio * 100)}%`;
  }
}
