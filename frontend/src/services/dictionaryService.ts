/**
 * Unified Dictionary Service for Multi-Language Lexical Lookups.
 * Integrates Free Dictionary API (EN), Dicionário Aberto (PT), and Local Curated Seed Vocabularies.
 */

import { FreeDictionaryAdapter } from '../integrations/external-apis/adapters/free-dictionary/FreeDictionaryAdapter';
import { DicionarioAbertoAdapter } from '../integrations/external-apis/adapters/dicionario-aberto/DicionarioAbertoAdapter';
import { DictionaryManager } from './providers/dictionary/dictionaryManager';
import { NormalizedDictionaryEntry } from '../integrations/external-apis/core/types';
import { esVocabulary } from '../data/seedData';
import { trilingualDictionary } from '../data/translationData';

import { Language } from '../types';

const freeDictAdapter = new FreeDictionaryAdapter();
const dicionarioAbertoAdapter = new DicionarioAbertoAdapter();
const dictionaryManager = DictionaryManager.getInstance();

export class DictionaryService {
  /**
   * Look up definition, phonetics, and grammatical category for a word.
   */
  public static async lookup(
    word: string,
    language: Language | string
  ): Promise<NormalizedDictionaryEntry> {
    const cleanWord = word.trim();
    if (!cleanWord) {
      throw new Error('O termo de consulta não pode estar vazio.');
    }

    if (language === 'en') {
      return await freeDictAdapter.execute({ word: cleanWord, language: 'en' });
    }

    if (language === 'pt') {
      return await dicionarioAbertoAdapter.execute({ word: cleanWord, language: 'pt' });
    }

    if (language === 'es') {
      // Spanish Lookup: curated seed data + trilingual dictionary
      const q = cleanWord.toLowerCase();
      const esMatch = esVocabulary.find(v => v.lemma.toLowerCase() === q);
      if (esMatch) {
        return {
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
      }

      const triMatch = trilingualDictionary.find(d => d.spanish.toLowerCase() === q);
      if (triMatch) {
        return {
          word: triMatch.spanish,
          language: 'es',
          phonetic: triMatch.phonetic_es,
          meanings: [
            {
              partOfSpeech: triMatch.part_of_speech,
              definitions: [
                `Inglês: ${triMatch.english}`,
                `Português: ${triMatch.portuguese}`,
              ],
              examples: [triMatch.example_es].filter(Boolean),
            },
          ],
          provider: 'trilingual_dictionary',
        };
      }
    }

    // Comprehensive Kaikki/Wiktionary lookup for all supported languages
    try {
      return await dictionaryManager.lookup(cleanWord, language);
    } catch {
      return {
        word: cleanWord,
        language: language as string,
        meanings: [
          {
            partOfSpeech: 'termo',
            definitions: [`Definição contextual para "${cleanWord}" (${language})`],
            examples: [],
          },
        ],
        provider: 'fallback',
      };
    }
  }
}
