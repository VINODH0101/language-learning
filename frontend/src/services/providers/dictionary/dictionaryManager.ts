/**
 * Dictionary Cascade Manager
 * Routes lexical lookups to Kaikki/Wiktionary, FreeDictionary (EN), or Dicionário Aberto (PT).
 */

import { KaikkiProvider } from './kaikkiProvider';
import { FreeDictionaryAdapter } from '../../../integrations/external-apis/adapters/free-dictionary/FreeDictionaryAdapter';
import { DicionarioAbertoAdapter } from '../../../integrations/external-apis/adapters/dicionario-aberto/DicionarioAbertoAdapter';
import { DictionaryIndex } from './dictionaryIndex';
import { NormalizedDictionaryEntry } from '../../../integrations/external-apis/core/types';

export class DictionaryManager {
  private static instance: DictionaryManager;
  private kaikki = new KaikkiProvider();
  private freeDict = new FreeDictionaryAdapter();
  private dicionarioAberto = new DicionarioAbertoAdapter();
  private index = DictionaryIndex.getInstance();

  private constructor() {}

  public static getInstance(): DictionaryManager {
    if (!DictionaryManager.instance) {
      DictionaryManager.instance = new DictionaryManager();
    }
    return DictionaryManager.instance;
  }

  public async lookup(word: string, language: string): Promise<NormalizedDictionaryEntry> {
    const lang = language.toLowerCase();
    const q = word.trim().toLowerCase();
    let result: NormalizedDictionaryEntry | null = null;

    if (lang === 'en') {
      try {
        result = await this.freeDict.execute({ word, language: 'en' });
      } catch (err) {
        console.warn('[DictionaryManager] FreeDictionary failed, falling back to Wiktionary...', err);
        result = await this.kaikki.execute({ word, language: 'en' });
      }
    } else if (lang === 'pt') {
      try {
        result = await this.dicionarioAberto.execute({ word, language: 'pt' });
      } catch (err) {
        console.warn('[DictionaryManager] Dicionário Aberto failed, falling back to Wiktionary...', err);
        result = await this.kaikki.execute({ word, language: 'pt' });
      }
    } else {
      result = await this.kaikki.execute({ word, language: lang });
    }

    if (!result) {
      const indexed = this.index.search(q, lang);
      if (indexed.length > 0) {
        const hit = indexed[0];
        result = {
          word: hit.word,
          language: hit.language,
          meanings: [
            {
              partOfSpeech: hit.partOfSpeech,
              definitions: [hit.definition],
              examples: [],
            },
          ],
          provider: 'dictionary_index',
        };
      }
    }

    if (result) {
      this.index.addEntry(result);
      return result;
    }

    throw new Error(`Word "${word}" not found for language "${language}".`);
  }

  public searchIndexed(query: string, language?: string) {
    return this.index.search(query, language);
  }
}
