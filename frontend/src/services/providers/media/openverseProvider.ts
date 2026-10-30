/**
 * Openverse Media Provider
 * Free cultural images and audio clips indexed across global open repositories.
 * https://openverse.org/
 */

import { BaseProvider } from '../baseProvider';
import { ProviderMetadata, ValidationError } from '../types';
import { OpenverseResponseSchema } from '../../validation/schemas';
import { normalizeMediaItem, NormalizedMediaItem } from '../../normalization/responseNormalizers';

export interface OpenverseSearchInput {
  query: string;
  mediaType?: 'image' | 'audio';
  license?: string;
  limit?: number;
}

export class OpenverseProvider extends BaseProvider<OpenverseSearchInput, NormalizedMediaItem[]> {
  public readonly metadata: ProviderMetadata = {
    id: 'openverse',
    name: 'Openverse (WordPress Foundation)',
    description: 'Search engine for openly licensed media with over 700 million CC-licensed works.',
    category: 'media',
    attribution: 'Openverse — WordPress Foundation (Creative Commons Index)',
    attributionUrl: 'https://openverse.org',
    license: 'Creative Commons / Public Domain',
    isPaid: false,
    requiresKey: false,
  };

  protected validateInput(input: OpenverseSearchInput): void {
    if (!input.query || input.query.trim().length === 0) {
      throw new ValidationError(this.metadata.id, 'Termo para busca de mídia no Openverse não pode estar vazio.');
    }
  }

  protected generateCacheKey(input: OpenverseSearchInput): string {
    return `${input.mediaType || 'image'}:${input.query.trim().toLowerCase()}`;
  }

  protected async fetchRaw(input: OpenverseSearchInput, signal: AbortSignal): Promise<unknown> {
    const type = input.mediaType === 'audio' ? 'audio' : 'images';
    const encoded = encodeURIComponent(input.query.trim());
    const limit = input.limit || 8;
    const url = `https://api.openverse.engineering/v1/${type}/?q=${encoded}&page_size=${limit}`;

    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new Error(`Openverse HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  protected normalize(raw: any, input: OpenverseSearchInput): NormalizedMediaItem[] {
    const parsed = OpenverseResponseSchema.parse(raw);
    const items: NormalizedMediaItem[] = [];

    for (const item of parsed.results) {
      items.push(
        normalizeMediaItem(
          `openverse-${item.id}`,
          item.title,
          input.mediaType || 'image',
          item.url,
          item.creator || 'Autor Desconhecido',
          item.license.toUpperCase(),
          `${item.title} por ${item.creator || 'Desconhecido'} (${item.license.toUpperCase()}) via Openverse`,
          this.metadata.id,
          {
            thumbnailUrl: item.thumbnail || item.url,
            licenseUrl: item.license_url || undefined,
          }
        )
      );
    }

    return items;
  }
}
