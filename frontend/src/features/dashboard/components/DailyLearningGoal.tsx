import React from 'react';
import { Target, CheckCircle2 } from 'lucide-react';
import { ProgressBar } from '../../../components/common/ProgressBar';
import { useI18n } from '../../../i18n/i18nContext';
import { SessionDuration } from '../../../types';

interface DailyLearningGoalProps {
  dailyGoalMinutes: number;
  elapsedMinutes: number;
  sessionDuration?: SessionDuration;
  onSelectDuration?: (duration: SessionDuration) => void;
  isLoading?: boolean;
}

export const DailyLearningGoal: React.FC<DailyLearningGoalProps> = ({
  dailyGoalMinutes,
  elapsedMinutes,
  sessionDuration = '10',
  onSelectDuration,
  isLoading = false,
}) => {
  const { t } = useI18n();

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

      <ProgressBar progress={goalProgressPct} variant="indigo" />

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
