/**
 * Dicionário Aberto API Adapter (Authentic Open Portuguese Lexicon).
 * Public endpoint: https://api.dicionario-aberto.net/word/{word}
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
import { ptVocabulary } from '../../../../data/seedData';
import { trilingualDictionary } from '../../../../data/translationData';

interface RawDicionarioAbertoEntry {
  word: string;
  xml: string;
  sense?: number;
}

export class DicionarioAbertoAdapter extends BaseApiProvider<DictionaryInput, NormalizedDictionaryEntry> {
  public readonly metadata: ProviderMetadata = {
    id: 'dicionario-aberto',
    name: 'Dicionário Aberto (Português)',
    description: 'Open Portuguese lexical database based on Cândido de Figueiredo classical dictionary.',
    type: 'dictionary',
    attribution: 'Dicionário Aberto (Universidade do Minho / Cândido de Figueiredo)',
    attributionUrl: 'https://dicionario-aberto.net',
    isPaid: false,
    requiresKey: false,
    rateLimitInfo: {
      maxRequests: 10,
      windowMs: 1000,
    },
  };

  protected validateInput(input: DictionaryInput): void {
    if (!input.word || input.word.trim().length === 0) {
      throw new ValidationError(this.metadata.id, 'O termo em português não pode estar vazio.');
    }
    if (input.language && input.language !== 'pt') {
      throw new ValidationError(
        this.metadata.id,
        `Dicionário Aberto suporta apenas português. Idioma solicitado: ${input.language}`
      );
    }
  }

  protected generateCacheKey(input: DictionaryInput): string {
    return `pt:${input.word.trim().toLowerCase()}`;
  }

  protected async fetchRaw(input: DictionaryInput): Promise<unknown> {
    const encoded = encodeURIComponent(input.word.trim().toLowerCase());
    const url = `https://api.dicionario-aberto.net/word/${encoded}`;

    const response = await fetch(url);
    if (response.status === 404) {
      throw new ProviderUnavailableError(
        this.metadata.id,
        404,
        `Palavra "${input.word}" não encontrada no Dicionário Aberto.`
      );
    }
    if (!response.ok) {
      throw new ProviderUnavailableError(
        this.metadata.id,
        response.status,
        `Dicionário Aberto HTTP ${response.status}: ${response.statusText}`
      );
    }

    return await response.json();
  }

  protected normalize(raw: unknown, input: DictionaryInput): NormalizedDictionaryEntry {
    const entries = raw as RawDicionarioAbertoEntry[];
    if (!Array.isArray(entries) || entries.length === 0) {
      throw new ProviderUnavailableError(
        this.metadata.id,
        404,
        `Nenhuma definição encontrada para "${input.word}".`
      );
    }

    const meanings: NormalizedDictionaryMeaning[] = [];
    let etymology: string | undefined;

    for (const item of entries) {
      const xml = item.xml || '';
      
      // Extract part of speech from <gramGrp>...</gramGrp>
      const gramMatch = xml.match(/<gramGrp>([\s\S]*?)<\/gramGrp>/i);
      const gramGrp = gramMatch ? this.stripXml(gramMatch[1]).trim() : 'substantivo/verbo';

      // Extract definitions from <def>...</def>
      const defMatches = xml.matchAll(/<def>([\s\S]*?)<\/def>/gi);
      const defs: string[] = [];
      for (const m of defMatches) {
        const cleaned = this.stripXml(m[1]).trim();
        if (cleaned) defs.push(cleaned);
      }

      // If no <def> tags, strip full XML text as definition
      if (defs.length === 0) {
        const fullClean = this.stripXml(xml).trim();
        if (fullClean) defs.push(fullClean);
      }

      // Extract etymology from <etym>...</etym>
      if (!etymology) {
        const etymMatch = xml.match(/<etym>([\s\S]*?)<\/etym>/i);
        if (etymMatch) {
          etymology = this.stripXml(etymMatch[1]).trim();
        }
      }

      meanings.push({
        partOfSpeech: gramGrp || 'pt',
        definitions: defs,
      });
    }

    return {
      word: entries[0].word || input.word,
      language: 'pt',
      meanings: meanings.length > 0 ? meanings : [
        {
          partOfSpeech: 'termo',
          definitions: [`Termo registrado no léxico de língua portuguesa.`],
        },
      ],
      etymology,
      provider: this.metadata.id,
      sourceUrl: `https://dicionario-aberto.net/search/${encodeURIComponent(input.word)}`,
    };
  }

  protected getFallback(input: DictionaryInput, _error: unknown): NormalizedDictionaryEntry {
    const q = input.word.trim().toLowerCase();

    // 1. Check ptVocabulary
    const vocMatch = ptVocabulary.find(v => v.lemma.toLowerCase() === q);
    if (vocMatch) {
      return {
        word: vocMatch.lemma,
        language: 'pt',
        phonetic: vocMatch.phonetic_ipa,
        meanings: [
          {
            partOfSpeech: vocMatch.part_of_speech,
            definitions: [
              vocMatch.definition_target,
              vocMatch.definition_en ? `EN: ${vocMatch.definition_en}` : '',
            ].filter(Boolean),
            examples: [vocMatch.example_sentence_target],
          },
        ],
        provider: 'offline-seed',
      };
    }

    // 2. Check trilingualDictionary
    const triMatch = trilingualDictionary.find(t => t.portuguese.toLowerCase() === q);
    if (triMatch) {
      return {
        word: triMatch.portuguese,
        language: 'pt',
        phonetic: triMatch.phonetic_pt,
        meanings: [
          {
            partOfSpeech: triMatch.part_of_speech,
            definitions: [
              `EN: ${triMatch.english}`,
              `ES: ${triMatch.spanish}`,
            ],
            examples: [triMatch.example_pt],
          },
        ],
        provider: 'offline-seed',
      };
    }

    return {
      word: input.word,
      language: 'pt',
      meanings: [
        {
          partOfSpeech: 'termo',
          definitions: ['Definição indisponível offline no momento.'],
        },
      ],
      provider: 'fallback',
    };
  }

  private stripXml(xml: string): string {
    return xml
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }
}
