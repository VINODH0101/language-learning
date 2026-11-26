import React from 'react';
import { Target, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { ProgressBar } from '../../../components/common/ProgressBar';
import { Button } from '../../../components/common/Button';
import { useI18n } from '../../../i18n/i18nContext';

interface DailyLearningGoalProps {
  dailyGoalMinutes: number;
  elapsedMinutes: number;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
}

export const DailyLearningGoal: React.FC<DailyLearningGoalProps> = ({
  dailyGoalMinutes,
  elapsedMinutes,
  isLoading = false,
  isError = false,
  errorMessage,
  onRetry,
}) => {
  const { t } = useI18n();

  // Skeleton loading state
  if (isLoading) {
    return (
      <section aria-label="Daily Learning Goal" className="bg-white border border-stone-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-3.5 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="space-y-1.5">
            <div className="w-20 h-3 bg-stone-100 rounded" />
            <div className="w-36 h-5 bg-stone-100 rounded" />
          </div>
          <div className="w-24 h-4 bg-stone-100 rounded" />
        </div>
        <div className="w-full h-2.5 bg-stone-100 rounded-full" />
        <div className="flex justify-between items-center">
          <div className="w-28 h-3 bg-stone-100 rounded" />
          <div className="w-20 h-3 bg-stone-100 rounded" />
        </div>
      </section>
    );
  }

  // Error state
  if (isError) {
    return (
      <section aria-label="Daily Learning Goal" className="bg-white border border-amber-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-serif font-bold text-sm text-stone-900">
                {t('dashboard:error_goal_title', 'Unable to calculate goal progress')}
              </h3>
              <p className="text-xs text-stone-600">
                {errorMessage || t('dashboard:error_goal_desc', 'Study time tracking is temporarily unavailable.')}
              </p>
            </div>
          </div>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry} icon={<RefreshCw className="w-3 h-3" />}>
              {t('common:retry', 'Retry')}
            </Button>
          )}
        </div>
      </section>
    );
  }

  const goalProgressPct = Math.min(
    100,
    dailyGoalMinutes > 0 ? Math.round((elapsedMinutes / dailyGoalMinutes) * 100) : 0
  );

  const remainingMinutes = Math.max(0, dailyGoalMinutes - elapsedMinutes);

  return (
    <section aria-label="Daily Learning Goal" className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm">
        <div>
          <span className="text-xs uppercase tracking-widest text-stone-500 font-semibold block mb-0.5">
            {t('dashboard:daily_focus_kicker', 'Daily Focus')}
          </span>
          <h2 className="font-serif text-lg font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <Target className="w-4 h-4 text-stone-600" />
            <span>{t('dash_goal_progress_title', 'Daily Goal Progress')}</span>
          </h2>
        </div>

        <span className="font-semibold text-stone-800 text-sm">
          {elapsedMinutes} {t('dash_goal_of', 'of')} {dailyGoalMinutes} min ({goalProgressPct}%)
        </span>
      </div>

      <ProgressBar progress={goalProgressPct} variant="bronze" />

      <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
        <span className="font-medium text-stone-600">
          {t('dash_daily_pace_title', 'Daily Learning Pace')}: {dailyGoalMinutes} min
        </span>

        <span className="font-medium text-stone-700">
          {goalProgressPct >= 100 ? (
            <span className="inline-flex items-center gap-1 text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t('dash_goal_achieved', 'Goal achieved today!')}</span>
            </span>
          ) : (
            `${remainingMinutes} ${t('dash_goal_remaining', 'min remaining')}`
          )}
        </span>
      </div>
    </section>
  );
};
