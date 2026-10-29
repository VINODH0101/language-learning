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
  BookOpen,
  Sparkles,
  Layers,
  ChevronRight,
  ExternalLink,
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
import {
  NormalizedReadingArticle,
  NormalizedCulturalEntity,
} from '../integrations/external-apis/core/types';
import { ArticleReaderModal } from '../components/culture/ArticleReaderModal';
import { useI18n } from '../i18n/i18nContext';
import { authService } from '../services/auth';
import { Language, CEFRLevel } from '../types';

export const CultureExplorePage: React.FC = () => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'discover' | 'wikipedia' | 'jikan' | 'bookmarks'>('discover');
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

  const userId = authService.getState().user?.id || 'guest_learner';

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

  const availableCountries = useMemo(() => CultureService.getAvailableCountries(), []);
  const availableRegions = useMemo(() => CultureService.getAvailableRegions(), []);
  const availableTopics = useMemo(() => CultureService.getAvailableTopics(), []);

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

  const getLanguageLabel = (lang: string) => {
    if (lang === 'pt') return 'Português';
    if (lang === 'es') return 'Español';
    return 'English';
  };

  const getTopicLabel = (topic: string) => {
    const map: Record<string, string> = {
      festivals: 'Festivais & Celebrações',
      traditions: 'Tradições & Costumes',
      history: 'História & Civilização',
      music: 'Música & Ritmo',
      art: 'Arte & Cinema',
      food: 'Gastronomia & Café',
      literature: 'Literatura & Poesia',
      society: 'Sociedade & Vida Urbana',
      travel: 'Viagem & Lugares',
      news: 'Notícias & Atualidades',
    };
    return map[topic] || topic;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Page Title & Mission */}
      <div className="space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md">
            <Compass className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
              {t('explore_title')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              {t('explore_subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs: Discover Catalog vs. Wikipedia vs. Jikan vs. Bookmarks */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('discover')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition min-h-[44px] cursor-pointer ${
            activeTab === 'discover'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>{t('explore_tab_discover')}</span>
        </button>

        <button
          onClick={() => setActiveTab('wikipedia')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition min-h-[44px] cursor-pointer ${
            activeTab === 'wikipedia'
              ? 'bg-sky-600 text-white shadow-md'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
          }`}
        >
          <Newspaper className="w-4 h-4" />
          <span>Leituras Temáticas</span>
        </button>

        <button
          onClick={() => setActiveTab('jikan')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition min-h-[44px] cursor-pointer ${
            activeTab === 'jikan'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>Cultura & Narrativas</span>
        </button>

        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition min-h-[44px] cursor-pointer ${
            activeTab === 'bookmarks'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>{t('explore_tab_bookmarks')}</span>
          {bookmarkedIds.size > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-slate-900/60 text-amber-200">
              {bookmarkedIds.size}
            </span>
          )}
        </button>
      </div>

      {/* 1. Curated Catalog View (Discover & Bookmarks) */}
      {(activeTab === 'discover' || activeTab === 'bookmarks') && (
        <>
          {/* Search & Independent Filter Bar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('explore_search_placeholder')}
            className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-10 pr-10 py-3 text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition min-h-[44px]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs px-2 py-1 rounded cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Origin Country */}
          <div className="space-y-1.5">
            <label className="text-slate-400 font-semibold">{t('explore_filter_origin')}</label>
            <select
              value={selectedCountry}
              onChange={e => setSelectedCountry(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 min-h-[44px] cursor-pointer"
            >
              <option value="all">Todos os Países</option>
              {availableCountries.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Region */}
          <div className="space-y-1.5">
            <label className="text-slate-400 font-semibold">{t('explore_filter_region')}</label>
            <select
              value={selectedRegion}
              onChange={e => setSelectedRegion(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 min-h-[44px] cursor-pointer"
            >
              <option value="all">{t('explore_filter_all_regions')}</option>
              {availableRegions.map(r => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Content Language */}
          <div className="space-y-1.5">
            <label className="text-slate-400 font-semibold">{t('explore_filter_content_lang')}</label>
            <select
              value={selectedContentLang}
              onChange={e => setSelectedContentLang(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 min-h-[44px] cursor-pointer"
            >
              <option value="all">{t('explore_filter_all')}</option>
              <option value="pt">Português (PT)</option>
              <option value="es">Español (ES)</option>
              <option value="en">English (EN)</option>
            </select>
          </div>

          {/* CEFR Level */}
          <div className="space-y-1.5">
            <label className="text-slate-400 font-semibold">{t('explore_filter_level')}</label>
            <select
              value={selectedCefr}
              onChange={e => setSelectedCefr(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 min-h-[44px] cursor-pointer"
            >
              <option value="all">Todos os Níveis (A1–C1)</option>
              <option value="A1">A1 — Principiante</option>
              <option value="A2">A2 — Básico</option>
              <option value="B1">B1 — Intermediário</option>
              <option value="B2">B2 — Independente</option>
              <option value="C1">C1 — Avançado / Fluente</option>
            </select>
          </div>
        </div>

        {/* Topic Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1 no-scrollbar flex-wrap">
          <button
            onClick={() => setSelectedTopic('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition min-h-[36px] cursor-pointer ${
              selectedTopic === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
            }`}
          >
            {t('explore_filter_all_topics')}
          </button>
          {availableTopics.map(tKey => (
            <button
              key={tKey}
              onClick={() => setSelectedTopic(tKey)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition min-h-[36px] cursor-pointer ${
                selectedTopic === tKey
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              {getTopicLabel(tKey)}
            </button>
          ))}
        </div>

        {/* Filter Summary & Reset Button */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
            <span className="text-slate-400">
              Encontrados <strong className="text-slate-100">{filteredArticles.length}</strong> artigos para os filtros atuais.
            </span>
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer py-1 px-2 rounded hover:bg-indigo-950/40"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('explore_empty_reset')}</span>
            </button>
          </div>
        )}
      </div>

      {/* Catalog Cards Grid */}
      {filteredArticles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredArticles.map(article => {
            const isSaved = bookmarkedIds.has(article.id);

            return (
              <div
                key={article.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition flex flex-col justify-between group space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-950/70 text-indigo-300 border border-indigo-800/50">
                      <Globe className="w-3 h-3" />
                      <span>{article.origin_country}</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-800/50 uppercase">
                        {article.content_language.toUpperCase()}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-950/70 text-amber-300 border border-amber-800/50">
                        {article.cefr_level}
                      </span>
                    </div>
                  </div>

                  {/* Title & Summary */}
                  <div>
                    <h2
                      onClick={() => setSelectedArticle(article)}
                      className="font-bold text-base text-slate-100 group-hover:text-indigo-300 transition cursor-pointer line-clamp-2 leading-snug"
                    >
                      {article.title}
                    </h2>
                    <p className="mt-2 text-xs text-slate-400 line-clamp-3 leading-relaxed">
                      {article.summary}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {article.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-md bg-slate-800 text-[11px] text-slate-400 font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{article.read_time_minutes} min</span>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        await CultureService.toggleBookmark(userId, article);
                        await reloadBookmarks();
                      }}
                      className={`p-2 rounded-xl border transition min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer ${
                        isSaved
                          ? 'bg-amber-950/80 text-amber-300 border-amber-700'
                          : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
                      }`}
                      title={isSaved ? t('explore_bookmark_remove') : t('explore_bookmark_save')}
                      aria-label={isSaved ? t('explore_bookmark_remove') : t('explore_bookmark_save')}
                    >
                      {isSaved ? (
                        <BookmarkCheck className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => setSelectedArticle(article)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition min-h-[44px] cursor-pointer shadow-sm"
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
        /* Empty State — Strict localized explanation without silent fallback to English */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 sm:p-12 text-center space-y-4 max-w-xl mx-auto shadow-sm animate-fadeIn">
          <div className="w-14 h-14 rounded-2xl bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center text-indigo-400 mx-auto">
            <Filter className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-100">
              {t('explore_empty_title')}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              {t('explore_empty_desc')}
            </p>
          </div>

          <button
            onClick={handleResetFilters}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md transition min-h-[44px] cursor-pointer"
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
          {/* Controls: Language switch & Article Search */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
            <div className="flex items-center gap-2 bg-slate-800 p-1.5 rounded-xl border border-slate-700 w-full md:w-auto">
              <button
                onClick={() => setWikiLang('pt')}
                className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  wikiLang === 'pt' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🇵🇹 Português
              </button>
              <button
                onClick={() => setWikiLang('es')}
                className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  wikiLang === 'es' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🇪🇸 Español
              </button>
              <button
                onClick={() => setWikiLang('en')}
                className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  wikiLang === 'en' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🇬🇧 English
              </button>
            </div>

            <div className="flex items-center gap-2 w-full md:w-96">
              <input
                type="text"
                value={wikiSearch}
                onChange={e => setWikiSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadWikipediaFeed(wikiLang, wikiSearch)}
                placeholder="Buscar artigos temáticos (ex: Lisboa, Madrid, Shakespeare)..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 min-h-[44px]"
              />
              <button
                onClick={() => loadWikipediaFeed(wikiLang, wikiSearch)}
                className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl min-h-[44px] cursor-pointer shadow-sm"
              >
                Buscar
              </button>
            </div>
          </div>

          {/* Loading indicator */}
          {wikiLoading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
              <p className="text-sm">Carregando artigos autênticos...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wikiArticles.map(article => (
                <div
                  key={article.id}
                  className="bg-slate-900 border border-slate-800 hover:border-sky-700/60 transition rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-sm"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-950 text-sky-300 border border-sky-800">
                        {article.estimatedCefrLevel || 'B2'}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                        {article.publishedAt ? `Ano ${article.publishedAt}` : 'Artigo Enciclopédico'}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-100 hover:text-sky-300 transition">
                      {article.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                      {article.summary}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 truncate max-w-[200px]">
                      {article.attribution}
                    </span>
                    <button
                      onClick={() => handleOpenWikiArticle(article)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition cursor-pointer"
                    >
                      <span>Ler no App</span>
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
          {/* Search bar for characters/works */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
            <div>
              <h2 className="text-sm font-bold text-purple-300">Explorador de Narrativas Culturais</h2>
              <p className="text-xs text-slate-400">Leituras culturais e perfis biográficos adaptados para compreensão de texto.</p>
            </div>
            <div className="flex items-center gap-2 w-full md:w-96">
              <input
                type="text"
                value={jikanSearch}
                onChange={e => setJikanSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadJikanContent(jikanSearch)}
                placeholder="Personagem ou obra (ex: Miyazaki, Naruto, Totoro)..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-500 min-h-[44px]"
              />
              <button
                onClick={() => loadJikanContent(jikanSearch)}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl min-h-[44px] cursor-pointer shadow-sm"
              >
                Buscar
              </button>
            </div>
          </div>

          {jikanLoading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
              <p className="text-sm">Carregando narrativas culturais...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jikanEntities.map(entity => (
                <div
                  key={entity.id}
                  className="bg-slate-900 border border-slate-800 hover:border-purple-700/60 transition rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-sm"
                >
                  <div className="flex gap-4">
                    {entity.imageUrl && (
                      <img
                        src={entity.imageUrl}
                        alt={entity.title}
                        className="w-20 h-28 object-cover rounded-xl border border-slate-700 shrink-0"
                      />
                    )}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800">
                          {entity.cefrLevel}
                        </span>
                        {entity.japaneseTitle && (
                          <span className="text-xs text-purple-400 font-medium">
                            {entity.japaneseTitle}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-slate-100 truncate">
                        {entity.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                        {entity.summary}
                      </p>
                    </div>
                  </div>

                  {/* Glossary Preview */}
                  {entity.glossary && Object.keys(entity.glossary).length > 0 && (
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-[11px] space-y-1">
                      <div className="font-bold text-purple-400 text-[10px] uppercase">Glossário Pedagógico</div>
                      <div className="flex flex-wrap gap-2 text-slate-300">
                        {Object.entries(entity.glossary).map(([k, v]) => (
                          <span key={k} className="bg-slate-800 px-2 py-0.5 rounded">
                            <strong>{k}:</strong> {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">
                      Cultura & Narrativas
                    </span>
                    <button
                      onClick={() => handleOpenJikanArticle(entity)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition cursor-pointer"
                    >
                      <span>Ler Narrativa</span>
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
        <ArticleReaderModal
          article={selectedArticle}
          userId={userId}
          isOpen={true}
          onClose={() => setSelectedArticle(null)}
          onBookmarkChanged={reloadBookmarks}
        />
      )}
    </div>
  );
};
