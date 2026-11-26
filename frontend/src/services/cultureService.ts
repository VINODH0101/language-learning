import {
  CulturalArticle,
  CultureFilterState,
  CultureRegion,
  CultureTopic,
} from '../types/culture';
import { Language } from '../types';
import {
  saveCulturalBookmark,
  deleteCulturalBookmark,
  getCulturalBookmarks,
  isCulturalBookmarked,
  CulturalBookmarkRecord,
  getCachedApiResponse,
  setCachedApiResponse,
} from './localDb';
import { syncEngine } from './syncEngine';
import { contentAccess } from './contentAccess';
import { WikipediaAdapter } from '../integrations/external-apis/adapters/wikipedia/WikipediaAdapter';

const dynamicArticlesStore = new Map<string, CulturalArticle>();
const wikipediaAdapter = new WikipediaAdapter();
const CULTURE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export class CultureService {
  /**
   * Registers dynamically loaded or AI-generated cultural articles into active memory.
   */
  static setDynamicArticles(articles: CulturalArticle[]): void {
    for (const art of articles) {
      dynamicArticlesStore.set(art.id, art);
    }
  }

  /**
   * Clears dynamic in-memory cultural article store.
   */
  static clearDynamicArticles(): void {
    dynamicArticlesStore.clear();
  }

  /**
   * Loads live cultural articles from:
   * 1) IndexedDB cached API articles
   * 2) AI Content Engine published cultural articles
   * 3) Wikipedia Open REST API daily cultural/historical feed
   */
  static async loadLiveArticles(
    targetLang?: Language,
    query?: string
  ): Promise<CulturalArticle[]> {
    const langKey = targetLang || 'all';
    const cacheKey = `culture_articles:${langKey}`;

    // 1. Hydrate any cached articles from IndexedDB for offline readiness
    try {
      const cached = (await getCachedApiResponse(
        'culture_service',
        cacheKey
      )) as CulturalArticle[] | null;
      if (Array.isArray(cached) && cached.length > 0) {
        this.setDynamicArticles(cached);
      }
    } catch {
      // IndexedDB unavailable in some environments
    }

    // 2. Fetch published AI Content Engine cultural articles
    try {
      const aiArticles = await contentAccess.getPublishedCulturalArticles(targetLang);
      if (aiArticles.length > 0) {
        this.setDynamicArticles(aiArticles);
      }
    } catch {
      // Optional offline / unconfigured backend
    }

    // 3. Fetch live Wikipedia articles (if targetLang specified or default en/pt/es)
    const wikiLangs: Language[] = targetLang ? [targetLang] : ['en', 'pt', 'es'];
    for (const wl of wikiLangs) {
      try {
        const wikiFeed = await wikipediaAdapter.execute({
          language: wl,
          query: query?.trim() || undefined,
          limit: 6,
        });
        const mapped: CulturalArticle[] = wikiFeed.map(item => ({
          id: item.id,
          title: item.title,
          summary: item.summary,
          content_paragraphs: item.contentParagraphs,
          content_language: wl,
          target_learning_language: wl,
          origin_country: 'International',
          origin_region: 'Global',
          topic: 'history',
          content_type: 'external_article',
          cefr_level: (item.estimatedCefrLevel as CulturalArticle['cefr_level']) || 'B2',
          read_time_minutes: Math.max(1, Math.ceil(item.contentParagraphs.join(' ').split(/\s+/).length / 130)),
          tags: [item.category || 'Wikipedia', wl],
          source_url: item.sourceUrl || `https://${wl}.wikipedia.org`,
          publisher: item.provider === 'wikipedia' ? 'Wikipedia REST API' : item.provider,
          published_at: item.publishedAt || new Date().toISOString(),
          license: 'CC-BY-SA 4.0',
          attribution_text: item.attribution || 'Wikipedia — CC-BY-SA 4.0',
          image_url: item.thumbnailUrl,
        }));
        if (mapped.length > 0) {
          this.setDynamicArticles(mapped);
        }
      } catch {
        // Offline / rate-limited
      }
    }

    const result = this.getAllArticles();
    try {
      if (result.length > 0) {
        await setCachedApiResponse('culture_service', cacheKey, result, CULTURE_CACHE_TTL_MS);
      }
    } catch {
      // Ignore cache error
    }

    return targetLang
      ? result.filter(a => a.content_language === targetLang)
      : result;
  }

  /**
   * Retrieve all currently loaded/cached cultural articles (zero static seeds).
   */
  static getAllArticles(): CulturalArticle[] {
    return Array.from(dynamicArticlesStore.values());
  }

  /**
   * Retrieve a single article by ID.
   */
  static getArticleById(id: string): CulturalArticle | undefined {
    return dynamicArticlesStore.get(id);
  }

  /**
   * Strictly filters cultural articles matching all criteria.
   */
  static filterArticles(filters: CultureFilterState): CulturalArticle[] {
    return this.getAllArticles().filter(article => {
      if (filters.origin_country && filters.origin_country !== 'all') {
        if (article.origin_country.toLowerCase() !== filters.origin_country.toLowerCase()) {
          return false;
        }
      }

      if (filters.origin_region && filters.origin_region !== 'all') {
        if (article.origin_region !== filters.origin_region) {
          return false;
        }
      }

      if (filters.content_language && filters.content_language !== 'all') {
        if (article.content_language !== filters.content_language) {
          return false;
        }
      }

      if (filters.cefr_level && filters.cefr_level !== 'all') {
        if (article.cefr_level !== filters.cefr_level) {
          return false;
        }
      }

      if (filters.topic && filters.topic !== 'all') {
        if (article.topic !== filters.topic) {
          return false;
        }
      }

      if (filters.content_type && filters.content_type !== 'all') {
        if (article.content_type !== filters.content_type) {
          return false;
        }
      }

      if (filters.search_query && filters.search_query.trim().length > 0) {
        const q = filters.search_query.toLowerCase().trim();
        const matchesTitle = article.title.toLowerCase().includes(q);
        const matchesSummary = article.summary.toLowerCase().includes(q);
        const matchesTags = article.tags.some(t => t.toLowerCase().includes(q));
        const matchesCountry = article.origin_country.toLowerCase().includes(q);
        const matchesContent = article.content_paragraphs.some(p => p.toLowerCase().includes(q));
        const matchesGlossary = article.glossary
          ? Object.entries(article.glossary).some(
              ([k, v]) => k.toLowerCase().includes(q) || v.toLowerCase().includes(q)
            )
          : false;

        if (
          !matchesTitle &&
          !matchesSummary &&
          !matchesTags &&
          !matchesCountry &&
          !matchesContent &&
          !matchesGlossary
        ) {
          return false;
        }
      }

      return true;
    });
  }

  static getAvailableCountries(): string[] {
    const set = new Set<string>();
    this.getAllArticles().forEach(a => set.add(a.origin_country));
    return Array.from(set).sort();
  }

  static getAvailableRegions(): CultureRegion[] {
    const set = new Set<CultureRegion>();
    this.getAllArticles().forEach(a => set.add(a.origin_region));
    return Array.from(set).sort();
  }

  static getAvailableTopics(): CultureTopic[] {
    const set = new Set<CultureTopic>();
    this.getAllArticles().forEach(a => set.add(a.topic));
    return Array.from(set).sort();
  }

  static async isBookmarked(userId: string, articleId: string): Promise<boolean> {
    return await isCulturalBookmarked(userId, articleId);
  }

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

  static async getUserBookmarks(userId: string): Promise<CulturalBookmarkRecord[]> {
    return await getCulturalBookmarks(userId);
  }

  static async getBookmarkedArticles(userId: string): Promise<CulturalArticle[]> {
    const bookmarks = await getCulturalBookmarks(userId);
    const idSet = new Set(bookmarks.map(b => b.article_id));
    return this.getAllArticles().filter(a => idSet.has(a.id));
  }
}
