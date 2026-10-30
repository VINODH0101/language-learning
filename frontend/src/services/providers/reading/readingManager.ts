/**
 * Reading Resources Manager
 * Orchestrates Wikipedia, Gutendex books, and Open Library catalogs.
 */

import { WikipediaReadingProvider, WikipediaReadingInput } from './wikipediaReadingProvider';
import { GutendexProvider, GutendexSearchInput } from './gutendexProvider';
import { OpenLibraryProvider, OpenLibrarySearchInput } from './openLibraryProvider';
import { NormalizedReadingArticle } from '../../../integrations/external-apis/core/types';
import { NormalizedBook } from '../../normalization/responseNormalizers';

export class ReadingManager {
  private static instance: ReadingManager;
  private wiki = new WikipediaReadingProvider();
  private gutendex = new GutendexProvider();
  private openLibrary = new OpenLibraryProvider();

  private constructor() {}

  public static getInstance(): ReadingManager {
    if (!ReadingManager.instance) {
      ReadingManager.instance = new ReadingManager();
    }
    return ReadingManager.instance;
  }

  public async getArticle(input: WikipediaReadingInput): Promise<NormalizedReadingArticle> {
    return await this.wiki.execute(input);
  }

  public async getPublicDomainBooks(input: GutendexSearchInput): Promise<NormalizedBook[]> {
    return await this.gutendex.execute(input);
  }

  public async searchBooks(input: OpenLibrarySearchInput): Promise<NormalizedBook[]> {
    return await this.openLibrary.execute(input);
  }
}
