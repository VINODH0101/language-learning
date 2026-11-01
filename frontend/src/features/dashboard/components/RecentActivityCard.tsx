import React from 'react';
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { Card } from '../../../components/common/Card';
import { StorageService } from '../../../services/storage';
import { useI18n } from '../../../i18n/i18nContext';

interface RecentActivityCardProps {
  onNavigateProgress: () => void;
}

export const RecentActivityCard: React.FC<RecentActivityCardProps> = ({
  onNavigateProgress,
}) => {
  const { t } = useI18n();

  const attempts = StorageService.getExerciseAttempts();
  const recentAttempts = attempts.slice(0, 5);
  const correctAttempts = attempts.filter(a => a.is_correct).length;
  const accuracyPct = attempts.length > 0 ? Math.round((correctAttempts / attempts.length) * 100) : 0;

  return (
    <Card
      title={t('dash_recent_activity_title')}
      subtitle={`${t('dash_accuracy_rate')}: ${accuracyPct}% (${attempts.length} ${t('dash_attempts_registered')})`}
    >
      {recentAttempts.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-xs">
          {t('dash_no_activity')}
        </div>
      ) : (
        <div className="space-y-2.5">
          {recentAttempts.map(att => (
            <div
              key={att.id}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-xs gap-3"
            >
              <div className="flex items-center gap-2.5 truncate">
                {att.is_correct ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <div className="truncate">
                  <span className="font-semibold text-slate-200 block truncate">
                    {t('dash_exercise_label')} {att.exercise_id}
                  </span>
                  <span className="text-[11px] text-slate-400 truncate block">{att.feedback}</span>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-mono shrink-0">
                {new Date(att.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onNavigateProgress}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
            >
              <span>{t('dashboard:view_full_progress', 'View Full Progress & Analytics')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </Card>
  );
};
