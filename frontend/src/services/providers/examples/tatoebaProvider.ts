/**
 * Tatoeba Example Sentences Provider
 * Open collaborative database of example sentences and audio recordings.
 * https://tatoeba.org/
 */

import { BaseProvider } from '../baseProvider';
import { ProviderMetadata, ValidationError } from '../types';
import { TatoebaSearchResponseSchema } from '../../validation/schemas';
import { normalizeSentencePair, NormalizedSentencePair } from '../../normalization/responseNormalizers';

export interface TatoebaSearchInput {
  query: string;
  sourceLang: string;
  targetLang: string;
  limit?: number;
}

export class TatoebaProvider extends BaseProvider<TatoebaSearchInput, NormalizedSentencePair[]> {
  public readonly metadata: ProviderMetadata = {
    id: 'tatoeba',
    name: 'Tatoeba Project',
    description: 'Community-driven database of example sentences, translations, and audio recordings.',
    category: 'examples',
    attribution: 'Tatoeba Project — Creative Commons Attribution 2.0 France (CC-BY 2.0 FR)',
    attributionUrl: 'https://tatoeba.org',
    license: 'CC-BY 2.0 FR',
    isPaid: false,
    requiresKey: false,
  };

  protected validateInput(input: TatoebaSearchInput): void {
    if (!input.query || input.query.trim().length === 0) {
      throw new ValidationError(this.metadata.id, 'Termo de busca para sentenças não pode estar vazio.');
    }
    if (!input.sourceLang || !input.targetLang) {
      throw new ValidationError(this.metadata.id, 'Idiomas de origem e destino são obrigatórios.');
    }
  }

  protected generateCacheKey(input: TatoebaSearchInput): string {
    return `${input.sourceLang}:${input.targetLang}:${input.query.trim().toLowerCase()}`;
  }

  protected async fetchRaw(input: TatoebaSearchInput, signal: AbortSignal): Promise<unknown> {
    const encoded = encodeURIComponent(input.query.trim());
    const url = `https://tatoeba.org/en/api_v0/search?from=${input.sourceLang}&to=${input.targetLang}&query=${encoded}&trans_filter=limit&trans_to=${input.targetLang}`;

    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new Error(`Tatoeba HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  protected normalize(raw: any, input: TatoebaSearchInput): NormalizedSentencePair[] {
    const parsed = TatoebaSearchResponseSchema.parse(raw);
    const limit = input.limit || 5;
    const pairs: NormalizedSentencePair[] = [];

    for (const result of parsed.results.slice(0, limit)) {
      const targetTranslation = result.translations?.[0]?.[0]?.text;
      if (targetTranslation) {
        const audioUrl = result.audio?.[0]?.url;
        pairs.push(
          normalizeSentencePair(
            `tatoeba-${result.id}`,
            result.text,
            targetTranslation,
            input.sourceLang,
            input.targetLang,
            this.metadata.id,
            this.metadata.attribution,
            this.metadata.license || 'CC-BY 2.0 FR',
            {
              isPedagogicallyVerified: true,
              audioUrl,
            }
          )
        );
      }
    }

    return pairs;
  }
}
