/**
 * Lexilume — Language-Specific Text Processing & Script Utilities
 * 
 * Capability-based script handling:
 * - Japanese: Kanji/Hiragana/Katakana segmentation & script breakdown
 * - Korean: Hangul syllable decomposition & composition (Choseong, Jungseong, Jongseong)
 * - Chinese: Hanzi character detection & Pinyin normalization
 * - Russian: Cyrillic script detection & stress-mark handling
 * - Tamil: Unicode Tamil script & complex grapheme cluster boundary handling
 * - Portuguese: Regional dialect feature detection (pt-BR vs pt-PT)
 * - Universal: Intl.Segmenter word boundary tokenization with character fallbacks
 */

import { SupportedLanguage } from '../../config/languages/types';

// ============================================================================
// 1. UNIVERSAL TOKENIZATION (SPACE-DELIMITED & NON-SPACED CJK)
// ============================================================================

/**
 * Tokenizes text into word-like units, respecting non-spaced scripts (Chinese, Japanese)
 * via Intl.Segmenter with fallback.
 */
export function tokenizeText(text: string, lang: SupportedLanguage): string[] {
  if (!text || text.trim().length === 0) return [];

  // Use modern Intl.Segmenter if supported (Chrome 87+, Safari 14.1+, Node 16+)
  if (typeof Intl !== 'undefined' && typeof (Intl as any).Segmenter === 'function') {
    try {
      const segmenter = new (Intl as any).Segmenter(lang, { granularity: 'word' });
      const segments = segmenter.segment(text);
      const tokens: string[] = [];
      for (const seg of segments) {
        if (seg.isWordLike) {
          tokens.push(seg.segment);
        }
      }
      if (tokens.length > 0) return tokens;
    } catch {}
  }

  // Fallback: For non-spaced scripts without Intl.Segmenter, split into individual characters
  if (lang === 'zh' || lang === 'ja') {
    return Array.from(text).filter(c => !/[\s\p{P}]/u.test(c));
  }

  // Space-delimited languages: split on whitespace and trim punctuation
  return text
    .split(/\s+/)
    .map(w => w.replace(/^[\p{P}\s]+|[\p{P}\s]+$/gu, ''))
    .filter(w => w.length > 0);
}

// ============================================================================
// 2. JAPANESE SCRIPT UTILITIES
// ============================================================================

export function isKanji(char: string): boolean {
  if (!char) return false;
  const code = char.codePointAt(0) || 0;
  // CJK Unified Ideographs block
  return (code >= 0x4e00 && code <= 0x9faf) || (code >= 0x3400 && code <= 0x4dbf);
}

export function isHiragana(char: string): boolean {
  if (!char) return false;
  const code = char.codePointAt(0) || 0;
  return code >= 0x3040 && code <= 0x309f;
}

export function isKatakana(char: string): boolean {
  if (!char) return false;
  const code = char.codePointAt(0) || 0;
  return code >= 0x30a0 && code <= 0x30ff;
}

export function isJapanese(text: string): boolean {
  if (!text) return false;
  for (const ch of text) {
    if (isKanji(ch) || isHiragana(ch) || isKatakana(ch)) {
      return true;
    }
  }
  return false;
}

export function getJapaneseScriptBreakdown(text: string): {
  kanjiCount: number;
  hiraganaCount: number;
  katakanaCount: number;
  totalJapaneseChars: number;
} {
  let kanjiCount = 0;
  let hiraganaCount = 0;
  let katakanaCount = 0;

  for (const ch of text) {
    if (isKanji(ch)) kanjiCount++;
    else if (isHiragana(ch)) hiraganaCount++;
    else if (isKatakana(ch)) katakanaCount++;
  }

  return {
    kanjiCount,
    hiraganaCount,
    katakanaCount,
    totalJapaneseChars: kanjiCount + hiraganaCount + katakanaCount,
  };
}

// ============================================================================
// 3. KOREAN HANGUL SYLLABLE UTILITIES
// ============================================================================

const HANGUL_BASE = 0xac00;
const HANGUL_END = 0xd7a3;

const CHOSEONG = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

const JUNGSEONG = [
  'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ',
  'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'
];

const JONGSEONG = [
  '', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ',
  'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

export function isHangul(char: string): boolean {
  if (!char) return false;
  const code = char.charCodeAt(0);
  return code >= HANGUL_BASE && code <= HANGUL_END;
}

export function decomposeHangul(syllable: string): {
  initial: string;
  medial: string;
  final?: string;
} | null {
  if (!syllable || !isHangul(syllable)) return null;
  const code = syllable.charCodeAt(0) - HANGUL_BASE;
  const jongIdx = code % 28;
  const jungIdx = Math.floor((code - jongIdx) / 28) % 21;
  const choIdx = Math.floor(Math.floor((code - jongIdx) / 28) / 21);

  return {
    initial: CHOSEONG[choIdx],
    medial: JUNGSEONG[jungIdx],
    final: JONGSEONG[jongIdx] || undefined,
  };
}

export function composeHangul(initial: string, medial: string, final?: string): string {
  const choIdx = CHOSEONG.indexOf(initial);
  const jungIdx = JUNGSEONG.indexOf(medial);
  const jongIdx = final ? JONGSEONG.indexOf(final) : 0;

  if (choIdx === -1 || jungIdx === -1 || jongIdx === -1) {
    return '';
  }

  const code = HANGUL_BASE + (choIdx * 21 + jungIdx) * 28 + jongIdx;
  return String.fromCharCode(code);
}

// ============================================================================
// 4. CHINESE (HANZI & PINYIN) UTILITIES
// ============================================================================

export function isHanzi(char: string): boolean {
  if (!char) return false;
  const code = char.codePointAt(0) || 0;
  return (code >= 0x4e00 && code <= 0x9fff) || (code >= 0x3400 && code <= 0x4dbf);
}

const PINYIN_TONE_MARKS: Record<string, string> = {
  ā: 'a1', á: 'a2', ǎ: 'a3', à: 'a4',
  ē: 'e1', é: 'e2', ě: 'e3', è: 'e4',
  ī: 'i1', í: 'i2', ǐ: 'i3', ì: 'i4',
  ō: 'o1', ó: 'o2', ǒ: 'o3', ò: 'o4',
  ū: 'u1', ú: 'u2', ǔ: 'u3', ù: 'u4',
  ǖ: 'v1', ǘ: 'v2', ǚ: 'v3', ǜ: 'v4', ü: 'v',
};

const TONE_STRIP_MAP: Record<string, string> = {
  ā: 'a', á: 'a', ǎ: 'a', à: 'a',
  ē: 'e', é: 'e', ě: 'e', è: 'e',
  ī: 'i', í: 'i', ǐ: 'i', ì: 'i',
  ō: 'o', ó: 'o', ǒ: 'o', ò: 'o',
  ū: 'u', ú: 'u', ǔ: 'u', ù: 'u',
  ǖ: 'u', ǘ: 'u', ǚ: 'u', ǜ: 'u', ü: 'u',
};

export function hasPinyinTone(str: string): boolean {
  return /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/i.test(str);
}

export function stripPinyinTones(str: string): string {
  return str.replace(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]/gi, match => TONE_STRIP_MAP[match] || match);
}

// ============================================================================
// 5. RUSSIAN CYRILLIC UTILITIES
// ============================================================================

export function isCyrillic(char: string): boolean {
  if (!char) return false;
  const code = char.charCodeAt(0);
  return (code >= 0x0400 && code <= 0x04ff) || (code >= 0x0500 && code <= 0x052f);
}

/**
 * Strips combining acute accent (stress mark \u0301) commonly found in Russian pedagogical dictionaries.
 */
export function stripCyrillicStress(text: string): string {
  return text.replace(/\u0301/g, '');
}

// ============================================================================
// 6. TAMIL UNICODE SCRIPT UTILITIES
// ============================================================================

export function isTamil(char: string): boolean {
  if (!char) return false;
  const code = char.charCodeAt(0);
  return code >= 0x0b80 && code <= 0x0bff;
}

/**
 * Returns grapheme clusters for Tamil, keeping combined consonants, pulli (\u0BCD),
 * and dependent vowel signs (\u0BBE through \u0BCC) bound to their base consonant.
 */
export function getTamilGraphemeClusters(text: string): string[] {
  if (!text) return [];

  // Use Intl.Segmenter granularity: 'grapheme' if available
  if (typeof Intl !== 'undefined' && typeof (Intl as any).Segmenter === 'function') {
    try {
      const segmenter = new (Intl as any).Segmenter('ta', { granularity: 'grapheme' });
      const clusters: string[] = [];
      for (const seg of segmenter.segment(text)) {
        clusters.push(seg.segment);
      }
      return clusters;
    } catch {}
  }

  // Regex fallback: Tamil base consonant or vowel followed by combining vowel marks / virama
  const tamilGraphemeRegex = /[\u0B80-\u0BFF][\u0BBE-\u0BCD\u0BD7]*/g;
  const matches = text.match(tamilGraphemeRegex);
  return matches || Array.from(text);
}

// ============================================================================
// 7. PORTUGUESE REGIONAL DIALECT MARKERS
// ============================================================================

/**
 * Analyzes text for characteristic Brazilian vs European Portuguese markers.
 */
export function detectPortugueseDialectFeatures(text: string): 'pt-BR' | 'pt-PT' | 'neutral' {
  if (!text) return 'neutral';
  const lower = text.toLowerCase();

  let ptBrScore = 0;
  let ptPtScore = 0;

  // pt-PT continuous: "a + infinitivo" (e.g. "a fazer", "a comer", "a ler")
  if (/\ba\s+[a-z]+(?:ar|er|ir)\b/.test(lower)) ptPtScore += 2;
  // pt-BR continuous: gerund (e.g. "fazendo", "comendo", "lendo")
  if (/\b(?:estou|está|estamos|estão)\s+[a-z]+(?:ando|endo|indo)\b/.test(lower)) ptBrScore += 2;

  // Orthographic markers (pre/post-Ao90 or regional preference)
  if (/\bfacto\b/.test(lower)) ptPtScore += 3;
  if (/\bfato\b/.test(lower)) ptBrScore += 2;
  if (/\bequipa\b/.test(lower)) ptPtScore += 3;
  if (/\bequipe\b/.test(lower)) ptBrScore += 3;
  if (/\bautocarro\b/.test(lower)) ptPtScore += 3;
  if (/\bônibus\b/.test(lower)) ptBrScore += 3;
  if (/\bcaderno de notas\b/.test(lower)) ptPtScore += 2;

  if (ptBrScore > ptPtScore) return 'pt-BR';
  if (ptPtScore > ptBrScore) return 'pt-PT';
  return 'neutral';
}
