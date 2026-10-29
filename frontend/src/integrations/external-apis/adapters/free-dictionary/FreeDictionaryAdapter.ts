/**
 * Free Dictionary API Adapter (English Lexicon, IPA phonetics, Audio).
 * Public endpoint: https://api.dictionaryapi.dev/api/v2/entries/en/{word}
 */

import {
  BaseApiProvider,
  DictionaryInput,
  NormalizedDictionaryEntry,
  NormalizedDictionaryMeaning,
  ProviderMetadata,
  ValidationError,
  ProviderUnavailableError,
} from '../../core';
import { enVocabulary } from '../../../../data/seedData';
import { trilingualDictionary } from '../../../../data/translationData';

interface RawPhonetic {
  text?: string;
  audio?: string;
}

interface RawDefinition {
  definition: string;
  example?: string;
  synonyms?: string[];
  antonyms?: string[];
}

interface RawMeaning {
  partOfSpeech: string;
  definitions: RawDefinition[];
  synonyms?: string[];
  antonyms?: string[];
}

interface RawDictionaryEntry {
  word: string;
  phonetic?: string;
  phonetics?: RawPhonetic[];
  meanings?: RawMeaning[];
  sourceUrls?: string[];
}

export class FreeDictionaryAdapter extends BaseApiProvider<DictionaryInput, NormalizedDictionaryEntry> {
  public readonly metadata: ProviderMetadata = {
    id: 'free-dictionary',
    name: 'Free Dictionary API (English)',
    description: 'Comprehensive English definitions, parts of speech, IPA phonetic transcriptions, and audio pronunciations.',
    type: 'dictionary',
    attribution: 'Free Dictionary API / Wiktionary Community',
    attributionUrl: 'https://dictionaryapi.dev',
    isPaid: false,
    requiresKey: false,
    rateLimitInfo: {
      maxRequests: 10,
      windowMs: 1000,
    },
  };

  protected validateInput(input: DictionaryInput): void {
    if (!input.word || input.word.trim().length === 0) {
      throw new ValidationError(this.metadata.id, 'O termo para busca no dicionário não pode estar vazio.');
    }
    if (input.language && input.language !== 'en') {
      throw new ValidationError(
        this.metadata.id,
        `Free Dictionary API suporta apenas inglês. Idioma solicitado: ${input.language}`
      );
    }
  }

  protected generateCacheKey(input: DictionaryInput): string {
    return `en:${input.word.trim().toLowerCase()}`;
  }

  protected async fetchRaw(input: DictionaryInput): Promise<unknown> {
    const encoded = encodeURIComponent(input.word.trim().toLowerCase());
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encoded}`;

    const response = await fetch(url);
    if (response.status === 404) {
      throw new ProviderUnavailableError(
        this.metadata.id,
        404,
        `Palavra "${input.word}" não encontrada no dicionário de inglês.`
      );
    }
    if (!response.ok) {
      throw new ProviderUnavailableError(
        this.metadata.id,
        response.status,
        `Free Dictionary HTTP ${response.status}: ${response.statusText}`
      );
    }

    return await response.json();
  }

  protected normalize(raw: unknown, input: DictionaryInput): NormalizedDictionaryEntry {
    const entries = raw as RawDictionaryEntry[];
    if (!Array.isArray(entries) || entries.length === 0) {
      throw new ProviderUnavailableError(this.metadata.id, 500, 'Resposta vazia ou inválida do dicionário.');
    }

    const first = entries[0];
    let phonetic = first.phonetic;
    let phoneticAudioUrl: string | undefined;

    if (first.phonetics && first.phonetics.length > 0) {
      for (const p of first.phonetics) {
        if (!phonetic && p.text) {
          phonetic = p.text;
        }
        if (!phoneticAudioUrl && p.audio && p.audio.trim().length > 0) {
          phoneticAudioUrl = p.audio;
        }
      }
    }

    const meanings: NormalizedDictionaryMeaning[] = (first.meanings || []).map(m => {
      const defs = (m.definitions || []).map(d => d.definition);
      const examples = (m.definitions || [])
        .map(d => d.example)
        .filter((ex): ex is string => Boolean(ex));
      const synonyms = [
        ...(m.synonyms || []),
        ...(m.definitions || []).flatMap(d => d.synonyms || []),
      ];
      const antonyms = [
        ...(m.antonyms || []),
        ...(m.definitions || []).flatMap(d => d.antonyms || []),
      ];

      return {
        partOfSpeech: m.partOfSpeech,
        definitions: defs,
        examples: examples.length > 0 ? examples : undefined,
        synonyms: synonyms.length > 0 ? Array.from(new Set(synonyms)) : undefined,
        antonyms: antonyms.length > 0 ? Array.from(new Set(antonyms)) : undefined,
      };
    });

    return {
      word: first.word || input.word,
      language: 'en',
      phonetic,
      phoneticAudioUrl,
      meanings,
      provider: this.metadata.id,
      sourceUrl: first.sourceUrls?.[0] || `https://en.wiktionary.org/wiki/${encodeURIComponent(input.word)}`,
    };
  }

  protected getFallback(input: DictionaryInput, _error: unknown): NormalizedDictionaryEntry {
    const q = input.word.trim().toLowerCase();

    // 1. Check enVocabulary
    const vocMatch = enVocabulary.find(v => v.lemma.toLowerCase() === q);
    if (vocMatch) {
      return {
        word: vocMatch.lemma,
        language: 'en',
        phonetic: vocMatch.phonetic_ipa,
        meanings: [
          {
            partOfSpeech: vocMatch.part_of_speech,
            definitions: [
              vocMatch.definition_en,
              vocMatch.definition_pt ? `PT: ${vocMatch.definition_pt}` : '',
              vocMatch.definition_es ? `ES: ${vocMatch.definition_es}` : '',
            ].filter(Boolean),
            examples: [vocMatch.example_sentence_target],
          },
        ],
        provider: 'offline-seed',
      };
    }

    // 2. Check trilingualDictionary
    const triMatch = trilingualDictionary.find(t => t.english.toLowerCase() === q);
    if (triMatch) {
      return {
        word: triMatch.english,
        language: 'en',
        phonetic: triMatch.phonetic_en,
        meanings: [
          {
            partOfSpeech: triMatch.part_of_speech,
            definitions: [
              `PT: ${triMatch.portuguese}`,
              `ES: ${triMatch.spanish}`,
            ],
            examples: [triMatch.example_en],
          },
        ],
        provider: 'offline-seed',
      };
    }

    return {
      word: input.word,
      language: 'en',
      meanings: [
        {
          partOfSpeech: 'termo',
          definitions: ['Definição externa indisponível no momento. Modo offline ativo.'],
        },
      ],
      provider: 'fallback',
    };
  }
}
