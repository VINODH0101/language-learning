/**
 * Wikipedia REST API Adapter for authentic reading comprehension articles.
 * Supported languages: pt, es, en
 * Endpoints:
 * - Summary: https://{lang}.wikipedia.org/api/rest_v1/page/summary/{title}
 * - On This Day: https://{lang}.wikipedia.org/api/rest_v1/feed/onthisday/all/{month}/{day}
 */

import {
  BaseApiProvider,
  ReadingInput,
  NormalizedReadingArticle,
  ProviderMetadata,
  ValidationError,
  ProviderUnavailableError,
} from '../../core';
import { CULTURAL_CATALOG } from '../../../../data/cultureData';

interface RawWikiSummary {
  title: string;
  extract: string;
  description?: string;
  thumbnail?: {
    source: string;
  };
  content_urls?: {
    desktop?: {
      page: string;
    };
  };
  timestamp?: string;
}

interface RawOnThisDayEvent {
  text: string;
  year: number;
  pages?: RawWikiSummary[];
}

export class WikipediaAdapter extends BaseApiProvider<ReadingInput, NormalizedReadingArticle[]> {
  public readonly metadata: ProviderMetadata = {
    id: 'wikipedia',
    name: 'Wikimedia REST API',
    description: 'Authentic reading comprehension material and historical events from Wikipedia in PT, ES, and EN.',
    type: 'reading',
    attribution: 'Wikipedia (Wikimedia Foundation) — Creative Commons Attribution-ShareAlike 4.0 (CC BY-SA 4.0)',
    attributionUrl: 'https://www.wikimedia.org',
    isPaid: false,
    requiresKey: false,
    rateLimitInfo: {
      maxRequests: 20,
      windowMs: 1000,
    },
  };

  protected validateInput(input: ReadingInput): void {
    const lang = input.language ? input.language.toLowerCase() : 'en';
    if (!['pt', 'es', 'en'].includes(lang)) {
      throw new ValidationError(
        this.metadata.id,
        `Idioma de leitura não suportado: ${input.language}. Use 'pt', 'es' ou 'en'.`
      );
    }
  }

  protected generateCacheKey(input: ReadingInput): string {
    const lang = input.language.toLowerCase();
    const q = (input.query || 'featured').toLowerCase().trim();
    const date = input.date || '';
    return `${lang}:${q}:${date}`;
  }

  protected async fetchRaw(input: ReadingInput): Promise<unknown> {
    const lang = input.language.toLowerCase();

    // If a specific query/title is passed, fetch article summary
    if (input.query && input.query.trim().length > 0) {
      const title = encodeURIComponent(input.query.trim());
      const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${title}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new ProviderUnavailableError(
          this.metadata.id,
          res.status,
          `Wikipedia summary error (${res.status}): ${res.statusText}`
        );
      }
      const data = await res.json();
      return [data];
    }

    // Otherwise, fetch "On this day" historical events for authentic daily reading
    const now = new Date();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const url = `https://${lang}.wikipedia.org/api/rest_v1/feed/onthisday/all/${month}/${day}`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new ProviderUnavailableError(
        this.metadata.id,
        res.status,
        `Wikipedia feed error (${res.status}): ${res.statusText}`
      );
    }
    return await res.json();
  }

  protected normalize(raw: unknown, input: ReadingInput): NormalizedReadingArticle[] {
    const lang = input.language.toLowerCase();
    const articles: NormalizedReadingArticle[] = [];

    // Case 1: Single summary array
    if (Array.isArray(raw)) {
      for (const item of raw as RawWikiSummary[]) {
        if (!item.title || !item.extract) continue;
        articles.push(this.formatArticle(item, lang));
      }
      return articles;
    }

    // Case 2: On this day feed object
    const feed = raw as {
      selected?: RawOnThisDayEvent[];
      events?: RawOnThisDayEvent[];
    };

    const eventList = feed.selected || feed.events || [];
    const maxItems = input.limit || 5;

    for (const event of eventList.slice(0, maxItems)) {
      const page = event.pages?.[0];
      const title = page?.title || `Fato Histórico (${event.year})`;
      const summary = event.text || page?.extract || '';
      if (!summary) continue;

      articles.push({
        id: `wiki-${lang}-${event.year}-${encodeURIComponent(title)}`,
        title: `${event.year}: ${title}`,
        language: lang,
        summary: page?.description || `Acontecimento histórico no ano de ${event.year}.`,
        contentParagraphs: [
          summary,
          page?.extract && page.extract !== summary ? page.extract : '',
        ].filter(Boolean),
        thumbnailUrl: page?.thumbnail?.source,
        sourceUrl: page?.content_urls?.desktop?.page || `https://${lang}.wikipedia.org`,
        estimatedCefrLevel: this.estimateCefrLevel(summary),
        category: 'História & Cultura',
        publishedAt: `${event.year}`,
        provider: this.metadata.id,
        attribution: this.metadata.attribution,
      });
    }

    return articles;
  }

  protected getFallback(input: ReadingInput, _error: unknown): NormalizedReadingArticle[] {
    const lang = input.language.toLowerCase();
    
    // Fall back to matching curated cultural catalog articles
    const matched = CULTURAL_CATALOG.filter(c => c.content_language === lang);
    return matched.slice(0, input.limit || 4).map(c => ({
      id: c.id,
      title: c.title,
      language: c.content_language,
      summary: c.summary,
      contentParagraphs: c.content_paragraphs,
      thumbnailUrl: c.image_url,
      estimatedCefrLevel: c.cefr_level,
      category: c.topic,
      provider: 'culture-catalog-seed',
      attribution: 'Polyglot C1 Open Curated Library',
    }));
  }

  private formatArticle(item: RawWikiSummary, lang: string): NormalizedReadingArticle {
    return {
      id: `wiki-${lang}-${encodeURIComponent(item.title)}`,
      title: item.title,
      language: lang,
      summary: item.description || item.extract.slice(0, 160) + '...',
      contentParagraphs: [item.extract],
      thumbnailUrl: item.thumbnail?.source,
      sourceUrl: item.content_urls?.desktop?.page,
      estimatedCefrLevel: this.estimateCefrLevel(item.extract),
      category: 'Artigo Autêntico',
      publishedAt: item.timestamp,
      provider: this.metadata.id,
      attribution: this.metadata.attribution,
    };
  }

  private estimateCefrLevel(text: string): string {
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length === 0) return 'B1';
    const avgLen = words.reduce((acc, w) => acc + w.length, 0) / words.length;
    if (avgLen > 6.2) return 'C1';
    if (avgLen > 5.2) return 'B2';
    return 'B1';
  }
}
