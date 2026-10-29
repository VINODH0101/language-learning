/**
 * Unified Dictionary Service for Multi-Language Lexical Lookups.
 * Integrates Free Dictionary API (EN), Dicionário Aberto (PT), and Local Curated Seed Vocabularies.
 */

import { FreeDictionaryAdapter } from '../integrations/external-apis/adapters/free-dictionary/FreeDictionaryAdapter';
import { DicionarioAbertoAdapter } from '../integrations/external-apis/adapters/dicionario-aberto/DicionarioAbertoAdapter';
import { NormalizedDictionaryEntry } from '../integrations/external-apis/core/types';
import { esVocabulary } from '../data/seedData';
import { trilingualDictionary } from '../data/translationData';

const freeDictAdapter = new FreeDictionaryAdapter();
const dicionarioAbertoAdapter = new DicionarioAbertoAdapter();

export class DictionaryService {
  /**
   * Look up definition, phonetics, and grammatical category for a word.
   */
  public static async lookup(
    word: string,
    language: 'en' | 'pt' | 'es'
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
            definitions: [
              esMatch.definition_target,
              esMatch.definition_en ? `EN: ${esMatch.definition_en}` : '',
            ].filter(Boolean),
            examples: [esMatch.example_sentence_target],
          },
        ],
        provider: 'curated-es-seed',
      };
    }

    const triMatch = trilingualDictionary.find(t => t.spanish.toLowerCase() === q);
    if (triMatch) {
      return {
        word: triMatch.spanish,
        language: 'es',
        phonetic: triMatch.phonetic_en,
        meanings: [
          {
            partOfSpeech: triMatch.part_of_speech,
            definitions: [
              `PT: ${triMatch.portuguese}`,
              `EN: ${triMatch.english}`,
            ],
            examples: [triMatch.example_es],
          },
        ],
        provider: 'curated-es-seed',
      };
    }

    return {
      word: cleanWord,
      language: 'es',
      meanings: [
        {
          partOfSpeech: 'termo',
          definitions: [`Termo registrado em espanhol. Consulte frases de exemplo no módulo de prática.`],
        },
      ],
      provider: 'fallback',
    };
  }
}
