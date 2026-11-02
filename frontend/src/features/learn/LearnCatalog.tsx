import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  Sparkles,
  Clock,
  Layers,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import {
  ContentItem,
  ContentVersion,
  LearningActivity,
  ContentGenre,
  LearnerContentProgress,
} from '../../types/contentCentred';
import { Language, CEFRLevel } from '../../types';
import { Button } from '../../components/common/Button';
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

  return (
    <div className="space-y-8">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Content-Centred Learning</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
            Learn from Authentic Content
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Acquire vocabulary, idioms, and natural grammar directly through authentic texts, stories, dialogues, and cultural narratives. Select any story below to begin reading.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search stories & articles..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Target Language */}
          <select
            value={selectedLanguage}
            onChange={e => setSelectedLanguage(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
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
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
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
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
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

      {/* Content Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-16 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-200">No Content Matches Filters</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search keywords or language filters to discover authentic learning texts.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => {
            const progress = progressMap[item.id];
            const isStarted = progress && progress.status !== 'not_started';
            const isDone = progress?.status === 'completed';

            return (
              <div
                key={item.id}
                onClick={() => handleCardClick(item)}
                className="group bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 rounded-3xl p-6 flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-lg hover:shadow-indigo-500/10"
              >
                <div className="space-y-3.5">
                  {/* Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="indigo">{item.target_language.toUpperCase()}</Badge>
                      <Badge variant="slate">{item.primary_cefr}</Badge>
                    </div>

                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      ~{item.estimated_read_minutes} min
                    </span>
                  </div>

                  {/* Title & Summary */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                      {item.summary || 'Authentic educational narrative crafted for reading practice.'}
                    </p>
                  </div>
                </div>

                {/* Card Footer: Progress and CTA */}
                <div className="pt-5 border-t border-slate-800/80 mt-5">
                  {isStarted && (
                    <div className="mb-3 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Progress</span>
                        <span className="font-semibold text-indigo-400">
                          {progress.percent_complete}%
                        </span>
                      </div>
                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${progress.percent_complete}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs font-semibold text-indigo-400 group-hover:text-indigo-300">
                    <span>{isDone ? 'Review Text' : isStarted ? 'Continue Reading' : 'Start Reading'}</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
