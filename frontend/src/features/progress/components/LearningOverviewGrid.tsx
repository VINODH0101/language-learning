import React from 'react';
import { Award, BookOpen, Target, CheckCircle2, Clock, Flame, Info } from 'lucide-react';
import { Card } from '../../../components/common/Card';
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {/* 1. Estimated CEFR Level */}
      <Card className="flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              {t('progress:card_cefr_level', 'Estimated CEFR')}
            </span>
            <Badge variant="emerald" size="sm">{currentCefr}</Badge>
          </div>
          <div className="text-3xl font-black text-slate-100 mt-2">{currentCefr}</div>
        </div>
        <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
          <Target className="w-3 h-3 text-indigo-400" />
          <span>{t('progress:target_level', 'Target Level')}: {targetCefr}</span>
        </p>
      </Card>

      {/* 2. Curriculum Completion */}
      <Card className="flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              {t('progress:card_curriculum', 'Curriculum Units')}
            </span>
            <span className="text-xs font-mono font-bold text-slate-300">
              {totalCurriculumNodes > 0 ? `${totalCompletedNodes} / ${totalCurriculumNodes}` : '0 / 0'}
            </span>
          </div>
          <div className="text-3xl font-black text-slate-100 mt-2">
            {totalCurriculumNodes > 0 ? `${completionPct}%` : '—'}
          </div>
        </div>
        <div className="mt-2">
          {totalCurriculumNodes > 0 ? (
            <ProgressBar progress={completionPct} variant="indigo" />
          ) : (
            <p className="text-[10px] text-slate-500 italic">
              {t('progress:content_curation', 'Curriculum in preparation')}
            </p>
          )}
        </div>
      </Card>

      {/* 3. Exercise Accuracy Rate (Language Scoped) */}
      <Card className="flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              {t('progress:card_accuracy', 'Track Accuracy')}
            </span>
            <span className="text-xs font-mono font-bold text-slate-300">
              {correctAttempts} / {totalAttempts}
            </span>
          </div>
          <div className="text-3xl font-black text-slate-100 mt-2">
            {totalAttempts > 0 ? `${accuracyPct}%` : '—'}
          </div>
        </div>
        <p className="text-[11px] text-slate-400 mt-2">
          {totalAttempts > 0
            ? t('progress:based_on_attempts', 'Language-scoped attempts')
            : t('progress:no_attempts_yet', 'No attempts registered')}
        </p>
      </Card>

      {/* 4. Mastered Vocabulary (SM-2) */}
      <Card className="flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              {t('progress:card_mastered_vocab', 'Mastered Lexicon')}
            </span>
            <Badge variant="emerald" size="sm">SM-2</Badge>
          </div>
          <div className="text-3xl font-black text-emerald-400 mt-2">{masteredVocabCount}</div>
        </div>
        <p className="text-[11px] text-slate-400 mt-2">
          {t('progress:sm2_threshold', '≥5 recalls / ≥21 days')}
        </p>
      </Card>

      {/* 5. Tracked Study Time Today */}
      <Card className="flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              {t('progress:card_study_time', 'Study Today')}
            </span>
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-3xl font-black text-slate-100 mt-2">
            {todayStudyMinutes} <span className="text-sm font-normal text-slate-400">min</span>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 mt-2">
          {t('progress:zero_fabrication_time', 'Real tracked duration')}
        </p>
      </Card>

      {/* 6. Learning Streak */}
      <Card className="flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              {t('progress:card_streak', 'Consistency')}
            </span>
            <Flame className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400 mt-2">
            {streakDays} <span className="text-sm font-normal text-slate-400">{t('common:days', 'days')}</span>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 mt-2">
          {t('progress:active_daily_streak', 'Continuous learning streak')}
        </p>
      </Card>
    </div>
  );
};
