import React from 'react';
import { ArrowRight, BookOpen, Feather, MessageSquare, CheckCircle2, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { useI18n } from '../../../i18n/i18nContext';
import { RecentLearningActivity } from '../services/homeOrchestrator';

interface RecentLearningProps {
  activities: RecentLearningActivity[];
  onViewAll: () => void;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
}

export const RecentLearning: React.FC<RecentLearningProps> = ({
  activities,
  onViewAll,
  isLoading = false,
  isError = false,
  errorMessage,
  onRetry,
}) => {
  const { t } = useI18n();

  // Error state
  if (isError && activities.length === 0) {
    return (
      <section aria-label="Recent Learning Activities" className="bg-white border border-amber-200 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-serif font-bold text-stone-900">
                {t('dashboard:error_recent_title', 'Unable to load recent activity')}
              </h3>
              <p className="text-xs text-stone-600 mt-0.5">
                {errorMessage || t('dashboard:error_recent_desc', 'Could not retrieve your recent activity log.')}
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

  const getTypeIcon = (type: RecentLearningActivity['type']) => {
    switch (type) {
      case 'story':
        return <BookOpen className="w-4 h-4 text-stone-600" />;
      case 'poetry':
        return <Feather className="w-4 h-4 text-indigo-600" />;
      case 'conversation':
        return <MessageSquare className="w-4 h-4 text-emerald-600" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-stone-500" />;
    }
  };

  const getTypeLabel = (type: RecentLearningActivity['type']) => {
    switch (type) {
      case 'story':
        return t('dashboard:type_story', 'Story');
      case 'poetry':
        return t('dashboard:type_poetry', 'Poetry');
      case 'conversation':
        return t('dashboard:type_dialogue', 'Dialogue');
      case 'curriculum':
        return t('dashboard:type_lesson', 'Curriculum');
      default:
        return t('dashboard:type_practice', 'Practice');
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <section aria-label="Recent Learning Activities" className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-7 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
        <div>
          <span className="text-xs uppercase tracking-widest text-stone-500 font-semibold block mb-1">
            {t('dashboard:learning_history_kicker', 'Recent Activity')}
          </span>
          <h2 className="font-serif text-2xl font-bold text-stone-900 tracking-tight">
            {t('dashboard:recent_learning_title', 'Recently Learned')}
          </h2>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onViewAll}
          className="text-stone-700 hover:text-stone-900 self-start sm:self-auto"
        >
          <span>{t('dashboard:view_learning_history', 'View Learning History')}</span>
          <ArrowRight className="w-4 h-4 ml-1 text-stone-400" />
        </Button>
      </div>

      {isLoading && activities.length === 0 ? (
        <div className="space-y-3 pt-3 animate-pulse">
          <div className="h-12 bg-stone-100 rounded-lg" />
          <div className="h-12 bg-stone-100 rounded-lg" />
          <div className="h-12 bg-stone-100 rounded-lg" />
        </div>
      ) : activities.length === 0 ? (
        <div className="py-8 text-center text-stone-500 text-sm">
          <BookOpen className="w-8 h-8 mx-auto text-stone-300 mb-2" />
          <p className="font-medium text-stone-700">
            {t('dashboard:no_recent_activity', 'No learning history recorded yet.')}
          </p>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            {t('dashboard:start_learning_prompt', 'Open today’s edition or continue your active reading to build your learning record.')}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-stone-100">
          {activities.map(act => (
            <div
              key={act.id}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-stone-50/50 px-2 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
                  {getTypeIcon(act.type)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                      {getTypeLabel(act.type)}
                    </span>
                    <span className="text-stone-300">•</span>
                    <span className="text-xs text-stone-400">
                      {formatDate(act.date)}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-stone-900 truncate">
                    {act.title}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 pl-11 sm:pl-0">
                {act.status === 'completed' ? (
                  <Badge variant="emerald" size="sm">
                    <CheckCircle2 className="w-3 h-3 mr-0.5 text-emerald-600" />
                    <span>{t('dashboard:status_completed', 'Completed')}</span>
                  </Badge>
                ) : (
                  <Badge variant="slate" size="sm">
                    <Clock className="w-3 h-3 mr-0.5 text-stone-500" />
                    <span>{t('dashboard:status_in_progress', 'In Progress')}</span>
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};