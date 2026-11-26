import React from 'react';
import { BookOpen, Clock, Flame } from 'lucide-react';
import { Badge } from '../../../components/common/Badge';
import { ProgressBar } from '../../../components/common/ProgressBar';
import { useI18n } from '../../../i18n/i18nContext';

interface LearningOverviewGridProps {
  currentCefr: string;
  targetCefr: string;
  totalCompletedNodes: number;
  totalCurriculumNodes: number;
  completionPct: number;
  totalAttempts: number;
  correctAttempts: number;
  accuracyPct: number;
  masteredVocabCount: number;
  todayStudyMinutes: number;
  streakDays: number;
}

/**
 * A single, calm "at a glance" panel.
 *
 * Three primary numbers answer the questions a learner actually asks —
 * where am I, how far through the path am I, and how accurate am I — while
 * study time, streak and mastered words stay as quiet supporting detail.
 */
export const LearningOverviewGrid: React.FC<LearningOverviewGridProps> = ({
  currentCefr,
  targetCefr,
  totalCompletedNodes,
  totalCurriculumNodes,
  completionPct,
  totalAttempts,
  correctAttempts,
  accuracyPct,
  masteredVocabCount,
  todayStudyMinutes,
  streakDays,
}) => {
  const { t } = useI18n();
  const hasCurriculum = totalCurriculumNodes > 0;

  return (
    <section className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-7 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-xl font-bold text-stone-900">
          {t('progress:overview_title', 'Your progress so far')}
        </h2>
        <Badge variant="slate" size="sm">
          {currentCefr} → {targetCefr}
        </Badge>
      </div>

      {/* Primary metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
        {/* Estimated CEFR */}
        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            {t('progress:card_cefr_level', 'Estimated CEFR')}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-serif text-3xl font-bold text-stone-900">{currentCefr}</span>
            <span className="text-xs text-stone-500">
              {t('progress:target_level', 'Target Level')}: {targetCefr}
            </span>
          </div>
        </div>

        {/* Curriculum completion */}
        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
              {t('progress:card_curriculum', 'Curriculum Units')}
            </span>
            <span className="text-xs font-mono font-bold text-stone-700">
              {hasCurriculum ? `${totalCompletedNodes} / ${totalCurriculumNodes}` : '0 / 0'}
            </span>
          </div>
          <div className="font-serif text-3xl font-bold text-stone-900 mt-1">
            {hasCurriculum ? `${completionPct}%` : '—'}
          </div>
          <div className="mt-2">
            {hasCurriculum ? (
              <ProgressBar progress={completionPct} variant="bronze" />
            ) : (
              <p className="text-[10px] text-stone-500 italic">
                {t('progress:content_curation', 'Curriculum in preparation')}
              </p>
            )}
          </div>
        </div>

        {/* Exercise accuracy */}
        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
              {t('progress:card_accuracy', 'Track Accuracy')}
            </span>
            <span className="text-xs font-mono font-bold text-stone-700">
              {correctAttempts} / {totalAttempts}
            </span>
          </div>
          <div className="font-serif text-3xl font-bold text-stone-900 mt-1">
            {totalAttempts > 0 ? `${accuracyPct}%` : '—'}
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            {totalAttempts > 0
              ? t('progress:based_on_attempts', 'Language-scoped attempts')
              : t('progress:no_attempts_yet', 'No attempts registered')}
          </p>
        </div>
      </div>

      {/* Supporting detail */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-stone-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold text-stone-900">{masteredVocabCount}</div>
            <div className="text-[11px] text-stone-500">
              {t('progress:card_mastered_vocab', 'Mastered Lexicon')}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold text-stone-900">
              {todayStudyMinutes}{' '}
              <span className="text-xs font-normal text-stone-500">min</span>
            </div>
            <div className="text-[11px] text-stone-500">
              {t('progress:card_study_time', 'Study Today')}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold text-stone-900">
              {streakDays}{' '}
              <span className="text-xs font-normal text-stone-500">
                {t('common:days', 'days')}
              </span>
            </div>
            <div className="text-[11px] text-stone-500">
              {t('progress:card_streak', 'Consistency')}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
