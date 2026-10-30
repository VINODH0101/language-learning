/**
 * Kaikki / Wiktionary Provider
 * Free machine-readable Wiktionary extraction for lexical analysis.
 * https://kaikki.org/
 */

import { BaseProvider } from '../baseProvider';
import { ProviderMetadata, ValidationError, UnsupportedLanguageError } from '../types';
import { KaikkiEntrySchema } from '../../validation/schemas';
import { normalizeDictionary } from '../../normalization/responseNormalizers';
import { NormalizedDictionaryEntry } from '../../../integrations/external-apis/core/types';
import { esVocabulary, ptVocabulary } from '../../../data/seedData';
import { trilingualDictionary } from '../../../data/translationData';

export class KaikkiProvider extends BaseProvider<{ word: string; language: string }, NormalizedDictionaryEntry> {
  public readonly metadata: ProviderMetadata = {
    id: 'kaikki_wiktionary',
    name: 'Kaikki.org (Structured Wiktionary)',
    description: 'Structured Wiktionary lexical extracts containing definitions, IPA, morphology, and etymology.',
    category: 'dictionary',
    attribution: 'Wiktionary via Kaikki.org — CC-BY-SA 4.0',
    attributionUrl: 'https://kaikki.org',
    license: 'CC-BY-SA 4.0',
    isPaid: false,
    requiresKey: false,
    supportedLanguages: ['en', 'pt', 'es', 'fr', 'de', 'it', 'ja', 'ko', 'ru', 'nl', 'zh', 'tr', 'ta'],
  };

  protected validateInput(input: { word: string; language: string }): void {
    if (!input.word || input.word.trim().length === 0) {
      throw new ValidationError(this.metadata.id, 'Palavra para consulta não pode estar vazia.');
    }
    if (!input.language) {
      throw new ValidationError(this.metadata.id, 'Código de idioma obrigatório.');
    }
  }

  protected generateCacheKey(input: { word: string; language: string }): string {
    return `${input.language.toLowerCase()}:${input.word.trim().toLowerCase()}`;
  }

  protected async fetchRaw(input: { word: string; language: string }, signal: AbortSignal): Promise<unknown> {
    const encoded = encodeURIComponent(input.word.trim().toLowerCase());
    // Public Wiktionary REST endpoint or Kaikki JSON mirror
    const url = `https://${input.language}.wiktionary.org/api/rest_v1/page/definition/${encoded}`;

    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new Error(`Wiktionary HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  protected normalize(raw: any, input: { word: string; language: string }): NormalizedDictionaryEntry {
    // Kaikki/Wiktionary REST response format
    const meanings: Array<{
      partOfSpeech: string;
      definitions: string[];
      examples?: string[];
      synonyms?: string[];
      antonyms?: string[];
    }> = [];

    // Wiktionary REST returns language code keys: e.g. { pt: [ { partOfSpeech: "substantivo", definitions: [...] } ] }
    const langEntries = raw[input.language] || raw['en'] || (Array.isArray(raw) ? raw : []);

    if (Array.isArray(langEntries)) {
      for (const section of langEntries) {
        const pos = section.partOfSpeech || 'palavra';
        const defs: string[] = [];
        const examples: string[] = [];

        if (Array.isArray(section.definitions)) {
          for (const d of section.definitions) {
            if (typeof d === 'string') {
              defs.push(d);
            } else if (d?.definition) {
              defs.push(d.definition);
              if (d.examples && Array.isArray(d.examples)) {
                examples.push(...d.examples);
              }
            }
          }
        }

        if (defs.length > 0) {
          meanings.push({
            partOfSpeech: pos,
            definitions: defs,
            examples,
          });
        }
      }
    }

    if (meanings.length === 0) {
      throw new Error(`Nenhuma acepção válida encontrada no Wiktionary para "${input.word}".`);
    }

    return normalizeDictionary(
      input.word,
      input.language,
      meanings,
      this.metadata.id,
      {
        sourceUrl: `https://${input.language}.wiktionary.org/wiki/${encodeURIComponent(input.word)}`,
      }
    );
  }

  protected getFallback(input: { word: string; language: string }): NormalizedDictionaryEntry {
    const q = input.word.trim().toLowerCase();
    const lang = input.language.toLowerCase();

    if (lang === 'es') {
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
          provider: 'seed_fallback',
        };
      }
    }

    if (lang === 'pt') {
      const ptMatch = ptVocabulary.find(v => v.lemma.toLowerCase() === q);
      if (ptMatch) {
        return {
          word: ptMatch.lemma,
          language: 'pt',
          phonetic: ptMatch.phonetic_ipa,
          meanings: [
            {
              partOfSpeech: ptMatch.part_of_speech,
              definitions: [ptMatch.definition_target, ptMatch.definition_en].filter(Boolean),
              examples: [ptMatch.example_sentence_target].filter(Boolean),
            },
          ],
          provider: 'seed_fallback',
        };
      }
    }

    const triMatch = trilingualDictionary.find(
      d =>
        d.english?.toLowerCase() === q ||
        d.portuguese?.toLowerCase() === q ||
        d.spanish?.toLowerCase() === q
    );
    if (triMatch) {
      return {
        word: input.word,
        language: lang,
        meanings: [
          {
            partOfSpeech: triMatch.part_of_speech,
            definitions: [triMatch.definition_en, triMatch.definition_pt, triMatch.definition_es].filter(Boolean),
            examples: [triMatch.example_en, triMatch.example_pt, triMatch.example_es].filter(Boolean),
          },
        ],
        provider: 'trilingual_fallback',
      };
    }

    throw new Error(`Nenhuma definição encontrada para "${input.word}" no idioma "${lang}".`);
  }
}
