import React, { useState, useEffect, useMemo } from 'react';
import {
  Compass,
  Search,
  Filter,
  Bookmark,
  BookmarkCheck,
  Globe,
  Clock,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Film,
  Newspaper,
  Loader2,
} from 'lucide-react';
import {
  CulturalArticle,
  CultureFilterState,
  CultureRegion,
  CultureTopic,
} from '../types/culture';
import { CultureService } from '../services/cultureService';
import { ReadingService } from '../services/readingService';
import { contentAccess } from '../services/contentAccess';
import {
  NormalizedReadingArticle,
  NormalizedCulturalEntity,
} from '../integrations/external-apis/core/types';
import { ArticleReaderModal } from '../components/culture/ArticleReaderModal';
import { LexilumeWorldHub } from '../features/world/LexilumeWorldHub';
import { useI18n } from '../i18n/i18nContext';
import { getLanguageName, LANGUAGE_METADATA } from '../lib/languages/languageMatrix';
import { authService } from '../services/auth';
import { Language, CEFRLevel } from '../types';

export const CultureExplorePage: React.FC = () => {
  const { t, interfaceLanguage } = useI18n();
  const [activeTab, setActiveTab] = useState<'world' | 'discover' | 'wikipedia' | 'jikan' | 'bookmarks'>('world');
  const [selectedArticle, setSelectedArticle] = useState<CulturalArticle | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  // Wikipedia live reading state
  const [wikiArticles, setWikiArticles] = useState<NormalizedReadingArticle[]>([]);
  const [wikiLang, setWikiLang] = useState<'pt' | 'es' | 'en'>('pt');
  const [wikiSearch, setWikiSearch] = useState('');
  const [wikiLoading, setWikiLoading] = useState(false);

  // Jikan anime & manga reading state
  const [jikanEntities, setJikanEntities] = useState<NormalizedCulturalEntity[]>([]);
  const [jikanSearch, setJikanSearch] = useState('Miyazaki');
  const [jikanLoading, setJikanLoading] = useState(false);

  // Filter states for Curated Catalog
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<CultureRegion | 'all'>('all');
  const [selectedContentLang, setSelectedContentLang] = useState<Language | 'all'>('all');
  const [selectedCefr, setSelectedCefr] = useState<CEFRLevel | 'all'>('all');
  const [selectedTopic, setSelectedTopic] = useState<CultureTopic | 'all'>('all');
  const [aiArticles, setAiArticles] = useState<CulturalArticle[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const userId = authService.getState().user?.id || 'guest_learner';

  useEffect(() => {
    let active = true;
    contentAccess
      .getPublishedCulturalArticles()
      .then(list => {
        if (active) setAiArticles(list);
      })
      .catch(() => {
        if (active) setAiArticles([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const reloadBookmarks = async () => {
    const list = await CultureService.getUserBookmarks(userId);
    setBookmarkedIds(new Set(list.map(b => b.article_id)));
  };

  useEffect(() => {
    reloadBookmarks();
  }, [userId]);

  // Load Wikipedia articles
  const loadWikipediaFeed = async (lang: 'pt' | 'es' | 'en', query?: string) => {
    setWikiLoading(true);
    try {
      if (query && query.trim().length > 0) {
        const results = await ReadingService.searchWikipediaArticle(query, lang);
        setWikiArticles(results);
      } else {
        const feed = await ReadingService.getDailyReading(lang, 4);
        setWikiArticles(feed);
      }
    } catch (err) {
      console.warn('Error loading Wikipedia articles', err);
    } finally {
      setWikiLoading(false);
    }
  };

  // Load Jikan cultural narratives
  const loadJikanContent = async (query: string) => {
    setJikanLoading(true);
    try {
      const results = await ReadingService.getCulturalEntities(query);
      setJikanEntities(results);
    } catch (err) {
      console.warn('Error loading Jikan entities', err);
    } finally {
      setJikanLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'wikipedia') {
      loadWikipediaFeed(wikiLang, wikiSearch);
    } else if (activeTab === 'jikan') {
      loadJikanContent(jikanSearch);
    }
  }, [activeTab, wikiLang]);

  const [liveCultureTick, setLiveCultureTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    CultureService.loadLiveArticles(
      selectedContentLang === 'all' ? undefined : selectedContentLang,
      searchQuery
    )
      .then(() => {
        if (!cancelled) setLiveCultureTick(n => n + 1);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [selectedContentLang]);

  const availableCountries = useMemo(() => CultureService.getAvailableCountries(), [liveCultureTick]);
  const availableRegions = useMemo(() => CultureService.getAvailableRegions(), [liveCultureTick]);
  const availableTopics = useMemo(() => CultureService.getAvailableTopics(), [liveCultureTick]);

  // Filter application
  const filteredArticles = useMemo(() => {
    const filterState: CultureFilterState = {
      search_query: searchQuery,
      origin_country: selectedCountry,
      origin_region: selectedRegion,
      content_language: selectedContentLang,
      cefr_level: selectedCefr,
      topic: selectedTopic,
    };

    let list = CultureService.filterArticles(filterState);

    if (aiArticles.length > 0) {
      const q = searchQuery.trim().toLowerCase();
      const filteredAi = aiArticles.filter(a => {
        if (selectedContentLang !== 'all' && a.content_language !== selectedContentLang) return false;
        if (selectedCefr !== 'all' && a.cefr_level !== selectedCefr) return false;
        if (
          q &&
          !a.title.toLowerCase().includes(q) &&
          !a.summary.toLowerCase().includes(q)
        ) {
          return false;
        }
        return true;
      });
      list = [...filteredAi, ...list];
    }

    if (activeTab === 'bookmarks') {
      list = list.filter(a => bookmarkedIds.has(a.id));
    }

    return list;
  }, [
    searchQuery,
    selectedCountry,
    selectedRegion,
    selectedContentLang,
    selectedCefr,
    selectedTopic,
    activeTab,
    bookmarkedIds,
    aiArticles,
    liveCultureTick,
  ]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCountry('all');
    setSelectedRegion('all');
    setSelectedContentLang('all');
    setSelectedCefr('all');
    setSelectedTopic('all');
  };

  const handleOpenWikiArticle = (w: NormalizedReadingArticle) => {
    setSelectedArticle({
      id: w.id,
      title: w.title,
      summary: w.summary,
      content_paragraphs: w.contentParagraphs,
      content_language: w.language as Language,
      target_learning_language: w.language as Language,
      origin_country: w.language === 'pt' ? 'Portugal / Brasil' : w.language === 'es' ? 'España' : 'Global',
      origin_region: w.language === 'pt' ? 'Americas' : w.language === 'es' ? 'Europe' : 'Global',
      topic: 'history',
      content_type: 'external_article',
      cefr_level: (w.estimatedCefrLevel as CEFRLevel) || 'B2',
      read_time_minutes: Math.max(1, Math.ceil(w.contentParagraphs.join(' ').split(' ').length / 150)),
      tags: ['Wikipedia', 'Autêntico', w.language],
      image_url: w.thumbnailUrl,
      source_url: w.sourceUrl || 'https://www.wikipedia.org',
      publisher: 'Wikimedia Foundation',
      published_at: w.publishedAt || new Date().toISOString(),
      license: 'CC BY-SA 4.0',
      attribution_text: w.attribution,
    });
  };

  const handleOpenJikanArticle = (j: NormalizedCulturalEntity) => {
    setSelectedArticle({
      id: j.id,
      title: `${j.title} ${j.japaneseTitle ? `(${j.japaneseTitle})` : ''}`,
      summary: j.summary,
      content_paragraphs: j.readingPassage.split('\n\n').filter(Boolean),
      content_language: 'pt',
      target_learning_language: 'pt',
      origin_country: 'Japão / Global',
      origin_region: 'Asia',
      topic: 'art',
      content_type: 'cultural_guide',
      cefr_level: (j.cefrLevel as CEFRLevel) || 'B2',
      read_time_minutes: 3,
      tags: ['Jikan', 'Anime', 'Cultura'],
      image_url: j.imageUrl,
      source_url: j.sourceUrl || 'https://myanimelist.net',
      publisher: 'MyAnimeList Community',
      published_at: new Date().toISOString(),
      license: 'Public Educational Data',
      attribution_text: 'Jikan API / MyAnimeList Community',
      glossary: j.glossary,
    });
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCountry !== 'all' ||
    selectedRegion !== 'all' ||
    selectedContentLang !== 'all' ||
    selectedCefr !== 'all' ||
    selectedTopic !== 'all';

  const getTopicLabel = (topic: string) => {
    return t(`learning:explore_topic_${topic}`, topic);
  };

  const activeFilterCount =
    (selectedCountry !== 'all' ? 1 : 0) +
    (selectedRegion !== 'all' ? 1 : 0) +
    (selectedContentLang !== 'all' ? 1 : 0) +
    (selectedCefr !== 'all' ? 1 : 0) +
    (selectedTopic !== 'all' ? 1 : 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Editorial Header */}
      <header className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-8 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 shrink-0">
            <Compass className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              {t('explore_title')}
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl leading-relaxed">
              {t('explore_subtitle')}
            </p>
          </div>
        </div>
      </header>

      {/* Calm Unified Tab Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-white border border-stone-200 p-1.5 rounded-2xl shadow-xs">
        {[
          { id: 'world' as const, label: t('navigation:nav_world', 'Lexilume World'), icon: Sparkles },
          { id: 'discover' as const, label: t('explore_tab_discover'), icon: Globe },
          { id: 'wikipedia' as const, label: t('learning:explore_tab_wikipedia', 'Thematic Readings'), icon: Newspaper },
          { id: 'jikan' as const, label: t('learning:explore_tab_jikan', 'Culture & Narratives'), icon: Film },
          { id: 'bookmarks' as const, label: t('explore_tab_bookmarks'), icon: Bookmark, count: bookmarkedIds.size },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition min-h-[40px] cursor-pointer ${
                isActive
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-300' : 'text-stone-400'}`} />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && tab.count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-amber-500/20 text-amber-200' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 0. Lexilume World Integrated Hub */}
      {activeTab === 'world' && (
        <div className="pt-1 practice-stage">
          <LexilumeWorldHub />
        </div>
      )}

      {/* 1. Curated Catalog View (Discover & Bookmarks) */}
      {(activeTab === 'discover' || activeTab === 'bookmarks') && (
        <>
          <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={t('explore_search_placeholder')}
                  className="w-full bg-[#FAF9F6] border border-stone-200 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-500 focus:bg-white transition min-h-[42px]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs px-2 py-1 rounded cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowFilters(prev => !prev)}
                aria-expanded={showFilters}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer min-h-[42px] shrink-0 ${
                  showFilters || activeFilterCount > 0
                    ? 'bg-stone-900 text-white border-stone-900'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>{t('learning:toggle_filters', 'Filters')}</span>
                {activeFilterCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-200">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {showFilters && (
              <div className="space-y-3 pt-3 border-t border-stone-100 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-stone-500 font-semibold">{t('explore_filter_origin')}</label>
                    <select
                      value={selectedCountry}
                      onChange={e => setSelectedCountry(e.target.value)}
                      className="w-full bg-[#FAF9F6] border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-stone-500 min-h-[40px] cursor-pointer"
                    >
                      <option value="all">{t('learning:explore_all_countries', 'All Countries')}</option>
                      {availableCountries.map(c => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-stone-500 font-semibold">{t('explore_filter_region')}</label>
                    <select
                      value={selectedRegion}
                      onChange={e => setSelectedRegion(e.target.value as any)}
                      className="w-full bg-[#FAF9F6] border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-stone-500 min-h-[40px] cursor-pointer"
                    >
                      <option value="all">{t('explore_filter_all_regions')}</option>
                      {availableRegions.map(r => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-stone-500 font-semibold">{t('explore_filter_content_lang')}</label>
                    <select
                      value={selectedContentLang}
                      onChange={e => setSelectedContentLang(e.target.value as any)}
                      className="w-full bg-[#FAF9F6] border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-stone-500 min-h-[40px] cursor-pointer"
                    >
                      <option value="all">{t('explore_filter_all')}</option>
                      <option value="pt">{getLanguageName('pt', interfaceLanguage as any)} (PT)</option>
                      <option value="es">{getLanguageName('es', interfaceLanguage as any)} (ES)</option>
                      <option value="en">{getLanguageName('en', interfaceLanguage as any)} (EN)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-stone-500 font-semibold">{t('explore_filter_level')}</label>
                    <select
                      value={selectedCefr}
                      onChange={e => setSelectedCefr(e.target.value as any)}
                      className="w-full bg-[#FAF9F6] border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-stone-500 min-h-[40px] cursor-pointer"
                    >
                      <option value="all">{t('learning:explore_all_levels_range', 'All Levels (A1–C1)')}</option>
                      <option value="A1">{t('learning:cefr_level_a1', 'A1 Beginner')}</option>
                      <option value="A2">{t('learning:cefr_level_a2', 'A2 Elementary')}</option>
                      <option value="B1">{t('learning:cefr_level_b1', 'B1 Intermediate')}</option>
                      <option value="B2">{t('learning:cefr_level_b2', 'B2 Upper-Int.')}</option>
                      <option value="C1">{t('learning:cefr_level_c1', 'C1 Advanced')}</option>
                    </select>
                  </div>
                </div>

                {/* Topic Pills */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedTopic('all')}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                      selectedTopic === 'all'
                        ? 'bg-stone-900 text-white'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {t('explore_filter_all_topics')}
                  </button>
                  {availableTopics.map(tKey => (
                    <button
                      type="button"
                      key={tKey}
                      onClick={() => setSelectedTopic(tKey)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                        selectedTopic === tKey
                          ? 'bg-stone-900 text-white'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      {getTopicLabel(tKey)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {hasActiveFilters && (
              <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
                <span className="text-stone-500">
                  {t('learning:explore_found_articles', 'Found {{count}} articles matching the current filters.', {
                    count: filteredArticles.length,
                  })}
                </span>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="flex items-center gap-1.5 text-stone-900 hover:text-amber-800 font-semibold cursor-pointer py-1 px-2 rounded"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t('explore_empty_reset')}</span>
                </button>
              </div>
            )}
          </div>

          {filteredArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredArticles.map(article => {
                const isSaved = bookmarkedIds.has(article.id);

                return (
                  <div
                    key={article.id}
                    className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs hover:border-stone-300 transition flex flex-col justify-between group space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200">
                          <Globe className="w-3 h-3" />
                          <span>{article.origin_country}</span>
                        </span>

                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
                            {article.content_language.toUpperCase()}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            {article.cefr_level}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h2
                          onClick={() => setSelectedArticle(article)}
                          className="font-serif font-bold text-lg text-stone-900 group-hover:text-amber-800 transition cursor-pointer line-clamp-2 leading-snug"
                        >
                          {article.title}
                        </h2>
                        <p className="mt-2 text-xs text-stone-600 line-clamp-3 leading-relaxed">
                          {article.summary}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        {article.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-md bg-stone-100 text-[11px] text-stone-600 font-medium"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-xs text-stone-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {t('learning:explore_read_minutes', '{{count}} min', {
                            count: article.read_time_minutes,
                          })}
                        </span>
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            await CultureService.toggleBookmark(userId, article);
                            await reloadBookmarks();
                          }}
                          className={`p-2 rounded-xl border transition min-h-[42px] min-w-[42px] flex items-center justify-center cursor-pointer ${
                            isSaved
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-stone-50 text-stone-500 hover:text-stone-900 border-stone-200'
                          }`}
                          title={isSaved ? t('explore_bookmark_remove') : t('explore_bookmark_save')}
                          aria-label={isSaved ? t('explore_bookmark_remove') : t('explore_bookmark_save')}
                        >
                          {isSaved ? (
                            <BookmarkCheck className="w-4 h-4 text-amber-600" />
                          ) : (
                            <Bookmark className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedArticle(article)}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition min-h-[42px] cursor-pointer shadow-xs"
                        >
                          <span>{t('explore_read_article')}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white border border-dashed border-stone-300 rounded-2xl p-8 sm:p-12 text-center space-y-4 max-w-xl mx-auto shadow-xs animate-fadeIn">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mx-auto">
                <Filter className="w-6 h-6" />
              </div>

              <div className="space-y-1.5">
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  {t('explore_empty_title')}
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  {t('explore_empty_desc')}
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-semibold shadow-xs transition min-h-[44px] cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{t('explore_empty_reset')}</span>
              </button>
            </div>
          )}
        </>
      )}

      {/* 2. Wikipedia Live Reader Tab */}
      {activeTab === 'wikipedia' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
            <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200 w-full md:w-auto">
              {(['pt', 'es', 'en'] as const).map(langCode => (
                <button
                  type="button"
                  key={langCode}
                  onClick={() => setWikiLang(langCode)}
                  className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    wikiLang === langCode ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {LANGUAGE_METADATA[langCode].flag} {getLanguageName(langCode, interfaceLanguage as any)}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 w-full md:w-96">
              <input
                type="text"
                value={wikiSearch}
                onChange={e => setWikiSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadWikipediaFeed(wikiLang, wikiSearch)}
                placeholder={t(
                  'learning:explore_wiki_placeholder',
                  'Search thematic articles (e.g., Lisbon, Madrid, Shakespeare)...'
                )}
                className="w-full bg-[#FAF9F6] border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-500 min-h-[42px]"
              />
              <button
                type="button"
                onClick={() => loadWikipediaFeed(wikiLang, wikiSearch)}
                className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs rounded-xl min-h-[42px] cursor-pointer shadow-xs shrink-0"
              >
                {t('learning:explore_search_btn', 'Search')}
              </button>
            </div>
          </div>

          {wikiLoading ? (
            <div className="p-12 text-center text-stone-500 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-7 h-7 animate-spin text-amber-700" />
              <p className="text-sm">{t('learning:explore_wiki_loading', 'Loading authentic articles...')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wikiArticles.map(article => (
                <div
                  key={article.id}
                  className="bg-white border border-stone-200 hover:border-stone-300 transition rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        {article.estimatedCefrLevel || 'B2'}
                      </span>
                      <span className="text-[10px] text-stone-500 uppercase tracking-wider">
                        {article.publishedAt
                          ? t('learning:explore_wiki_year', 'Year {{year}}', { year: article.publishedAt })
                          : t('learning:explore_wiki_encyclopedic', 'Encyclopedic Article')}
                      </span>
                    </div>
                    <h3 className="font-serif text-lg font-bold text-stone-900">
                      {article.title}
                    </h3>
                    <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed">
                      {article.summary}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-[10px] text-stone-500 truncate max-w-[200px]">
                      {article.attribution}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenWikiArticle(article)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition cursor-pointer"
                    >
                      <span>{t('learning:explore_read_in_app', 'Read in App')}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Jikan Anime & Culture Narrative Tab */}
      {activeTab === 'jikan' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
            <div>
              <h2 className="font-serif text-base font-bold text-stone-900">
                {t('learning:explore_narratives_title', 'Cultural Narrative Explorer')}
              </h2>
              <p className="text-xs text-stone-600">
                {t(
                  'learning:explore_narratives_subtitle',
                  'Cultural readings and biographical profiles adapted for reading comprehension.'
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 w-full md:w-96">
              <input
                type="text"
                value={jikanSearch}
                onChange={e => setJikanSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadJikanContent(jikanSearch)}
                placeholder={t(
                  'learning:explore_narratives_placeholder',
                  'Character or work (e.g., Miyazaki, Naruto, Totoro)...'
                )}
                className="w-full bg-[#FAF9F6] border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-500 min-h-[42px]"
              />
              <button
                type="button"
                onClick={() => loadJikanContent(jikanSearch)}
                className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs rounded-xl min-h-[42px] cursor-pointer shadow-xs shrink-0"
              >
                {t('learning:explore_search_btn', 'Search')}
              </button>
            </div>
          </div>

          {jikanLoading ? (
            <div className="p-12 text-center text-stone-500 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-7 h-7 animate-spin text-amber-700" />
              <p className="text-sm">{t('learning:explore_narratives_loading', 'Loading cultural narratives...')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jikanEntities.map(entity => (
                <div
                  key={entity.id}
                  className="bg-white border border-stone-200 hover:border-stone-300 transition rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xs"
                >
                  <div className="flex gap-4">
                    {entity.imageUrl && (
                      <img
                        src={entity.imageUrl}
                        alt={entity.title}
                        className="w-20 h-28 object-cover rounded-xl border border-stone-200 shrink-0"
                      />
                    )}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {entity.cefrLevel}
                        </span>
                        {entity.japaneseTitle && (
                          <span className="text-xs text-stone-500 font-medium">
                            {entity.japaneseTitle}
                          </span>
                        )}
                      </div>
                      <h3 className="font-serif text-base font-bold text-stone-900 truncate">
                        {entity.title}
                      </h3>
                      <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed">
                        {entity.summary}
                      </p>
                    </div>
                  </div>

                  {entity.glossary && Object.keys(entity.glossary).length > 0 && (
                    <div className="bg-[#FAF9F6] p-3 rounded-xl border border-stone-200 text-[11px] space-y-1.5">
                      <div className="font-bold text-stone-500 text-[10px] uppercase">
                        {t('learning:explore_pedagogical_glossary', 'Pedagogical Glossary')}
                      </div>
                      <div className="flex flex-wrap gap-1.5 text-stone-700">
                        {Object.entries(entity.glossary).map(([k, v]) => (
                          <span key={k} className="bg-white border border-stone-200 px-2 py-0.5 rounded">
                            <strong>{k}:</strong> {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-[10px] text-stone-500">
                      {t('learning:explore_tab_jikan', 'Culture & Narratives')}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenJikanArticle(entity)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition cursor-pointer"
                    >
                      <span>{t('learning:explore_read_narrative', 'Read Narrative')}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reader Modal */}
      {selectedArticle && (
        <div className="practice-stage">
          <ArticleReaderModal
            article={selectedArticle}
            userId={userId}
            isOpen={true}
            onClose={() => setSelectedArticle(null)}
            onBookmarkChanged={reloadBookmarks}
          />
        </div>
      )}
    </div>
  );
};
