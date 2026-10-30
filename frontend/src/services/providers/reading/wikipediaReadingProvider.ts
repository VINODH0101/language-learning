/**
 * Wikipedia Reading Provider
 * Fetches featured summaries, lead passages, and cultural articles for reading comprehension.
 * https://www.wikipedia.org/
 */

import { BaseProvider } from '../baseProvider';
import { ProviderMetadata, ValidationError } from '../types';
import { WikipediaSummarySchema } from '../../validation/schemas';
import { NormalizedReadingArticle } from '../../../integrations/external-apis/core/types';

export interface WikipediaReadingInput {
  title: string;
  language: string;
}

export class WikipediaReadingProvider extends BaseProvider<WikipediaReadingInput, NormalizedReadingArticle> {
  public readonly metadata: ProviderMetadata = {
    id: 'wikipedia_reading',
    name: 'Wikipedia REST API',
    description: 'Free encyclopedia providing encyclopedic reading texts, vocabulary in context, and cultural topics.',
    category: 'reading',
    attribution: 'Wikipedia — Wikimedia Foundation (CC-BY-SA 4.0)',
    attributionUrl: 'https://www.wikipedia.org',
    license: 'CC-BY-SA 4.0',
    isPaid: false,
    requiresKey: false,
    supportedLanguages: ['en', 'pt', 'es', 'fr', 'de', 'it', 'ja', 'ko', 'ru', 'nl', 'zh', 'tr', 'ta'],
  };

  protected validateInput(input: WikipediaReadingInput): void {
    if (!input.title || input.title.trim().length === 0) {
      throw new ValidationError(this.metadata.id, 'Título do artigo não pode estar vazio.');
    }
    if (!input.language) {
      throw new ValidationError(this.metadata.id, 'Idioma obrigatório.');
    }
  }

  protected generateCacheKey(input: WikipediaReadingInput): string {
    return `${input.language.toLowerCase()}:${input.title.trim().toLowerCase()}`;
  }

  protected async fetchRaw(input: WikipediaReadingInput, signal: AbortSignal): Promise<unknown> {
    const encoded = encodeURIComponent(input.title.trim().replace(/ /g, '_'));
    const url = `https://${input.language.toLowerCase()}.wikipedia.org/api/rest_v1/page/summary/${encoded}`;

    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new Error(`Wikipedia HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  protected normalize(raw: any, input: WikipediaReadingInput): NormalizedReadingArticle {
    const parsed = WikipediaSummarySchema.parse(raw);
    const paragraphs = parsed.extract
      .split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    return {
      id: `wiki-${input.language}-${encodeURIComponent(parsed.title)}`,
      title: parsed.title,
      language: input.language,
      summary: parsed.description || parsed.extract.slice(0, 150) + '...',
      contentParagraphs: paragraphs,
      thumbnailUrl: parsed.thumbnail?.source,
      sourceUrl: parsed.content_urls?.desktop?.page || `https://${input.language}.wikipedia.org/wiki/${encodeURIComponent(parsed.title)}`,
      estimatedCefrLevel: 'B2',
      provider: this.metadata.id,
      attribution: this.metadata.attribution,
    };
  }
}
