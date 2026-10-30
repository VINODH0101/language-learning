/**
 * Content Gap Registry
 * Records audited educational resource availability and documented gaps across all 13 languages.
 *
 * PRINCIPLE: "Where resources are insufficient, record the gap instead of inventing coverage."
 * Lexilume — Illuminate Your Words
 */

import { Language } from '../../types';
import { ContentCategory, ContentGapRecord } from '../../types/contentEngine';

export class ContentGapRegistry {
  private static instance: ContentGapRegistry;
  private gapRecords: Map<string, ContentGapRecord> = new Map();

  private constructor() {
    this.initializeAuditedGaps();
  }

  public static getInstance(): ContentGapRegistry {
    if (!ContentGapRegistry.instance) {
      ContentGapRegistry.instance = new ContentGapRegistry();
    }
    return ContentGapRegistry.instance;
  }

  private buildKey(language: Language, category: ContentCategory): string {
    return `${language}:${category}`;
  }

  private initializeAuditedGaps(): void {
    const defaultAuditDate = '2026-10-30';

    const baselineGaps: ContentGapRecord[] = [
      // 1. TAMIL GAPS
      {
        language: 'ta',
        category: 'pronunciation',
        coverageStatus: 'partial',
        availableSources: ['Tatoeba Audio Samples', 'Unicode Segmenter'],
        missingResources: ['Client-side Tamil SpeechSynthesis voice in older desktop browsers'],
        pedagogicalMitigation: 'Fallback to pre-recorded authentic Tatoeba MP3 clips when Web Speech API lacks ta-IN voice.',
        lastAudited: defaultAuditDate,
      },
      {
        language: 'ta',
        category: 'false_friends',
        coverageStatus: 'gap_documented',
        availableSources: ['Dravidian Etymological Dictionary'],
        missingResources: ['Significant Latinate/Romance false friends (non-cognate language family)'],
        pedagogicalMitigation: 'Focus on diglossia and register transfer errors (Sen-Tamil formal vs Koduntamil colloquial) instead of Latin false cognates.',
        lastAudited: defaultAuditDate,
      },

      // 2. JAPANESE GAPS
      {
        language: 'ja',
        category: 'false_friends',
        coverageStatus: 'partial',
        availableSources: ['JMdict Katakana Loanwords Index'],
        missingResources: ['Comprehensive Wasei-Eigo (Japanese-made English) interference index'],
        pedagogicalMitigation: 'Highlight semantic shifts in common Katakana terms (e.g. "claim" クレーム meaning complaint, not assertion).',
        lastAudited: defaultAuditDate,
      },

      // 3. KOREAN GAPS
      {
        language: 'ko',
        category: 'false_friends',
        coverageStatus: 'partial',
        availableSources: ['National Institute of Korean Language'],
        missingResources: ['Konglish (Korean-style English) transfer warning corpus'],
        pedagogicalMitigation: 'Provide dedicated notes for Konglish shifts (e.g. "cunning" 컨닝 meaning cheating in an exam).',
        lastAudited: defaultAuditDate,
      },

      // 4. TURKISH GAPS
      {
        language: 'tr',
        category: 'false_friends',
        coverageStatus: 'gap_documented',
        availableSources: ['Türk Dil Kurumu (TDK)'],
        missingResources: ['Agglutinative false cognates index with Romance/English stems'],
        pedagogicalMitigation: 'Focus pedagogical notes on vowel harmony violations and case suffix assimilation rather than lexical false friends.',
        lastAudited: defaultAuditDate,
      },

      // 5. MANDARIN CHINESE GAPS
      {
        language: 'zh',
        category: 'pronunciation',
        coverageStatus: 'partial',
        availableSources: ['Pinyin Segmenter', 'Web Speech zh-CN'],
        missingResources: ['Real-time pitch contour contouring (Tone visualizer) in browser without WebAudio WASM'],
        pedagogicalMitigation: 'Display Pinyin diacritics and tone numbers with audio playback comparison.',
        lastAudited: defaultAuditDate,
      },

      // 6. RUSSIAN GAPS
      {
        language: 'ru',
        category: 'pronunciation',
        coverageStatus: 'partial',
        availableSources: ['Russian Wiktionary IPA'],
        missingResources: ['Dynamic mobile stress mark display on live unaccented web texts'],
        pedagogicalMitigation: 'Provide acute stress marks on all A1-B1 curriculum vocabulary while stripping them for search indexing.',
        lastAudited: defaultAuditDate,
      },

      // 7. DUTCH GAPS
      {
        language: 'nl',
        category: 'false_friends',
        coverageStatus: 'partial',
        availableSources: ['Algemeen Nederlands Woordenboek'],
        missingResources: ['Dutch-Portuguese specific false friends index'],
        pedagogicalMitigation: 'Highlight German-Dutch interference (Duits-Nederlands valse vrienden) and Dutch-English cognates (e.g. "eventueel" meaning possibly, not eventually).',
        lastAudited: defaultAuditDate,
      },
    ];

    for (const record of baselineGaps) {
      this.gapRecords.set(this.buildKey(record.language, record.category), record);
    }
  }

  public recordGap(record: ContentGapRecord): void {
    this.gapRecords.set(this.buildKey(record.language, record.category), record);
  }

  public getGapsForLanguage(language: Language): ContentGapRecord[] {
    const list: ContentGapRecord[] = [];
    for (const record of this.gapRecords.values()) {
      if (record.language === language) {
        list.push(record);
      }
    }
    return list;
  }

  public getGap(language: Language, category: ContentCategory): ContentGapRecord | undefined {
    return this.gapRecords.get(this.buildKey(language, category));
  }

  public getAllGaps(): ContentGapRecord[] {
    return Array.from(this.gapRecords.values());
  }
}
