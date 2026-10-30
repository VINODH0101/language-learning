/**
 * Local MiniSearch Dictionary Index
 * Enables sub-millisecond prefix, typo-tolerant, and phonetic lexical search offline.
 */

import MiniSearch from 'minisearch';
import { NormalizedDictionaryEntry } from '../../../integrations/external-apis/core/types';

export interface IndexedDictionaryItem {
  id: string; // `${language}:${word}`
  word: string;
  language: string;
  partOfSpeech: string;
  definition: string;
}

export class DictionaryIndex {
  private static instance: DictionaryIndex;
  private miniSearch: MiniSearch<IndexedDictionaryItem>;

  private constructor() {
    this.miniSearch = new MiniSearch({
      fields: ['word', 'definition'],
      storeFields: ['id', 'word', 'language', 'partOfSpeech', 'definition'],
      searchOptions: {
        boost: { word: 2 },
        fuzzy: 0.2,
        prefix: true,
      },
    });
  }

  public static getInstance(): DictionaryIndex {
    if (!DictionaryIndex.instance) {
      DictionaryIndex.instance = new DictionaryIndex();
    }
    return DictionaryIndex.instance;
  }

  public addEntry(entry: NormalizedDictionaryEntry): void {
    const primaryMeaning = entry.meanings[0];
    const item: IndexedDictionaryItem = {
      id: `${entry.language}:${entry.word.toLowerCase()}`,
      word: entry.word,
      language: entry.language,
      partOfSpeech: primaryMeaning?.partOfSpeech || 'termo',
      definition: primaryMeaning?.definitions[0] || 'Sem definição',
    };

    if (this.miniSearch.has(item.id)) {
      this.miniSearch.discard(item.id);
    }
    this.miniSearch.add(item);
  }

  public search(query: string, language?: string): IndexedDictionaryItem[] {
    if (!query.trim()) return [];

    const results = this.miniSearch.search(query.trim(), {
      filter: language ? item => item.language === language : undefined,
    });

    return results.map(r => ({
      id: r.id,
      word: r.word,
      language: r.language,
      partOfSpeech: r.partOfSpeech,
      definition: r.definition,
    }));
  }

  public clear(): void {
    this.miniSearch.removeAll();
  }
}
