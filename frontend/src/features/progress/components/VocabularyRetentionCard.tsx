import React from 'react';
import { BookOpen, Sparkles, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { useI18n } from '../../../i18n/i18nContext';

interface VocabularyRetentionCardProps {
  presentedCount: number;
  learningCount: number;
  reviewingCount: number;
  masteredCount: number;
  dueCount: number;
  onNavigatePractice?: () => void;
}

export const VocabularyRetentionCard: React.FC<VocabularyRetentionCardProps> = ({
  presentedCount,
  learningCount,
  reviewingCount,
  masteredCount,
  dueCount,
  onNavigatePractice,
}) => {
  const { t } = useI18n();
  const totalEncountered = presentedCount + learningCount + reviewingCount + masteredCount;
  const consolidationPct =
    totalEncountered > 0 ? Math.round(((reviewingCount + masteredCount) / totalEncountered) * 100) : 0;

  return (
    <Card
      title={t('progress:sm2_lexicon_title', 'Lexicon Distribution by SuperMemo SM-2 Stage')}
      subtitle={t(
        'progress:sm2_lexicon_subtitle',
        'Pedagogical differentiation between exposed, working, and consolidated long-term memory'
      )}
    >
      {/* 4 SM-2 Distribution Stages */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-center">
        {/* Stage 1: Presented */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-left relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {t('progress:stage_1_presented', '1. Presented')}
            </span>
            <span className="w-2 h-2 rounded-full bg-slate-500" />
          </div>
          <span className="text-2xl font-black text-slate-200 block mt-1">{presentedCount}</span>
          <span className="text-[11px] text-slate-500 block mt-1">
            {t('progress:stage_1_desc', 'Exposed in lesson (0 recalls)')}
          </span>
        </div>

        {/* Stage 2: Learning */}
        <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-900/40 text-left relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
              {t('progress:stage_2_learning', '2. Learning')}
            </span>
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
          </div>
          <span className="text-2xl font-black text-indigo-400 block mt-1">{learningCount}</span>
          <span className="text-[11px] text-indigo-300/70 block mt-1">
            {t('progress:stage_2_desc', '1–2 successful recalls')}
          </span>
        </div>

        {/* Stage 3: Reviewing */}
        <div className="p-4 rounded-2xl bg-sky-950/20 border border-sky-900/40 text-left relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-sky-300 uppercase tracking-wider">
              {t('progress:stage_3_reviewing', '3. Reviewing')}
            </span>
            <span className="w-2 h-2 rounded-full bg-sky-400" />
          </div>
          <span className="text-2xl font-black text-sky-400 block mt-1">{reviewingCount}</span>
          <span className="text-[11px] text-sky-300/70 block mt-1">
            {t('progress:stage_3_desc', '3–4 spaced repetitions')}
          </span>
        </div>

        {/* Stage 4: Mastered */}
        <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-900/40 text-left relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
              {t('progress:stage_4_mastered', '4. Mastered')}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <span className="text-2xl font-black text-emerald-400 block mt-1">{masteredCount}</span>
          <span className="text-[11px] text-emerald-300/70 block mt-1">
            {t('progress:stage_4_desc', '≥5 recalls & ≥21 days')}
          </span>
        </div>
      </div>

      {/* Due Reviews & Practice Banner */}
      <div className="mt-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              dueCount > 0
                ? 'bg-amber-950/50 border border-amber-700/60 text-amber-400'
                : 'bg-emerald-950/50 border border-emerald-700/60 text-emerald-400'
            }`}
          >
            {dueCount > 0 ? <Clock className="w-5 h-5 animate-pulse" /> : <CheckCircle2 className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-200">
                {dueCount > 0
                  ? `${dueCount} ${t('progress:words_due_today', 'vocabulary terms due for review today')}`
                  : t('progress:all_caught_up', 'All reviews caught up for today!')}
              </span>
              <Badge variant={dueCount > 0 ? 'amber' : 'emerald'} size="sm">
                {t('progress:consolidation_rate', 'Consolidation')}: {consolidationPct}%
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {t(
                'progress:retention_explanation',
                'SuperMemo SM-2 recalculates optimal review intervals to prevent forgetting curve lapses.'
              )}
            </p>
          </div>
        </div>

        {onNavigatePractice && (
          <Button
            variant={dueCount > 0 ? 'primary' : 'outline'}
            size="sm"
            icon={<ArrowRight className="w-4 h-4" />}
            onClick={onNavigatePractice}
            className="shrink-0 text-xs font-semibold cursor-pointer"
          >
            {dueCount > 0
              ? t('progress:review_due_words_btn', 'Review Due Flashcards')
              : t('progress:practice_vocab_btn', 'Open Practice Studio')}
          </Button>
        )}
      </div>
    </Card>
  );
};
