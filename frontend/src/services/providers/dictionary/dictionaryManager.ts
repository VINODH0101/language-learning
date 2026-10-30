/**
 * Dictionary Cascade Manager
 * Routes lexical lookups to Kaikki/Wiktionary, FreeDictionary (EN), or Dicionário Aberto (PT).
 */

import { KaikkiProvider } from './kaikkiProvider';
import { FreeDictionaryAdapter } from '../../../integrations/external-apis/adapters/free-dictionary/FreeDictionaryAdapter';
import { DicionarioAbertoAdapter } from '../../../integrations/external-apis/adapters/dicionario-aberto/DicionarioAbertoAdapter';
import { DictionaryIndex } from './dictionaryIndex';
import { NormalizedDictionaryEntry } from '../../../integrations/external-apis/core/types';
import { esVocabulary } from '../../../data/seedData';
import { trilingualDictionary } from '../../../data/translationData';

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
    } else if (lang === 'es') {
      // Spanish fast seed path
      const esMatch = esVocabulary.find(v => v.lemma.toLowerCase() === q);
      if (esMatch) {
        result = {
          word: esMatch.lemma,
          language: 'es',
          phonetic: esMatch.phonetic_ipa,
          meanings: [
            {
              partOfSpeech: esMatch.part_of_speech,
              definitions: [esMatch.definition_target, esMatch.definition_en].filter(Boolean),
              examples: [esMatch.example_sentence_target].filter(Boolean),
            },
          ],
          provider: 'curated_seed',
        };
      } else {
        try {
          result = await this.kaikki.execute({ word, language: 'es' });
        } catch {
          const triMatch = trilingualDictionary.find(d => d.spanish?.toLowerCase() === q);
          if (triMatch) {
            result = {
              word: triMatch.spanish,
              language: 'es',
              phonetic: triMatch.phonetic_es,
              meanings: [
                {
                  partOfSpeech: triMatch.part_of_speech,
                  definitions: [triMatch.definition_es, triMatch.definition_en].filter(Boolean),
                  examples: [triMatch.example_es].filter(Boolean),
                },
              ],
              provider: 'trilingual_seed',
            };
          }
        }
      }
    } else {
      result = await this.kaikki.execute({ word, language: lang });
    }

    if (result) {
      this.index.addEntry(result);
      return result;
    }

    throw new Error(`Palavra "${word}" não encontrada para o idioma "${language}".`);
  }

  public searchIndexed(query: string, language?: string) {
    return this.index.search(query, language);
  }
}
