/**
 * Gutendex Reading Provider (Project Gutenberg Public Domain Books)
 * Accesses open classic literature for extensive reading practice.
 * https://gutendex.com/
 */

import { BaseProvider } from '../baseProvider';
import { ProviderMetadata, ValidationError } from '../types';
import { GutendexResponseSchema } from '../../validation/schemas';
import { normalizeBook, NormalizedBook } from '../../normalization/responseNormalizers';

export interface GutendexSearchInput {
  topic?: string;
  language: string;
  author?: string;
  page?: number;
}

export class GutendexProvider extends BaseProvider<GutendexSearchInput, NormalizedBook[]> {
  public readonly metadata: ProviderMetadata = {
    id: 'gutendex',
    name: 'Gutendex (Project Gutenberg)',
    description: 'Public domain classic literature archive with full texts in multiple languages.',
    category: 'reading',
    attribution: 'Project Gutenberg via Gutendex — Public Domain Books',
    attributionUrl: 'https://gutendex.com',
    license: 'Public Domain',
    isPaid: false,
    requiresKey: false,
    supportedLanguages: ['en', 'pt', 'es', 'fr', 'de', 'it', 'nl', 'ru', 'zh'],
  };

  protected validateInput(input: GutendexSearchInput): void {
    if (!input.language) {
      throw new ValidationError(this.metadata.id, 'Idioma para busca de livros obrigatório.');
    }
  }

  protected generateCacheKey(input: GutendexSearchInput): string {
    return `${input.language}:${input.topic || 'all'}:${input.author || 'all'}:${input.page || 1}`;
  }

  protected async fetchRaw(input: GutendexSearchInput, signal: AbortSignal): Promise<unknown> {
    const params = new URLSearchParams({ languages: input.language });
    if (input.topic) params.append('topic', input.topic);
    if (input.author) params.append('search', input.author);
    if (input.page) params.append('page', String(input.page));

    const url = `https://gutendex.com/books/?${params.toString()}`;
    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new Error(`Gutendex HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  protected normalize(raw: any, _input: GutendexSearchInput): NormalizedBook[] {
    const parsed = GutendexResponseSchema.parse(raw);
    const books: NormalizedBook[] = [];

    for (const item of parsed.results) {
      const authors = item.authors.map(a => a.name);
      const textUrl = item.formats['text/plain; charset=utf-8'] || item.formats['text/html'] || item.formats['text/plain'];
      const epubUrl = item.formats['application/epub+zip'];
      const coverUrl = item.formats['image/jpeg'];

      books.push(
        normalizeBook(
          `gutendex-${item.id}`,
          item.title,
          authors,
          item.languages,
          this.metadata.id,
          true,
          {
            subjects: item.subjects,
            coverUrl,
            readableFormatUrl: textUrl,
            epubUrl,
          }
        )
      );
    }

    return books;
  }
}
