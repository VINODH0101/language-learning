/**
 * Multilingual String Utilities & Pedagogical Text Normalization
 * 
 * Supports locale-aware casing (including Turkish dotted/dotless I).
 */

import { Language } from '../../types';

/**
 * Normalizes text for exercise comparisons and search queries.
 * Handles language-specific casing rules (e.g. Turkish dotted 'İ' / dotless 'ı').
 */
export function normalizeText(text: string, lang?: Language | string): string {
  if (!text) return '';
  const trimmed = text.trim();

  // Turkish specific casing
  if (lang === 'tr') {
    return trimmed
      .toLocaleLowerCase('tr-TR')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  return trimmed
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Strict equality comparison ignoring accents and case.
 */
export function areStringsEquivalent(a: string, b: string, lang?: Language | string): boolean {
  return normalizeText(a, lang) === normalizeText(b, lang);
}

/**
 * Capitalizes the first letter of a string.
 */
export function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}
