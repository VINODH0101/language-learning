/**
 * Wikimedia Commons Media Provider
 * Searches freely usable media files with rigorous attribution and licensing metadata.
 * https://commons.wikimedia.org/
 */

import { BaseProvider } from '../baseProvider';
import { ProviderMetadata, ValidationError } from '../types';
import { normalizeMediaItem, NormalizedMediaItem } from '../../normalization/responseNormalizers';

export interface MediaSearchInput {
  query: string;
  mediaType?: 'image' | 'audio';
  limit?: number;
}

export class WikimediaCommonsProvider extends BaseProvider<MediaSearchInput, NormalizedMediaItem[]> {
  public readonly metadata: ProviderMetadata = {
    id: 'wikimedia_commons',
    name: 'Wikimedia Commons Media Archive',
    description: 'Freely usable database of educational illustrations, diagrams, and native audio recordings.',
    category: 'media',
    attribution: 'Wikimedia Commons — Wikimedia Foundation (CC-BY / CC-BY-SA / Public Domain)',
    attributionUrl: 'https://commons.wikimedia.org',
    license: 'Individual File Licenses Apply',
    isPaid: false,
    requiresKey: false,
  };

  protected validateInput(input: MediaSearchInput): void {
    if (!input.query || input.query.trim().length === 0) {
      throw new ValidationError(this.metadata.id, 'Termo para busca de mídia não pode estar vazio.');
    }
  }

  protected generateCacheKey(input: MediaSearchInput): string {
    return `${input.mediaType || 'image'}:${input.query.trim().toLowerCase()}`;
  }

  protected async fetchRaw(input: MediaSearchInput, signal: AbortSignal): Promise<unknown> {
    const encoded = encodeURIComponent(input.query.trim());
    const limit = input.limit || 8;
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encoded}&gsrlimit=${limit}&prop=imageinfo&iiprop=url|extmetadata|dimensions&format=json&origin=*`;

    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new Error(`Wikimedia Commons HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  protected normalize(raw: any, input: MediaSearchInput): NormalizedMediaItem[] {
    const pages = raw?.query?.pages || {};
    const items: NormalizedMediaItem[] = [];

    for (const pageId of Object.keys(pages)) {
      const page = pages[pageId];
      const imageInfo = page?.imageinfo?.[0];
      if (!imageInfo) continue;

      const metadata = imageInfo.extmetadata || {};
      const author = metadata.Artist?.value?.replace(/<[^>]*>?/gm, '') || 'Autor Desconhecido';
      const license = metadata.LicenseShortName?.value || 'CC-BY-SA';
      const licenseUrl = metadata.LicenseUrl?.value;
      const credit = metadata.Credit?.value?.replace(/<[^>]*>?/gm, '') || author;

      items.push(
        normalizeMediaItem(
          `commons-${pageId}`,
          page.title.replace(/^File:/, ''),
          input.mediaType || 'image',
          imageInfo.url,
          author,
          license,
          `${credit} (${license}) via Wikimedia Commons`,
          this.metadata.id,
          {
            thumbnailUrl: imageInfo.thumburl || imageInfo.url,
            licenseUrl,
          }
        )
      );
    }

    return items;
  }
}
