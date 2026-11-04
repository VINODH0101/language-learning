import React from 'react';
import { Feather, MessageSquare, ArrowRight, BookOpen, AlertCircle, RefreshCw } from 'lucide-react';
import { DailyPoem, DailyConversation } from '../../../types';
import { ContentItem } from '../../../types/contentCentred';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { useI18n } from '../../../i18n/i18nContext';

interface DailyContentPreviewProps {
  dailyPoem: DailyPoem | null;
  dailyConversation: DailyConversation | null;
  publishedStories?: ContentItem[];
  onOpenPoem: () => void;
  onOpenConversation: () => void;
  onOpenStory?: (story: ContentItem) => void;
  onExploreAll?: () => void;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
}

export const DailyContentPreview: React.FC<DailyContentPreviewProps> = ({
  dailyPoem,
  dailyConversation,
  publishedStories = [],
  onOpenPoem,
  onOpenConversation,
  onOpenStory,
  onExploreAll,
  isLoading = false,
  isError = false,
  errorMessage,
  onRetry,
}) => {
  const { t } = useI18n();

  // If loading and no content is cached yet, show skeleton cards under real section header
  if (isLoading && !dailyPoem && !dailyConversation && publishedStories.length === 0) {
    return (
      <section aria-label="Today's Edition" className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <span className="text-xs uppercase tracking-widest text-stone-500 font-semibold block mb-1">
              {t('dashboard:todays_edition_kicker', "Today's Edition")}
            </span>
            <h2 className="font-serif text-2xl font-bold text-stone-900 tracking-tight">
              {t('dashboard:daily_masterpiece_learning', "Today's Edition: Daily Immersion: Poetry & Dialogue")}
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              {t('dashboard:todays_edition_subhead', 'A selection of stories, ideas and conversations to explore today.')}
            </p>
          </div>
          {onExploreAll && (
            <Button variant="outline" size="sm" onClick={onExploreAll} className="self-start sm:self-auto shrink-0">
              <span>{t('dashboard:explore_all_stories', 'Explore All')}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 text-stone-500" />
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          <div className="h-64 rounded-xl bg-stone-100 p-5" />
          <div className="h-64 rounded-xl bg-stone-100 p-5" />
          <div className="h-64 rounded-xl bg-stone-100 p-5" />
        </div>
      </section>
    );
  }

  // Error state
  if (isError && !dailyPoem && !dailyConversation && publishedStories.length === 0) {
    return (
      <section aria-label="Today's Edition" className="bg-white border border-amber-200 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-serif font-bold text-stone-900">
                {t('dashboard:error_edition_title', "Unable to load Today's Edition")}
              </h3>
              <p className="text-xs text-stone-600 mt-0.5">
                {errorMessage || t('dashboard:error_edition_desc', 'Could not retrieve daily authentic reading materials.')}
              </p>
            </div>
          </div>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry} icon={<RefreshCw className="w-3.5 h-3.5" />}>
              {t('common:retry', 'Retry')}
            </Button>
          )}
        </div>
      </section>
    );
  }

  if (!dailyPoem && !dailyConversation && publishedStories.length === 0) return null;

  return (
    <section aria-label="Today's Edition" className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
        <div>
          <span className="text-xs uppercase tracking-widest text-stone-500 font-semibold block mb-1">
            {t('dashboard:todays_edition_kicker', "Today's Edition")}
          </span>
          <h2 className="font-serif text-2xl font-bold text-stone-900 tracking-tight">
            {t('dashboard:daily_masterpiece_learning', "Today's Edition: Daily Immersion: Poetry & Dialogue")}
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            {t('dashboard:todays_edition_subhead', 'A selection of stories, ideas and conversations to explore today.')}
          </p>
        </div>

        {onExploreAll && (
          <Button
            variant="outline"
            size="sm"
            onClick={onExploreAll}
            className="self-start sm:self-auto shrink-0"
          >
            <span>{t('dashboard:explore_all_stories', 'Explore All')}</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 text-stone-500" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* 1. Daily Poetry Card */}
        {dailyPoem && (
          <article
            onClick={onOpenPoem}
            tabIndex={0}
            role="button"
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onOpenPoem()}
            className="p-5 rounded-xl bg-stone-50/70 border border-stone-200/80 hover:border-stone-300 hover:shadow-xs transition flex flex-col justify-between space-y-4 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-stone-400"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-200/70 text-stone-800">
                  <Feather className="w-3.5 h-3.5 text-stone-600" />
                  <span>{t('dashboard:daily_poetry', 'Daily Poetry')}</span>
                </span>
                <Badge variant="slate" size="sm">{dailyPoem.cefr_level}</Badge>
              </div>

              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900 group-hover:text-amber-900 transition">
                  {dailyPoem.title}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5 font-medium">
                  {dailyPoem.author} • {dailyPoem.country_name || 'Literature'}
                </p>
              </div>

              <div className="font-serif text-xs text-stone-700 italic line-clamp-3 bg-white p-3 rounded-lg border border-stone-200/70 leading-relaxed">
                "{dailyPoem.excerpt || dailyPoem.full_text.slice(0, 120)}..."
              </div>
            </div>

            <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-xs">
              <span className="text-[11px] text-stone-500 uppercase tracking-wider font-semibold">
                {dailyPoem.learning_language.toUpperCase()}
              </span>
              <span className="font-semibold text-stone-800 group-hover:text-stone-900 flex items-center gap-1">
                <span>{t('dashboard:read_poetry_btn', 'Read Poetry')}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </article>
        )}

        {/* 2. Daily Conversation Card */}
        {dailyConversation && (
          <article
            onClick={onOpenConversation}
            tabIndex={0}
            role="button"
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onOpenConversation()}
            className="p-5 rounded-xl bg-stone-50/70 border border-stone-200/80 hover:border-stone-300 hover:shadow-xs transition flex flex-col justify-between space-y-4 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-stone-400"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-200/70 text-stone-800">
                  <MessageSquare className="w-3.5 h-3.5 text-stone-600" />
                  <span>{t('dashboard:daily_conversation', 'Daily Dialogue')}</span>
                </span>
                <Badge variant="slate" size="sm">{dailyConversation.cefr_level}</Badge>
              </div>

              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900 group-hover:text-amber-900 transition">
                  {dailyConversation.title}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5 font-medium">
                  {dailyConversation.country_name || 'Everyday Exchange'}
                </p>
              </div>

              <p className="text-xs text-stone-600 line-clamp-3 bg-white p-3 rounded-lg border border-stone-200/70 leading-relaxed">
                {dailyConversation.scenario ||
                  `Interactive dialogue exploring authentic idiomatic speech and everyday scenarios.`}
              </p>
            </div>

            <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-xs">
              <span className="text-[11px] text-stone-500 uppercase tracking-wider font-semibold">
                {dailyConversation.learning_language.toUpperCase()}
              </span>
              <span className="font-semibold text-stone-800 group-hover:text-stone-900 flex items-center gap-1">
                <span>{t('dashboard:practice_dialogue_btn', 'Practice Dialogue')}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </article>
        )}

        {/* 3. Published Short Story / Culture Article */}
        {publishedStories.slice(0, 1).map(story => (
          <article
            key={story.id}
            onClick={() => onOpenStory ? onOpenStory(story) : (onExploreAll && onExploreAll())}
            tabIndex={0}
            role="button"
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (onOpenStory ? onOpenStory(story) : onExploreAll?.())}
            className="p-5 rounded-xl bg-stone-50/70 border border-stone-200/80 hover:border-stone-300 hover:shadow-xs transition flex flex-col justify-between space-y-4 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-stone-400"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-200/70 text-stone-800">
                  <BookOpen className="w-3.5 h-3.5 text-stone-600" />
                  <span>{story.genre.replace('_', ' ')}</span>
                </span>
                <Badge variant="slate" size="sm">{story.primary_cefr}</Badge>
              </div>

              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900 group-hover:text-amber-900 transition">
                  {story.title}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5 font-medium">
                  {story.estimated_read_minutes} min read • {story.author || 'Editorial'}
                </p>
              </div>

              <p className="text-xs text-stone-600 line-clamp-3 bg-white p-3 rounded-lg border border-stone-200/70 leading-relaxed">
                {story.summary}
              </p>
            </div>

            <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-xs">
              <span className="text-[11px] text-stone-500 uppercase tracking-wider font-semibold">
                {story.target_language.toUpperCase()}
              </span>
              <span className="font-semibold text-stone-800 group-hover:text-stone-900 flex items-center gap-1">
                <span>{t('dashboard:read_story_btn', 'Read Story')}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};