/**
 * Open Library Metadata Provider
 * Provides book discovery, subject taxonomy, and author bibliographies.
 * https://openlibrary.org/developers/api
 */

import { BaseProvider } from '../baseProvider';
import { ProviderMetadata, ValidationError } from '../types';
import { OpenLibrarySearchResponseSchema } from '../../validation/schemas';
import { normalizeBook, NormalizedBook } from '../../normalization/responseNormalizers';

export interface OpenLibrarySearchInput {
  query: string;
  language?: string;
  limit?: number;
}

export class OpenLibraryProvider extends BaseProvider<OpenLibrarySearchInput, NormalizedBook[]> {
  public readonly metadata: ProviderMetadata = {
    id: 'open_library',
    name: 'Open Library (Internet Archive)',
    description: 'Universal catalog of books, author metadata, and library records.',
    category: 'reading',
    attribution: 'Open Library — Internet Archive (Open Data)',
    attributionUrl: 'https://openlibrary.org',
    license: 'CC0 / Public Domain Metadata',
    isPaid: false,
    requiresKey: false,
  };

  protected validateInput(input: OpenLibrarySearchInput): void {
    if (!input.query || input.query.trim().length === 0) {
      throw new ValidationError(this.metadata.id, 'Termo para busca de livros não pode estar vazio.');
    }
  }

  protected generateCacheKey(input: OpenLibrarySearchInput): string {
    return `${input.language || 'all'}:${input.query.trim().toLowerCase()}`;
  }

  protected async fetchRaw(input: OpenLibrarySearchInput, signal: AbortSignal): Promise<unknown> {
    const encoded = encodeURIComponent(input.query.trim());
    const limit = input.limit || 10;
    let url = `https://openlibrary.org/search.json?q=${encoded}&limit=${limit}`;
    if (input.language) {
      url += `&language=${input.language}`;
    }

    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new Error(`Open Library HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  protected normalize(raw: any, _input: OpenLibrarySearchInput): NormalizedBook[] {
    const parsed = OpenLibrarySearchResponseSchema.parse(raw);
    const books: NormalizedBook[] = [];

    for (const doc of parsed.docs) {
      const coverUrl = doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : undefined;
      books.push(
        normalizeBook(
          `ol-${doc.key.replace(/\//g, '-')}`,
          doc.title,
          doc.author_name || ['Autor Desconhecido'],
          doc.language || [],
          this.metadata.id,
          doc.public_scan_b ?? false,
          {
            coverUrl,
            readableFormatUrl: doc.has_fulltext ? `https://archive.org/details/${doc.key}` : undefined,
          }
        )
      );
    }

    return books;
  }
}
