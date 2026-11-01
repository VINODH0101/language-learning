/**
 * Lexilume Practice Vocabulary Service
 * 
 * Aggregates vocabulary across curated seed data, Daily Poetry, Daily Conversations,
 * and user-saved Phrasebook items. Partitions decks into Due, New, and Mastered pools,
 * and manages user- and language-scoped daily review counters.
 */

import { Language, VocabularyItem } from '../../../types';
import { ptVocabulary, esVocabulary, enVocabulary } from '../../../data/seedData';
import { dailyContentService } from '../../../services/dailyContentService';
import { getPhrasebookWords, SavedVocabularyRecord } from '../../../services/localDb';
import { StorageService } from '../../../services/storage';
import { VocabDeckPartition } from '../types';

export class PracticeVocabService {
  private static instance: PracticeVocabService;

  public static getInstance(): PracticeVocabService {
    if (!PracticeVocabService.instance) {
      PracticeVocabService.instance = new PracticeVocabService();
    }
    return PracticeVocabService.instance;
  }

  /**
   * Retrieves today's date formatted as YYYY-MM-DD using local timezone.
   */
  public getTodayLocalDate(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Gets the user- and language-scoped key for daily completed reviews.
   */
  public getDailyReviewKey(language: Language, userId?: string): string {
    const uid = userId || StorageService.getCurrentUser();
    const today = this.getTodayLocalDate();
    return `lexilume_srs_reviews_${uid}_${language}_${today}`;
  }

  /**
   * Retrieves the count of SRS reviews completed today.
   */
  public getTodayReviewCount(language: Language, userId?: string): number {
    try {
      const scopedKey = this.getDailyReviewKey(language, userId);
      const scopedVal = localStorage.getItem(scopedKey);
      if (scopedVal !== null) return parseInt(scopedVal, 10);

      // Only check legacy if userId is not explicitly provided
      if (!userId) {
        const today = this.getTodayLocalDate();
        const legacyVal = localStorage.getItem(`lexilume_srs_reviews_today_${today}`);
        if (legacyVal) return parseInt(legacyVal, 10);
      }
    } catch {}
    return 0;
  }

  /**
   * Increments today's completed review counter for the active user and language.
   */
  public incrementTodayReviewCount(language: Language, userId?: string): number {
    const current = this.getTodayReviewCount(language, userId);
    const updated = current + 1;
    try {
      const scopedKey = this.getDailyReviewKey(language, userId);
      localStorage.setItem(scopedKey, String(updated));

      // Mirror to legacy only when matching current active user session
      const activeUid = StorageService.getCurrentUser();
      if (!userId || userId === activeUid) {
        const today = this.getTodayLocalDate();
        localStorage.setItem(`lexilume_srs_reviews_today_${today}`, String(updated));
      }
    } catch {}
    return updated;
  }

  /**
   * Builds the comprehensive vocabulary pool for a given target language.
   */
  public async getVocabularyPool(language: Language): Promise<VocabularyItem[]> {
    const pool: VocabularyItem[] = [];
    const seenLemmas = new Set<string>();

    // 1. Curated base seed vocabulary
    let baseSeed: VocabularyItem[] = [];
    if (language === 'pt') baseSeed = ptVocabulary;
    else if (language === 'es') baseSeed = esVocabulary;
    else if (language === 'en') baseSeed = enVocabulary;

    for (const v of baseSeed) {
      if (!seenLemmas.has(v.lemma.toLowerCase())) {
        seenLemmas.add(v.lemma.toLowerCase());
        pool.push(v);
      }
    }

    // 2. Vocabulary from Daily Poetry
    try {
      const activePoem = await dailyContentService.getActivePoem(language);
      if (activePoem) {
        // Extract memorable words from title and author
        const poemVocabId = `vocab_${language}_poem_${activePoem.id}`;
        if (!pool.some(p => p.id === poemVocabId)) {
          pool.push({
            id: poemVocabId,
            language,
            lemma: activePoem.title,
            part_of_speech: 'noun',
            cefr_level: activePoem.cefr_level,
            definition_target: activePoem.cultural_context,
            definition_en: activePoem.translation || activePoem.cultural_context,
            example_sentence_target: activePoem.excerpt,
            example_sentence_en: activePoem.translation || '',
            regional_tags: ['all'],
            collocations: [],
            attribution: {
              source_name: `Daily Poetry — ${activePoem.author}`,
              source_url: 'https://github.com/VINODH0101/language-learning',
              license_type: 'Public Domain / Creative Commons',
              attribution_text: `Extracted from "${activePoem.title}" by ${activePoem.author}`,
            },
          });
        }
      }
    } catch (e) {
      console.warn('Could not extract poem vocabulary', e);
    }

    // 3. User-saved Phrasebook items
    try {
      const phrasebookWords = await getPhrasebookWords(language);
      for (const item of phrasebookWords) {
        const lemmaClean = item.source_text.trim().toLowerCase();
        if (!seenLemmas.has(lemmaClean)) {
          seenLemmas.add(lemmaClean);
          pool.push({
            id: `phrasebook_${item.id}`,
            language,
            lemma: item.source_text,
            part_of_speech: (item.part_of_speech as any) || 'noun',
            cefr_level: 'B1',
            definition_target: item.translated_text,
            definition_en: item.translated_text,
            example_sentence_target: item.context_sentence || item.source_text,
            example_sentence_en: item.translated_text,
            regional_tags: ['all'],
            collocations: [],
            attribution: {
              source_name: 'Personal Phrasebook',
              source_url: 'local',
              license_type: 'User-Curated',
              attribution_text: 'Saved from Lexilume reading and dialogue exploration.',
            },
          });
        }
      }
    } catch (e) {
      console.warn('Could not load phrasebook vocabulary', e);
    }

    return pool;
  }

  /**
   * Partitions the vocabulary into Due, New, Mastered, and Saved collections.
   */
  public async getDeckPartition(language: Language): Promise<VocabDeckPartition> {
    const all = await this.getVocabularyPool(language);
    const srsItems = StorageService.getSRSItems(language);
    const today = this.getTodayLocalDate();

    const dueItems = srsItems.filter(s => s.next_review_date <= today);
    const dueIds = new Set(dueItems.map(s => s.vocabulary_item_id));
    const masteredIds = new Set(
      srsItems.filter(s => s.mastery_status === 'mastered').map(s => s.vocabulary_item_id)
    );
    const reviewedIds = new Set(srsItems.map(s => s.vocabulary_item_id));

    const due = all.filter(v => dueIds.has(v.id));
    const newWords = all.filter(v => !reviewedIds.has(v.id));
    const mastered = all.filter(v => masteredIds.has(v.id));

    let savedPhrasebook: SavedVocabularyRecord[] = [];
    try {
      savedPhrasebook = await getPhrasebookWords(language);
    } catch {}

    return {
      due,
      newWords,
      mastered,
      savedPhrasebook,
      all,
    };
  }
}

export const practiceVocabService = PracticeVocabService.getInstance();
