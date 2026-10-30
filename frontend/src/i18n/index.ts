/**
 * Lexilume — Centralized Internationalization (i18n) Architecture
 * 
 * Invariants:
 * 1. Interface Language, Learning Language, and Explanation Language remain strictly decoupled.
 * 2. All 13 languages supported with zero external paid APIs.
 * 3. Fallback to English ('en') guarantees zero raw missing translation keys.
 * 4. Local-first: 100% of translation resources bundled offline.
 */

import i18n, { NAMESPACES, resources } from './config';
export { useTranslation, Trans } from 'react-i18next';
export { LanguageDetector, STORAGE_KEYS } from './languageDetector';
export { NAMESPACES, resources };

export default i18n;
