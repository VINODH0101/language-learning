import { CULTURAL_CATALOG } from '../data/cultureData';
import {
  CulturalArticle,
  CultureFilterState,
  CultureRegion,
  CultureTopic,
} from '../types/culture';
import {
  saveCulturalBookmark,
  deleteCulturalBookmark,
  getCulturalBookmarks,
  isCulturalBookmarked,
  CulturalBookmarkRecord,
} from './localDb';
import { syncEngine } from './syncEngine';

export class CultureService {
  /**
   * Retrieve all seed cultural articles.
   */
  static getAllArticles(): CulturalArticle[] {
    return [...CULTURAL_CATALOG];
  }

  /**
   * Retrieve an article by its unique ID.
   */
  static getArticleById(id: string): CulturalArticle | undefined {
    return CULTURAL_CATALOG.find(a => a.id === id);
  }

  /**
   * Filter articles strictly matching all specified criteria.
   * NEVER silently substitute unmatched queries with random English content.
   */
  static filterArticles(filters: CultureFilterState): CulturalArticle[] {
    return CULTURAL_CATALOG.filter(article => {
      // 1. Origin Country Filter
      if (
        filters.origin_country &&
        filters.origin_country.trim() !== '' &&
        filters.origin_country.toLowerCase() !== 'all'
      ) {
        if (article.origin_country.toLowerCase() !== filters.origin_country.toLowerCase()) {
          return false;
        }
      }

      // 2. Origin Region Filter
      if (filters.origin_region && filters.origin_region !== 'all') {
        if (article.origin_region !== filters.origin_region) {
          return false;
        }
      }

      // 3. Content Language Filter (Crucial: independent from origin country)
      if (filters.content_language && filters.content_language !== 'all') {
        if (article.content_language !== filters.content_language) {
          return false;
        }
      }

      // 4. CEFR Level Filter
      if (filters.cefr_level && filters.cefr_level !== 'all') {
        if (article.cefr_level !== filters.cefr_level) {
          return false;
        }
      }

      // 5. Topic Filter
      if (filters.topic && filters.topic !== 'all') {
        if (article.topic !== filters.topic) {
          return false;
        }
      }

      // 6. Content Type Filter
      if (filters.content_type && filters.content_type !== 'all') {
        if (article.content_type !== filters.content_type) {
          return false;
        }
      }

      // 7. Full-text Search Query
      if (filters.search_query && filters.search_query.trim() !== '') {
        const query = filters.search_query.toLowerCase().trim();
        const matchesTitle = article.title.toLowerCase().includes(query);
        const matchesSummary = article.summary.toLowerCase().includes(query);
        const matchesCountry = article.origin_country.toLowerCase().includes(query);
        const matchesTags = article.tags.some(tag => tag.toLowerCase().includes(query));
        const matchesContent = article.content_paragraphs.some(p => p.toLowerCase().includes(query));
        const matchesGlossary = article.glossary
          ? Object.keys(article.glossary).some(k => k.toLowerCase().includes(query))
          : false;

        if (
          !matchesTitle &&
          !matchesSummary &&
          !matchesCountry &&
          !matchesTags &&
          !matchesContent &&
          !matchesGlossary
        ) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Get distinct list of origin countries present in the catalog.
   */
  static getAvailableCountries(): string[] {
    const set = new Set<string>();
    CULTURAL_CATALOG.forEach(a => set.add(a.origin_country));
    return Array.from(set).sort();
  }

  /**
   * Get distinct list of origin regions.
   */
  static getAvailableRegions(): CultureRegion[] {
    const set = new Set<CultureRegion>();
    CULTURAL_CATALOG.forEach(a => set.add(a.origin_region));
    return Array.from(set).sort();
  }

  /**
   * Get distinct list of cultural topics.
   */
  static getAvailableTopics(): CultureTopic[] {
    const set = new Set<CultureTopic>();
    CULTURAL_CATALOG.forEach(a => set.add(a.topic));
    return Array.from(set).sort();
  }

  /**
   * Check if an article is bookmarked by the user.
   */
  static async isBookmarked(userId: string, articleId: string): Promise<boolean> {
    return await isCulturalBookmarked(userId, articleId);
  }

  /**
   * Toggle bookmark status for an article.
   * Returns true if article is now bookmarked, false if unbookmarked.
   */
  static async toggleBookmark(userId: string, article: CulturalArticle): Promise<boolean> {
    const currentlySaved = await isCulturalBookmarked(userId, article.id);

    if (currentlySaved) {
      await deleteCulturalBookmark(userId, article.id);
      if (userId && userId !== 'guest') {
        syncEngine.queueAction('DELETE_CULTURAL_BOOKMARK', { article_id: article.id }, userId).catch(() => {});
      }
      return false;
    } else {
      const record: CulturalBookmarkRecord = {
        id: `${userId}_${article.id}`,
        user_id: userId,
        article_id: article.id,
        article_title: article.title,
        content_language: article.content_language,
        origin_country: article.origin_country,
        topic: article.topic,
        cefr_level: article.cefr_level,
        created_at: new Date().toISOString(),
      };
      await saveCulturalBookmark(record);
      if (userId && userId !== 'guest') {
        syncEngine.queueAction('SYNC_CULTURAL_BOOKMARK', record, userId).catch(() => {});
      }
      return true;
    }
  }

  /**
   * Retrieve all saved bookmarks for a given user.
   */
  static async getUserBookmarks(userId: string): Promise<CulturalBookmarkRecord[]> {
    return await getCulturalBookmarks(userId);
  }

  /**
   * Get articles matching saved bookmark records.
   */
  static async getBookmarkedArticles(userId: string): Promise<CulturalArticle[]> {
    const bookmarks = await getCulturalBookmarks(userId);
    const idSet = new Set(bookmarks.map(b => b.article_id));
    return CULTURAL_CATALOG.filter(a => idSet.has(a.id));
  }
}
