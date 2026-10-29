import { describe, it, expect, beforeEach } from 'vitest';
import { CultureService } from '../services/cultureService';
import { clearAllLocalLearningData } from '../services/localDb';
import { translations } from '../i18n/translations';
import { CulturalArticle } from '../types/culture';

describe('Worldwide Culture Discovery & Filtering Engine (cultureService.ts)', () => {
  beforeEach(async () => {
    await clearAllLocalLearningData();
  });

  it('retrieves authentic cultural catalog entries covering multiple continents', () => {
    const all = CultureService.getAllArticles();
    expect(all.length).toBeGreaterThanOrEqual(10);

    const countries = CultureService.getAvailableCountries();
    expect(countries).toContain('Japan');
    expect(countries).toContain('India');
    expect(countries).toContain('Brazil');
    expect(countries).toContain('Mexico');
    expect(countries).toContain('Portugal');
    expect(countries).toContain('Nigeria');
  });

  it('filters Japanese culture written in authentic Portuguese (PT immersion for international learners)', () => {
    const results = CultureService.filterArticles({
      origin_country: 'Japan',
      content_language: 'pt',
    });

    expect(results.length).toBeGreaterThanOrEqual(1);
    const article = results[0];
    expect(article.origin_country).toBe('Japan');
    expect(article.content_language).toBe('pt');
    expect(article.title).toContain('Hanami');
    expect(article.content_paragraphs[0]).toContain('sakura');
    // Verify it includes authentic glossary terms
    expect(article.glossary).toBeDefined();
    expect(article.glossary?.['efemeridade']).toBeDefined();
  });

  it('filters Indian culture written in authentic Spanish (ES immersion for learners)', () => {
    const results = CultureService.filterArticles({
      origin_country: 'India',
      content_language: 'es',
    });

    expect(results.length).toBeGreaterThanOrEqual(1);
    const article = results[0];
    expect(article.origin_country).toBe('India');
    expect(article.content_language).toBe('es');
    expect(article.title).toContain('Diwali');
    expect(article.comprehension_questions?.length).toBeGreaterThanOrEqual(2);
  });

  it('filters Brazilian culture written in authentic English (EN track immersion)', () => {
    const results = CultureService.filterArticles({
      origin_country: 'Brazil',
      content_language: 'en',
    });

    expect(results.length).toBeGreaterThanOrEqual(1);
    const article = results[0];
    expect(article.origin_country).toBe('Brazil');
    expect(article.content_language).toBe('en');
    expect(article.title).toContain('Capoeira');
    expect(article.summary).toContain('Afro-Brazilian');
  });

  it('CRITICAL: NEVER silently substitutes unrelated English when a filter yields no results', () => {
    // Search for a non-existent combination: e.g. Japan in a non-existent topic or impossible query
    const results = CultureService.filterArticles({
      origin_country: 'Japan',
      topic: 'food',
      search_query: 'non_existent_unmatched_term_xyz_123',
    });

    // Must return an empty array, strictly NOT falling back to default English articles!
    expect(results).toHaveLength(0);
  });

  it('filters accurately by CEFR proficiency levels (A1 through C1)', () => {
    const c1Articles = CultureService.filterArticles({ cefr_level: 'C1' });
    expect(c1Articles.length).toBeGreaterThanOrEqual(2);
    expect(c1Articles.every(a => a.cefr_level === 'C1')).toBe(true);

    const b1Articles = CultureService.filterArticles({ cefr_level: 'B1' });
    expect(b1Articles.length).toBeGreaterThanOrEqual(2);
    expect(b1Articles.every(a => a.cefr_level === 'B1')).toBe(true);

    const a2Articles = CultureService.filterArticles({ cefr_level: 'A2' });
    expect(a2Articles.length).toBeGreaterThanOrEqual(2);
    expect(a2Articles.every(a => a.cefr_level === 'A2')).toBe(true);
  });

  it('supports full-text search across titles, summaries, tags, and origin countries', () => {
    const results = CultureService.filterArticles({ search_query: 'berimbau' });
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].origin_country).toBe('Brazil');

    const yorubaResults = CultureService.filterArticles({ search_query: 'yoruba' });
    expect(yorubaResults.length).toBeGreaterThanOrEqual(1);
    expect(yorubaResults[0].origin_country).toBe('Nigeria');
  });

  it('manages local bookmarks reliably in IndexedDB/Dexie', async () => {
    const userId = 'learner_guest_01';
    const all = CultureService.getAllArticles();
    const article = all[0];

    // 1. Initial state: not bookmarked
    const initialSaved = await CultureService.isBookmarked(userId, article.id);
    expect(initialSaved).toBe(false);

    // 2. Toggle bookmark -> now saved
    const isNowSaved = await CultureService.toggleBookmark(userId, article);
    expect(isNowSaved).toBe(true);

    const checkSaved = await CultureService.isBookmarked(userId, article.id);
    expect(checkSaved).toBe(true);

    const bookmarks = await CultureService.getUserBookmarks(userId);
    expect(bookmarks.length).toBe(1);
    expect(bookmarks[0].article_id).toBe(article.id);

    // 3. Toggle again -> removed
    const isRemoved = await CultureService.toggleBookmark(userId, article);
    expect(isRemoved).toBe(false);

    const checkAfterRemove = await CultureService.isBookmarked(userId, article.id);
    expect(checkAfterRemove).toBe(false);
  });

  it('verifies that all internationalization keys for cultural discovery exist across en, pt, es', () => {
    const langs = ['en', 'pt', 'es'] as const;
    const requiredKeys = [
      'nav_explore',
      'explore_title',
      'explore_subtitle',
      'explore_tab_discover',
      'explore_tab_bookmarks',
      'explore_search_placeholder',
      'explore_filter_origin',
      'explore_filter_region',
      'explore_filter_content_lang',
      'explore_filter_level',
      'explore_filter_topic',
      'explore_empty_title',
      'explore_empty_desc',
      'explore_empty_reset',
      'explore_read_article',
      'explore_bookmark_save',
      'explore_bookmark_remove',
      'explore_quiz_title',
      'explore_quiz_correct',
      'explore_glossary_title',
      'explore_source_attribution',
    ] as const;

    for (const lang of langs) {
      const dict = translations[lang];
      for (const key of requiredKeys) {
        expect(dict[key], `Missing key "${key}" in translation "${lang}"`).toBeDefined();
        expect(dict[key].length).toBeGreaterThan(0);
      }
    }
  });
});
