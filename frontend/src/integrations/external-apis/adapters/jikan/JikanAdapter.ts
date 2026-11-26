/**
 * Jikan API Adapter (Japanese Cultural Entities, Anime/Manga Metadata, and Reading Comprehension).
 * Public endpoint: https://api.jikan.moe/v4
 * Rate Limit: Strict 3 requests/sec (handled by RateLimitManager).
 */

import {
  BaseApiProvider,
  CultureInput,
  NormalizedCulturalEntity,
  ProviderMetadata,
  ValidationError,
  ProviderUnavailableError,
} from '../../core';

interface RawJikanCharacter {
  mal_id: number;
  url: string;
  images?: {
    jpg?: {
      image_url?: string;
    };
  };
  name: string;
  name_kanji?: string;
  about?: string;
}

export class JikanAdapter extends BaseApiProvider<CultureInput, NormalizedCulturalEntity[]> {
  public readonly metadata: ProviderMetadata = {
    id: 'jikan',
    name: 'Jikan API (Anime & Manga Culture)',
    description: 'Cultural narratives, character biographies, and cross-cultural reading passages based on MyAnimeList.',
    type: 'culture',
    attribution: 'Jikan Open REST API / MyAnimeList Community',
    attributionUrl: 'https://jikan.moe',
    isPaid: false,
    requiresKey: false,
    rateLimitInfo: {
      maxRequests: 3,
      windowMs: 1000,
    },
  };

  protected validateInput(input: CultureInput): void {
    if (!input.query || input.query.trim().length === 0) {
      throw new ValidationError(this.metadata.id, 'O termo de busca cultural não pode estar vazio.');
    }
  }

  protected generateCacheKey(input: CultureInput): string {
    return `char:${input.query.trim().toLowerCase()}`;
  }

  protected async fetchRaw(input: CultureInput): Promise<unknown> {
    const encoded = encodeURIComponent(input.query.trim());
    const url = `https://api.jikan.moe/v4/characters?q=${encoded}&limit=5`;

    const response = await fetch(url);
    if (response.status === 429) {
      throw new ProviderUnavailableError(
        this.metadata.id,
        429,
        'Jikan API rate limit (3 req/s) atingido. Aguarde alguns segundos.'
      );
    }
    if (!response.ok) {
      throw new ProviderUnavailableError(
        this.metadata.id,
        response.status,
        `Jikan HTTP error ${response.status}: ${response.statusText}`
      );
    }

    return await response.json();
  }

  protected normalize(raw: unknown, input: CultureInput): NormalizedCulturalEntity[] {
    const data = raw as {
      data?: RawJikanCharacter[];
    };

    const characters = data?.data || [];
    if (characters.length === 0) {
      return [];
    }

    return characters.map(char => {
      const cleanAbout = (char.about || 'Biografia cultural contemporânea disponível para estudo de leitura.')
        .replace(/\\n/g, '\n')
        .replace(/\n\n+/g, '\n\n')
        .trim();

      const shortSummary = cleanAbout.split('\n')[0] || char.name;

      // Extract key terms for glossary
      const glossary: Record<string, string> = {
        'Protagonista': 'Personagem principal da narrativa',
        'Narrativa': 'Estrutura do enredo literário ou audiovisual',
        'Motivação': 'Impulso psicológico do personagem',
      };

      return {
        id: `jikan-${char.mal_id}`,
        title: char.name,
        japaneseTitle: char.name_kanji,
        summary: shortSummary,
        imageUrl: char.images?.jpg?.image_url,
        category: 'Cultura Contemporânea & Animação',
        readingPassage: cleanAbout,
        glossary,
        cefrLevel: 'B2',
        sourceUrl: char.url,
        provider: this.metadata.id,
      };
    });
  }
}
