import React from 'react';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { ProgressBar } from '../../../components/common/ProgressBar';
import { useI18n } from '../../../i18n/i18nContext';

interface PracticeDashboardSummaryProps {
  cefrLevel: string;
  dueCount: number;
  newCount: number;
  todayReviewed: number;
  dailyTarget: number;
  onQuickStart: () => void;
}

/**
 * A deliberately small "today" card.
 *
 * It answers one question — what should I do right now? — with a single
 * number and a single primary action. Everything else is supporting detail.
 */
export const PracticeDashboardSummary: React.FC<PracticeDashboardSummaryProps> = ({
  cefrLevel,
  dueCount,
  newCount,
  todayReviewed,
  dailyTarget,
  onQuickStart,
}) => {
  const { t } = useI18n();
  const safeTarget = Math.max(1, dailyTarget);
  const progressPct = Math.min(100, Math.round((todayReviewed / safeTarget) * 100));
  const hasDue = dueCount > 0;

  return (
    <section
      aria-label={t('practice:today_aria', "Today's practice")}
      className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-7 shadow-xs"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-stone-500">
              {t('practice:today_kicker', "Today's recall")}
            </span>
            <Badge variant="slate" size="sm">
              CEFR {cefrLevel}
            </Badge>
            {!hasDue && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {t('practice:today_none', 'All caught up')}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
            <div className="flex items-baseline gap-2">
              <span
                className={`font-serif text-4xl sm:text-5xl font-bold leading-none tracking-tight ${
                  hasDue ? 'text-stone-900' : 'text-emerald-700'
                }`}
              >
                {dueCount}
              </span>
              <span className="text-sm text-stone-600">
                {dueCount === 1
                  ? t('practice:today_due_one', 'word due for review')
                  : t('practice:today_due_many', 'words due for review')}
              </span>
            </div>

            <p className="text-xs text-stone-500 pb-1">
              <span className="font-semibold text-stone-800">{newCount}</span>{' '}
              {t('practice:today_new_label', 'new words')}
              <span className="text-stone-300 mx-1.5">•</span>
              <span className="font-semibold text-stone-800">
                {todayReviewed}/{safeTarget}
              </span>{' '}
              {t('practice:today_reviews_label', 'reviews today')}
            </p>
          </div>

          <div className="max-w-sm">
            <div className="flex items-center justify-between text-[11px] text-stone-500 mb-1.5">
              <span>{t('practice:today_goal_label', 'Daily goal')}</span>
              <span className="font-medium text-stone-700">{progressPct}%</span>
            </div>
            <ProgressBar progress={progressPct} variant="bronze" />
          </div>
        </div>

        <div className="w-full lg:w-56 shrink-0">
          <Button
            variant="primary"
            size="lg"
            icon={hasDue ? <Sparkles className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            onClick={onQuickStart}
            className="w-full justify-center min-h-[44px]"
          >
            {hasDue
              ? t('practice:review_due', 'Review {{count}} due', { count: dueCount })
              : t('practice:start_review', 'Start reviewing')}
          </Button>
        </div>
      </div>
    </section>
  );
};
