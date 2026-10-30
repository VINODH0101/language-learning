/**
 * Lexilume — Multilingual Language Configuration & Capabilities Test Suite
 * 
 * Verifies:
 * 1. Complete registration of all 13 supported languages.
 * 2. Strict rejection of forbidden languages (Hindi 'hi').
 * 3. Script-specific capabilities (Japanese, Korean, Chinese, Russian, Tamil, Portuguese).
 * 4. Locale-aware formatting and universal tokenization.
 * 5. CEFR content validation and editorial provenance enforcement.
 * 6. Four-way linguistic decoupling invariants and i18next integration.
 */

import { describe, it, expect } from 'vitest';
import {
  LANGUAGE_REGISTRY,
  getAllSupportedLanguages,
  getLanguageConfig,
  isLanguageSupported,
  isForbiddenLanguage,
  getDefaultVariant,
  getRegionalVariants,
  isValidRegionalVariant,
  enforceRegionalVariant,
} from '../config/languages/languageRegistry';
import {
  hasTTS,
  hasSTT,
  hasGrammarChecker,
  hasReadingResources,
  hasWritingPractice,
  getLanguageVoiceLocale,
  isCJK,
} from '../config/languages/capabilities';
import {
  tokenizeText,
  isKanji,
  isHiragana,
  isKatakana,
  isJapanese,
  getJapaneseScriptBreakdown,
  isHangul,
  decomposeHangul,
  composeHangul,
  isHanzi,
  hasPinyinTone,
  stripPinyinTones,
  isCyrillic,
  stripCyrillicStress,
  isTamil,
  getTamilGraphemeClusters,
  detectPortugueseDialectFeatures,
} from '../shared/utils/textProcessing';
import {
  formatLocalizedDate,
  formatLocalizedNumber,
  formatLocalizedPercent,
  getLocaleForLanguage,
} from '../shared/utils/localeFormatting';
import { validateContentForCEFR } from '../config/languages/cefrRules';
import { SupportedLanguage } from '../config/languages/types';
import i18n from '../i18n/i18next';

describe('Lexilume Multilingual Language Registry & Configuration', () => {
  const ALL_13_LANGUAGES: SupportedLanguage[] = [
    'en', 'pt', 'es', 'fr', 'de', 'it',
    'ja', 'ko', 'ru', 'nl', 'zh', 'tr', 'ta',
  ];

  // 1. Registry Completeness
  it('1. contains complete configurations for all 13 supported languages', () => {
    const registered = getAllSupportedLanguages();
    expect(registered.length).toBe(13);

    for (const code of ALL_13_LANGUAGES) {
      expect(isLanguageSupported(code)).toBe(true);
      const config = getLanguageConfig(code);
      expect(config.id).toBe(code);
      expect(config.displayName).toBeDefined();
      expect(config.nativeName).toBeDefined();
      expect(config.defaultLocale).toBeDefined();
      expect(config.script).toBeDefined();
      expect(config.flag).toBeDefined();
      expect(config.cefrAvailability).toContain('A1');
      expect(config.cefrAvailability).toContain('C1');
      expect(config.regionalVariants.length).toBeGreaterThanOrEqual(1);
      expect(config.regionalVariants.some(v => v.isDefault)).toBe(true);
    }
  });

  // 2. Strict Prohibition of Hindi
  it('2. strictly excludes and rejects Hindi (hi, hin, hindi)', () => {
    expect(isForbiddenLanguage('hi')).toBe(true);
    expect(isForbiddenLanguage('hin')).toBe(true);
    expect(isForbiddenLanguage('HINDI')).toBe(true);
    expect(isForbiddenLanguage('hi-IN')).toBe(true);

    expect(isLanguageSupported('hi')).toBe(false);
    expect(isLanguageSupported('hin')).toBe(false);
    expect(isLanguageSupported('hindi')).toBe(false);

    expect(() => getLanguageConfig('hi' as any)).toThrowError(/explicitly excluded/);
    expect((LANGUAGE_REGISTRY as Record<string, unknown>)['hi']).toBeUndefined();
  });

  // 3. Regional Variant Resolution
  it('3. resolves and normalizes regional variants per language', () => {
    // Portuguese: pt-BR and pt-PT
    expect(getDefaultVariant('pt')).toBe('pt-BR');
    expect(isValidRegionalVariant('pt', 'pt-PT')).toBe(true);
    expect(isValidRegionalVariant('pt', 'pt-BR')).toBe(true);
    expect(isValidRegionalVariant('pt', 'es-ES')).toBe(false);
    expect(enforceRegionalVariant('pt', 'invalid')).toBe('pt-BR');

    // Spanish: es-ES, es-MX, es-419, es-AR
    expect(getDefaultVariant('es')).toBe('es-ES');
    expect(isValidRegionalVariant('es', 'es-MX')).toBe(true);
    expect(isValidRegionalVariant('es', 'pt-PT')).toBe(false);

    // Chinese: zh-Hans, zh-CN
    expect(getDefaultVariant('zh')).toBe('zh-Hans');
    expect(isValidRegionalVariant('zh', 'zh-Hans')).toBe(true);

    // Tamil: ta-IN, ta-LK
    expect(getDefaultVariant('ta')).toBe('ta-IN');
    expect(isValidRegionalVariant('ta', 'ta-LK')).toBe(true);
  });

  // 4. Capability Detection
  it('4. detects capabilities accurately across all supported languages', () => {
    for (const code of ALL_13_LANGUAGES) {
      expect(hasTTS(code)).toBe(true);
      expect(hasSTT(code)).toBe(true);
      expect(hasReadingResources(code)).toBe(true);
      expect(hasWritingPractice(code)).toBe(true);
      expect(getLanguageVoiceLocale(code)).toBeDefined();
    }

    // Specific feature checks
    expect(hasGrammarChecker('pt')).toBe(true);
    expect(hasGrammarChecker('en')).toBe(true);
    expect(hasGrammarChecker('de')).toBe(true);
    expect(hasGrammarChecker('fr')).toBe(true);
    expect(hasGrammarChecker('ru')).toBe(true);

    expect(isCJK('zh')).toBe(true);
    expect(isCJK('ja')).toBe(true);
    expect(isCJK('en')).toBe(false);
    expect(isCJK('pt')).toBe(false);

    const configJa = getLanguageConfig('ja');
    expect(configJa.writingPracticeAvailability.supportsKanaKanji).toBe(true);

    const configKo = getLanguageConfig('ko');
    expect(configKo.writingPracticeAvailability.supportsHangul).toBe(true);

    const configZh = getLanguageConfig('zh');
    expect(configZh.writingPracticeAvailability.supportsPinyin).toBe(true);

    const configTa = getLanguageConfig('ta');
    expect(configTa.writingPracticeAvailability.supportsLigatures).toBe(true);
  });

  // 5. Japanese Script Processing
  it('5. processes Japanese Kanji, Hiragana, and Katakana scripts correctly', () => {
    expect(isKanji('日')).toBe(true);
    expect(isKanji('本')).toBe(true);
    expect(isKanji('あ')).toBe(false);

    expect(isHiragana('あ')).toBe(true);
    expect(isHiragana('り')).toBe(true);
    expect(isHiragana('ア')).toBe(false);

    expect(isKatakana('ア')).toBe(true);
    expect(isKatakana('メ')).toBe(true);
    expect(isKatakana('漢')).toBe(false);

    expect(isJapanese('日本語を勉強しています')).toBe(true);
    expect(isJapanese('English text')).toBe(false);

    const breakdown = getJapaneseScriptBreakdown('日本語をベンキョウ');
    expect(breakdown.kanjiCount).toBe(3); // 日本語
    expect(breakdown.hiraganaCount).toBe(1); // を
    expect(breakdown.katakanaCount).toBe(5); // ベンキョウ
    expect(breakdown.totalJapaneseChars).toBe(9);
  });

  // 6. Korean Hangul Processing & Syllable Decomposition
  it('6. decomposes and composes Korean Hangul syllable blocks', () => {
    expect(isHangul('한')).toBe(true);
    expect(isHangul('글')).toBe(true);
    expect(isHangul('A')).toBe(false);

    // 한 = ㅎ (initial) + ㅏ (medial) + ㄴ (final)
    const decomp = decomposeHangul('한');
    expect(decomp).not.toBeNull();
    expect(decomp?.initial).toBe('ㅎ');
    expect(decomp?.medial).toBe('ㅏ');
    expect(decomp?.final).toBe('ㄴ');

    // Recompose back
    const recomposed = composeHangul('ㅎ', 'ㅏ', 'ㄴ');
    expect(recomposed).toBe('한');

    // 글 = ㄱ + ㅡ + ㄹ
    const decompGeul = decomposeHangul('글');
    expect(decompGeul?.initial).toBe('ㄱ');
    expect(decompGeul?.medial).toBe('ㅡ');
    expect(decompGeul?.final).toBe('ㄹ');
    expect(composeHangul('ㄱ', 'ㅡ', 'ㄹ')).toBe('글');
  });

  // 7. Chinese Hanzi & Pinyin Normalization
  it('7. processes Chinese Hanzi characters and normalizes Pinyin tone marks', () => {
    expect(isHanzi('中')).toBe(true);
    expect(isHanzi('文')).toBe(true);
    expect(isHanzi('Z')).toBe(false);

    expect(hasPinyinTone('hǎo')).toBe(true);
    expect(hasPinyinTone('běijīng')).toBe(true);
    expect(hasPinyinTone('nihao')).toBe(false);

    expect(stripPinyinTones('hǎo')).toBe('hao');
    expect(stripPinyinTones('běijīng')).toBe('beijing');
    expect(stripPinyinTones('nǚrén')).toBe('nuren');
  });

  // 8. Russian Cyrillic & Stress Mark Stripping
  it('8. detects Cyrillic script and strips pedagogical stress marks', () => {
    expect(isCyrillic('Р')).toBe(true);
    expect(isCyrillic('я')).toBe(true);
    expect(isCyrillic('R')).toBe(false);

    // Combining acute stress mark (\u0301)
    const stressedWord = 'молоко\u0301';
    expect(stressedWord.length).toBe(7);
    const cleaned = stripCyrillicStress(stressedWord);
    expect(cleaned).toBe('молоко');
    expect(cleaned.length).toBe(6);
  });

  // 9. Tamil Unicode Grapheme Cluster Preservation
  it('9. identifies Tamil script and preserves complex vowel-marker grapheme clusters', () => {
    expect(isTamil('த')).toBe(true);
    expect(isTamil('மி')).toBe(true);
    expect(isTamil('ழ்')).toBe(true);
    expect(isTamil('T')).toBe(false);

    const clusters = getTamilGraphemeClusters('தமிழ்');
    expect(clusters.length).toBe(3); // த, மி, ழ்
    expect(clusters[0]).toBe('த');
    expect(clusters[1]).toBe('மி');
    expect(clusters[2]).toBe('ழ்');
  });

  // 10. Portuguese Regional Dialect Feature Detection
  it('10. distinguishes Brazilian vs European Portuguese grammatical markers', () => {
    // pt-PT markers: 'a + infinitivo', 'facto', 'equipa'
    const ptPtText = 'Estou a fazer um trabalho sobre o facto histórico da equipa.';
    expect(detectPortugueseDialectFeatures(ptPtText)).toBe('pt-PT');

    // pt-BR markers: gerund 'estou fazendo', 'fato', 'equipe'
    const ptBrText = 'Estou fazendo um trabalho sobre o fato histórico da equipe.';
    expect(detectPortugueseDialectFeatures(ptBrText)).toBe('pt-BR');

    // Neutral text
    const neutralText = 'O livro é interessante e aborda diversos temas.';
    expect(detectPortugueseDialectFeatures(neutralText)).toBe('neutral');
  });

  // 11. Universal Tokenization (Space-Delimited & Non-Spaced CJK)
  it('11. tokenizes text appropriately for both space-delimited and non-spaced languages', () => {
    // Space-delimited English
    const enTokens = tokenizeText('Hello, world! Welcome to Lexilume.', 'en');
    expect(enTokens).toContain('Hello');
    expect(enTokens).toContain('world');
    expect(enTokens).toContain('Welcome');

    // Space-delimited Portuguese
    const ptTokens = tokenizeText('Aprender português é maravilhoso!', 'pt');
    expect(ptTokens).toContain('Aprender');
    expect(ptTokens).toContain('português');

    // Non-spaced Chinese
    const zhTokens = tokenizeText('我学习中文', 'zh');
    expect(zhTokens.length).toBeGreaterThanOrEqual(1);

    // Non-spaced Japanese
    const jaTokens = tokenizeText('日本語を勉強します', 'ja');
    expect(jaTokens.length).toBeGreaterThanOrEqual(1);
  });

  // 12. Locale-Aware Formatting Utilities
  it('12. formats dates, numbers, and percentages using locale-specific rules', () => {
    expect(getLocaleForLanguage('pt', 'pt-BR')).toBe('pt-BR');
    expect(getLocaleForLanguage('pt', 'pt-PT')).toBe('pt-PT');
    expect(getLocaleForLanguage('ja')).toBe('ja-JP');

    const sampleDate = new Date('2026-10-30T12:00:00Z');
    const formattedEn = formatLocalizedDate(sampleDate, 'en-US');
    expect(formattedEn).toContain('2026');

    const formattedNumDe = formatLocalizedNumber(1234567.89, 'de-DE');
    // German uses period as thousands separator and comma as decimal separator
    expect(formattedNumDe).toContain('1.234.567');

    const formattedPct = formatLocalizedPercent(0.854, 'en-US');
    expect(formattedPct).toBe('85%');
  });

  // 13. CEFR Content Validation & Editorial Provenance
  it('13. enforces CEFR word count bounds and requires editorial provenance', () => {
    const textA1 = 'This is a simple text for beginners learning words.'; // 9 words

    // 1. Without editorial provenance: rejected
    const unverifiedRes = validateContentForCEFR(textA1, 'A1', 'en', false);
    expect(unverifiedRes.isValid).toBe(false);
    expect(unverifiedRes.issues.some(i => i.includes('Unverified editorial provenance'))).toBe(true);

    // 2. Too short for A1 (min 30 words)
    const tooShortRes = validateContentForCEFR(textA1, 'A1', 'en', true);
    expect(tooShortRes.isValid).toBe(false);
    expect(tooShortRes.issues.some(i => i.includes('too short'))).toBe(true);

    // 3. Valid A1 text (~40 words) with provenance
    const validA1Text = 'This is a simple English passage designed for beginner learners. It talks about daily routines, breakfast, work, and going to the library. Every student can understand the clear and gentle words in this short lesson. We read and write every day.';
    const validRes = validateContentForCEFR(validA1Text, 'A1', 'en', true);
    expect(validRes.isValid).toBe(true);
    expect(validRes.issues.length).toBe(0);

    // 4. CJK character count rules
    const shortChinese = '你好世界'; // 4 chars
    const zhRes = validateContentForCEFR(shortChinese, 'A1', 'zh', true);
    expect(zhRes.isValid).toBe(false);
    expect(zhRes.issues.some(i => i.includes('too short'))).toBe(true);
  });

  // 14. i18next Interface Localization Integration
  it('14. verifies i18next interface language resolution and resources', async () => {
    expect(i18n.isInitialized).toBe(true);
    expect(['en', 'pt', 'es']).toContain(i18n.language);

    await i18n.changeLanguage('pt');
    expect(i18n.language).toBe('pt');
    expect(i18n.t('navigation:nav_home')).toBe('Início');

    await i18n.changeLanguage('es');
    expect(i18n.language).toBe('es');
    expect(i18n.t('navigation:nav_home')).toBe('Inicio');

    await i18n.changeLanguage('en');
    expect(i18n.language).toBe('en');
    expect(i18n.t('navigation:nav_home')).toBe('Home');
  });
});
