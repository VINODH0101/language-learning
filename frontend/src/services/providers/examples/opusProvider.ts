/**
 * OPUS Parallel Corpus Provider
 * Accesses open parallel corpora (e.g. OpenSubtitles, MultiUN, Books) for sentence alignment.
 * https://opus.nlpl.eu/
 */

import { BaseProvider } from '../baseProvider';
import { ProviderMetadata, ValidationError } from '../types';
import { OpusSentencePairSchema } from '../../validation/schemas';
import { normalizeSentencePair, NormalizedSentencePair } from '../../normalization/responseNormalizers';

export interface OpusSearchInput {
  query: string;
  sourceLang: string;
  targetLang: string;
  corpus?: string;
  limit?: number;
}

export class OpusProvider extends BaseProvider<OpusSearchInput, NormalizedSentencePair[]> {
  public readonly metadata: ProviderMetadata = {
    id: 'opus_corpus',
    name: 'OPUS Open Parallel Corpora',
    description: 'Massive open-source collection of translated texts with sentence alignment.',
    category: 'examples',
    attribution: 'OPUS — Open Parallel Corpus (Tiedemann, 2012)',
    attributionUrl: 'https://opus.nlpl.eu',
    license: 'Corpus-Dependent (Open Data / CC-BY / CC0)',
    isPaid: false,
    requiresKey: false,
  };

  protected validateInput(input: OpusSearchInput): void {
    if (!input.query || input.query.trim().length === 0) {
      throw new ValidationError(this.metadata.id, 'Termo para busca no corpus não pode estar vazio.');
    }
    if (!input.sourceLang || !input.targetLang) {
      throw new ValidationError(this.metadata.id, 'Pares de idiomas de origem e destino são necessários.');
    }
  }

  protected generateCacheKey(input: OpusSearchInput): string {
    return `${input.sourceLang}:${input.targetLang}:${input.corpus || 'all'}:${input.query.trim().toLowerCase()}`;
  }

  protected async fetchRaw(input: OpusSearchInput, signal: AbortSignal): Promise<unknown> {
    const corpus = input.corpus || 'Books';
    const encoded = encodeURIComponent(input.query.trim());
    // Public OPUS API search endpoint
    const url = `https://opus.nlpl.eu/opusapi/?source=${input.sourceLang}&target=${input.targetLang}&corpus=${corpus}&query=${encoded}`;

    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new Error(`OPUS API HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  protected normalize(raw: any, input: OpusSearchInput): NormalizedSentencePair[] {
    const results = Array.isArray(raw?.results) ? raw.results : [];
    const limit = input.limit || 5;
    const pairs: NormalizedSentencePair[] = [];

    for (let i = 0; i < Math.min(results.length, limit); i++) {
      const item = results[i];
      if (item?.source && item?.target) {
        // Enforce Invariant: Never mark raw OPUS corpus data as pedagogically verified without review
        pairs.push(
          normalizeSentencePair(
            `opus-${input.corpus || 'books'}-${i}`,
            item.source,
            item.target,
            input.sourceLang,
            input.targetLang,
            this.metadata.id,
            `${this.metadata.attribution} (${item.corpus || 'Corpus'})`,
            'Open Corpus License (Unreviewed)',
            {
              isPedagogicallyVerified: false,
            }
          )
        );
      }
    }

    return pairs;
  }
}
