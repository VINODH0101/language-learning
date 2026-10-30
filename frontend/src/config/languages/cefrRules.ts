/**
 * Lexilume — CEFR Content Validation Rules & Metrics
 * 
 * Mandates:
 * 1. Support CEFR levels A1, A2, B1, B2, C1.
 * 2. Do not assign CEFR labels to content without evidence or an explicit editorial decision.
 * 3. Script-appropriate metrics (words for space-delimited scripts, characters for CJK).
 */

import { CEFRLevel, CEFRContentValidationRule, CEFRValidationResult, SupportedLanguage } from './types';

export const STANDARD_CEFR_LEVELS: readonly CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;

export const DEFAULT_CEFR_WORD_RULES: Record<CEFRLevel, CEFRContentValidationRule> = {
  A1: {
    minWords: 30,
    maxWords: 120,
    maxSentenceWords: 14,
    minCharactersCJK: 40,
    maxCharactersCJK: 160,
  },
  A2: {
    minWords: 70,
    maxWords: 220,
    maxSentenceWords: 18,
    minCharactersCJK: 100,
    maxCharactersCJK: 300,
  },
  B1: {
    minWords: 150,
    maxWords: 400,
    maxSentenceWords: 25,
    minCharactersCJK: 220,
    maxCharactersCJK: 550,
  },
  B2: {
    minWords: 300,
    maxWords: 650,
    maxSentenceWords: 32,
    minCharactersCJK: 450,
    maxCharactersCJK: 900,
  },
  C1: {
    minWords: 450,
    maxWords: 950,
    maxSentenceWords: 42,
    minCharactersCJK: 700,
    maxCharactersCJK: 1500,
  },
};

/**
 * Validates a piece of pedagogical content against CEFR level expectations for a given language.
 * Enforces editorial verification provenance.
 */
export function validateContentForCEFR(
  content: string,
  level: CEFRLevel,
  language: SupportedLanguage,
  isEditoriallyVerified: boolean = false
): CEFRValidationResult {
  const issues: string[] = [];
  const rules = DEFAULT_CEFR_WORD_RULES[level];

  // 1. Editorial Provenance Guard
  if (!isEditoriallyVerified) {
    issues.push(
      `Unverified editorial provenance: CEFR level '${level}' cannot be assigned without validated pedagogical review or documented source attribution.`
    );
  }

  const isCJK = language === 'zh' || language === 'ja';
  let metricCount = 0;
  let minAllowed = 0;
  let maxAllowed = 0;

  if (isCJK) {
    // Character count for CJK (excluding ASCII whitespace and punctuation)
    const cjkChars = content.replace(/[\s\p{P}]/gu, '');
    metricCount = cjkChars.length;
    minAllowed = rules.minCharactersCJK || 50;
    maxAllowed = rules.maxCharactersCJK || 500;
  } else {
    // Word count for space-delimited scripts
    const words = content.trim().split(/\s+/).filter(w => w.length > 0);
    metricCount = words.length;
    minAllowed = rules.minWords;
    maxAllowed = rules.maxWords;
  }

  // 2. Length boundary check
  if (metricCount < minAllowed) {
    issues.push(
      `Content too short for CEFR ${level}: found ${metricCount} ${isCJK ? 'characters' : 'words'}, minimum required is ${minAllowed}.`
    );
  } else if (metricCount > maxAllowed) {
    issues.push(
      `Content exceeds complexity threshold for CEFR ${level}: found ${metricCount} ${isCJK ? 'characters' : 'words'}, maximum allowed is ${maxAllowed}.`
    );
  }

  return {
    isValid: issues.length === 0,
    issues,
    actualMetric: metricCount,
    allowedRange: [minAllowed, maxAllowed],
    isEditoriallyVerified,
  };
}
