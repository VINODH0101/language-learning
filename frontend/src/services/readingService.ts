/**
 * Unified Reading & Cultural Exploration Service.
 * Bridges Wikipedia REST API, Jikan Culture API, and Curated Cultural Catalogs.
 */

import { WikipediaAdapter } from '../integrations/external-apis/adapters/wikipedia/WikipediaAdapter';
import { JikanAdapter } from '../integrations/external-apis/adapters/jikan/JikanAdapter';
import {
  NormalizedReadingArticle,
  NormalizedCulturalEntity,
} from '../integrations/external-apis/core/types';
import { CultureService } from './cultureService';
import { CulturalArticle } from '../types/culture';

const wikipediaAdapter = new WikipediaAdapter();
const jikanAdapter = new JikanAdapter();

export class ReadingService {
  /**
   * Fetch authentic daily reading material from Wikipedia.
   */
  public static async getDailyReading(
    language: 'pt' | 'es' | 'en',
    limit = 4
  ): Promise<NormalizedReadingArticle[]> {
    return await wikipediaAdapter.execute({
      language,
      limit,
    });
  }

  /**
   * Search Wikipedia for an authentic article by title/subject.
   */
  public static async searchWikipediaArticle(
    query: string,
    language: 'pt' | 'es' | 'en'
  ): Promise<NormalizedReadingArticle[]> {
    return await wikipediaAdapter.execute({
      query,
      language,
    });
  }

  /**
   * Fetch cultural narratives, character profiles, and reading passages from Jikan.
   */
  public static async getCulturalEntities(
    query = 'Miyazaki'
  ): Promise<NormalizedCulturalEntity[]> {
    return await jikanAdapter.execute({ query });
  }

  /**
   * Retrieve curated cultural catalog articles with filtering.
   */
  public static getCuratedArticles(): CulturalArticle[] {
    return CultureService.getAllArticles();
  }
}
