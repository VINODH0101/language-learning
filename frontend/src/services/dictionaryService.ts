/**
 * Unified Dictionary Service for Multi-Language Lexical Lookups.
 * Integrates Free Dictionary API (EN), Dicionário Aberto (PT), and Local Curated Seed Vocabularies.
 */

import { FreeDictionaryAdapter } from '../integrations/external-apis/adapters/free-dictionary/FreeDictionaryAdapter';
import { DicionarioAbertoAdapter } from '../integrations/external-apis/adapters/dicionario-aberto/DicionarioAbertoAdapter';
import { DictionaryManager } from './providers/dictionary/dictionaryManager';
import { NormalizedDictionaryEntry } from '../integrations/external-apis/core/types';
import { contentAccess } from './contentAccess';
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
      const q = cleanWord.toLowerCase();
      try {
        const aiEntries = await contentAccess.getPublishedVocabularyEntries('es', 'en');
        const aiMatch = aiEntries.find(v => v.lemma.toLowerCase() === q);
        if (aiMatch) {
          return {
            word: aiMatch.lemma,
            language: 'es',
            phonetic: aiMatch.phonetic_ipa,
            meanings: [
              {
                partOfSpeech: aiMatch.part_of_speech,
                definitions: [
                  aiMatch.definitions.en || aiMatch.translations.en || aiMatch.lemma,
                ].filter(Boolean),
                examples: [aiMatch.example_sentence_target].filter(Boolean),
              },
            ],
            provider: 'content_engine',
          };
        }
      } catch {
        // Fall through to Wiktionary/Kaikki live provider
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
