import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Clock,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Compass,
} from 'lucide-react';
import {
  ContentItem,
  ContentVersion,
  LearningActivity,
  LearnerContentProgress,
} from '../../types/contentCentred';
import { Badge } from '../../components/common/Badge';
import { contentCentredService } from '../../services/contentCentredService';
import { authService } from '../../services/auth';

interface LearnCatalogProps {
  onSelectContent: (item: ContentItem, version: ContentVersion, activities: LearningActivity[]) => void;
}

export const LearnCatalog: React.FC<LearnCatalogProps> = ({ onSelectContent }) => {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, LearnerContentProgress>>({});
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedCefr, setSelectedCefr] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadCatalog = async () => {
      setLoading(true);
      try {
        const publishedItems = await contentCentredService.getContentItems({ status: 'published' });
        setItems(publishedItems);

        const auth = authService.getState();
        const userId = auth.user?.id || 'guest_user';
        const progressList = await contentCentredService.getAllLearnerProgress(userId);
        const map: Record<string, LearnerContentProgress> = {};
        for (const p of progressList) {
          map[p.content_item_id] = p;
        }
        setProgressMap(map);
      } catch (err) {
        console.warn('Error loading learn catalog:', err);
      } finally {
        setLoading(false);
      }
    };
    loadCatalog();
  }, []);

  const handleCardClick = async (item: ContentItem) => {
    try {
      const full = await contentCentredService.getContentItemById(item.id);
      if (full && full.version) {
        const activities = await contentCentredService.getActivitiesForVersion(full.version.id);
        onSelectContent(full, full.version, activities);
      }
    } catch (err) {
      console.warn('Error loading article:', err);
    }
  };

  const filteredItems = items.filter(it => {
    if (selectedLanguage !== 'all' && it.target_language !== selectedLanguage) return false;
    if (selectedGenre !== 'all' && it.genre !== selectedGenre) return false;
    if (selectedCefr !== 'all' && it.primary_cefr !== selectedCefr) return false;
    if (searchQuery.trim() && !it.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const featuredItem = filteredItems.length > 0 ? filteredItems[0] : null;
  const remainingItems = filteredItems.slice(1);

  return (
    <div className="space-y-12 max-w-6xl mx-auto">
      {/* Editorial Masthead Header */}
      <header className="border-b border-stone-200 pb-8 space-y-3">
        <div className="flex items-center justify-between text-xs text-stone-500 uppercase tracking-widest font-medium">
          <span>Lexilume Gazette & Library</span>
          <span>Authentic Language Acquisition</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-serif font-bold text-stone-900 tracking-tight leading-tight">
          The Reading Room
        </h1>
        <p className="text-sm sm:text-base text-stone-600 max-w-2xl leading-relaxed">
          Acquire vocabulary, idioms, and natural grammar directly through authentic texts, stories, dialogues, and cultural narratives. Select any story below to begin reading.
        </p>
      </header>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2 border-b border-stone-200">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search stories, essays & dialogues..."
            className="w-full bg-white border border-stone-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-500 transition-colors"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Target Language */}
          <select
            value={selectedLanguage}
            onChange={e => setSelectedLanguage(e.target.value)}
            className="bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-700 focus:outline-none focus:border-stone-500 cursor-pointer"
          >
            <option value="all">All Languages</option>
            <option value="en">English</option>
            <option value="pt">Portuguese</option>
            <option value="es">Spanish</option>
          </select>

          {/* Genre */}
          <select
            value={selectedGenre}
            onChange={e => setSelectedGenre(e.target.value)}
            className="bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-700 focus:outline-none focus:border-stone-500 cursor-pointer"
          >
            <option value="all">All Genres</option>
            <option value="culture_and_travel">Culture & Travel</option>
            <option value="conversation">Conversation</option>
            <option value="dialogue">Dialogue</option>
            <option value="short_story">Short Story</option>
            <option value="workplace_email">Workplace Email</option>
            <option value="news_article">News Article</option>
          </select>

          {/* CEFR */}
          <select
            value={selectedCefr}
            onChange={e => setSelectedCefr(e.target.value)}
            className="bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-700 focus:outline-none focus:border-stone-500 cursor-pointer"
          >
            <option value="all">All CEFR Levels</option>
            <option value="A1">A1 Beginner</option>
            <option value="A2">A2 Elementary</option>
            <option value="B1">B1 Intermediate</option>
            <option value="B2">B2 Upper-Int.</option>
            <option value="C1">C1 Advanced</option>
          </select>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="py-20 text-center space-y-3 bg-white border border-stone-200/80 rounded-xl">
          <BookOpen className="w-9 h-9 text-stone-400 mx-auto" />
          <h3 className="text-base font-serif font-bold text-stone-800">No Content Matches Filters</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Try adjusting your search keywords or language filters to discover authentic learning texts.
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Featured Lead Editorial Item */}
          {featuredItem && !searchQuery && (
            <article
              onClick={() => handleCardClick(featuredItem)}
              className="group p-6 sm:p-8 bg-white border border-stone-200 rounded-2xl shadow-xs hover:border-stone-400 transition-all duration-200 cursor-pointer relative"
            >
              <div className="max-w-3xl space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                    Featured Reading
                  </span>
                  <Badge variant="indigo">{featuredItem.target_language.toUpperCase()}</Badge>
                  <Badge variant="slate">{featuredItem.primary_cefr}</Badge>
                  <span className="text-xs text-stone-500 flex items-center gap-1 ml-auto">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    ~{featuredItem.estimated_read_minutes} min read
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 group-hover:text-stone-700 transition-colors leading-tight">
                  {featuredItem.title}
                </h2>

                <p className="text-sm text-stone-600 leading-relaxed line-clamp-3">
                  {featuredItem.summary || 'Authentic educational narrative crafted for reading practice.'}
                </p>

                <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-stone-900 group-hover:translate-x-1 transition-transform">
                  <span>Start Reading Story</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </article>
          )}

          {/* Editorial Articles Grid */}
          {(() => {
            const gridItems = (featuredItem && !searchQuery) ? filteredItems.slice(1) : filteredItems;
            if (gridItems.length === 0) return null;

            return (
              <div className="space-y-4">
                <h3 className="text-xs uppercase tracking-widest font-bold text-stone-500 border-b border-stone-200 pb-2">
                  Catalog Stories & Articles ({gridItems.length})
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {gridItems.map(item => {
                    const progress = progressMap[item.id];
                    const isStarted = progress && progress.status !== 'not_started';
                    const isDone = progress?.status === 'completed';

                    return (
                      <article
                        key={item.id}
                        onClick={() => handleCardClick(item)}
                        className="group bg-white border border-stone-200 hover:border-stone-400 rounded-xl p-5 flex flex-col justify-between transition-all duration-150 cursor-pointer shadow-xs"
                      >
                        <div className="space-y-3">
                          {/* Badges & Meta */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <Badge variant="indigo">{item.target_language.toUpperCase()}</Badge>
                              <Badge variant="slate">{item.primary_cefr}</Badge>
                            </div>
                            <span className="text-[11px] text-stone-500 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-stone-400" />
                              ~{item.estimated_read_minutes} min
                            </span>
                          </div>

                          {/* Title & Summary */}
                          <div>
                            <h4 className="text-base font-serif font-bold text-stone-900 group-hover:text-stone-700 transition-colors line-clamp-2 leading-snug">
                              {item.title}
                            </h4>
                            <p className="text-xs text-stone-600 mt-2 line-clamp-3 leading-relaxed">
                              {item.summary || 'Authentic educational narrative crafted for reading practice.'}
                            </p>
                          </div>
                        </div>

                        {/* Progress & Read Action */}
                        <div className="pt-4 border-t border-stone-100 mt-4">
                          {isStarted && (
                            <div className="mb-2 space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-stone-500">Progress</span>
                                <span className="font-medium text-stone-700">{progress.percent_complete}%</span>
                              </div>
                              <div className="w-full h-1 bg-stone-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-stone-800 rounded-full"
                                  style={{ width: `${progress.percent_complete}%` }}
                                />
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-xs font-medium text-stone-900 group-hover:text-stone-700">
                            <span>{isDone ? 'Review Text' : isStarted ? 'Continue Reading' : 'Read Text'}</span>
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
