import React from 'react';
import { Clock, Zap, Target, Compass } from 'lucide-react';
import { ProgressBar } from '../../../components/common/ProgressBar';
import { useI18n } from '../../../i18n/i18nContext';
import { SessionDuration } from '../../../types';

interface DailyLearningGoalProps {
  dailyGoalMinutes: number;
  elapsedMinutes: number;
  sessionDuration: SessionDuration;
  onSelectDuration: (duration: SessionDuration) => void;
}

export const DailyLearningGoal: React.FC<DailyLearningGoalProps> = ({
  dailyGoalMinutes,
  elapsedMinutes,
  sessionDuration,
  onSelectDuration,
}) => {
  const { t } = useI18n();

  const goalProgressPct = Math.min(
    100,
    dailyGoalMinutes > 0 ? Math.round((elapsedMinutes / dailyGoalMinutes) * 100) : 0
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-400" />
          <span className="font-bold text-slate-200">{t('dash_goal_progress_title')}</span>
          <span className="text-xs text-slate-400 hidden sm:inline">
            ({dailyGoalMinutes} {t('dash_goal_scheduled')})
          </span>
        </div>

        <span className="font-bold text-indigo-300">
          {elapsedMinutes} {t('dash_goal_of')} {dailyGoalMinutes} min ({goalProgressPct}%)
        </span>
      </div>

      <ProgressBar progress={goalProgressPct} variant="indigo" />

      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <span>{t('dash_goal_tip')}</span>
        <span className="font-semibold text-slate-300">
          {goalProgressPct >= 100
            ? t('dash_goal_achieved')
            : `${Math.max(0, dailyGoalMinutes - elapsedMinutes)} ${t('dash_goal_remaining')}`}
        </span>
      </div>

      {/* Daily Learning Pace Selection */}
      <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-300">{t('dash_daily_pace_title')}:</span>
          <span className="text-[11px] text-slate-400">{t('dash_daily_pace_subtitle')}</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => onSelectDuration('5')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition min-h-[36px] ${
              sessionDuration === '5'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>{t('dash_sprint_5m')}</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectDuration('10')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition min-h-[36px] ${
              sessionDuration === '10'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-indigo-300" />
            <span>{t('dash_standard_10m')}</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectDuration('20')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition min-h-[36px] ${
              sessionDuration === '20'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-emerald-300" />
            <span>{t('dash_immersion_20m')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
