import React from 'react';
import { ArrowRight, CheckCircle2, Clock } from 'lucide-react';
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

  const stages = [
    {
      key: 'presented',
      label: t('progress:stage_1_presented', 'Presented'),
      count: presentedCount,
      desc: t('progress:stage_1_desc', 'Exposed in lesson (0 recalls)'),
      cardClass: 'bg-stone-50 border-stone-200',
      dotClass: 'bg-stone-400',
      valueClass: 'text-stone-900',
      labelClass: 'text-stone-600',
    },
    {
      key: 'learning',
      label: t('progress:stage_2_learning', 'Learning'),
      count: learningCount,
      desc: t('progress:stage_2_desc', '1–2 successful recalls'),
      cardClass: 'bg-sky-50/70 border-sky-200',
      dotClass: 'bg-sky-500',
      valueClass: 'text-sky-900',
      labelClass: 'text-sky-800',
    },
    {
      key: 'reviewing',
      label: t('progress:stage_3_reviewing', 'Reviewing'),
      count: reviewingCount,
      desc: t('progress:stage_3_desc', '3–4 spaced repetitions'),
      cardClass: 'bg-amber-50/70 border-amber-200',
      dotClass: 'bg-amber-500',
      valueClass: 'text-amber-900',
      labelClass: 'text-amber-800',
    },
    {
      key: 'mastered',
      label: t('progress:stage_4_mastered', 'Mastered'),
      count: masteredCount,
      desc: t('progress:stage_4_desc', '≥5 recalls & ≥21 days'),
      cardClass: 'bg-emerald-50/70 border-emerald-200',
      dotClass: 'bg-emerald-600',
      valueClass: 'text-emerald-900',
      labelClass: 'text-emerald-800',
    },
  ];

  return (
    <Card
      title={t('progress:sm2_lexicon_title', 'SuperMemo SM-2 Lexical Retention Stages')}
      subtitle={t(
        'progress:sm2_lexicon_subtitle',
        'Memory stages from first encounter to long-term retention'
      )}
    >
      {/* 4 SM-2 Distribution Stages */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stages.map(stage => (
          <div
            key={stage.key}
            className={`p-3.5 sm:p-4 rounded-xl border text-left ${stage.cardClass}`}
          >
            <div className="flex items-center justify-between gap-1.5 mb-1">
              <span className={`text-[11px] font-bold uppercase tracking-wider truncate ${stage.labelClass}`}>
                {stage.label}
              </span>
              <span className={`w-2 h-2 rounded-full shrink-0 ${stage.dotClass}`} aria-hidden="true" />
            </div>
            <span className={`font-serif text-2xl sm:text-3xl font-bold block mt-0.5 ${stage.valueClass}`}>
              {stage.count}
            </span>
            <span className="text-[11px] text-stone-600 block mt-1 leading-snug">
              {stage.desc}
            </span>
          </div>
        ))}
      </div>

      {/* Due Reviews & Practice Action Banner */}
      <div className="mt-4 p-4 rounded-xl bg-[#FAF9F6] border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
              dueCount > 0
                ? 'bg-amber-50 border-amber-200 text-amber-700'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}
          >
            {dueCount > 0 ? <Clock className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-stone-900">
                {dueCount > 0
                  ? `${dueCount} ${t('progress:words_due_today', 'words due today')}`
                  : t('progress:all_caught_up', 'All caught up! No items due.')}
              </span>
              <Badge variant={dueCount > 0 ? 'amber' : 'emerald'} size="sm">
                {t('progress:consolidation_rate', 'Consolidation Rate')}: {consolidationPct}%
              </Badge>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              {t(
                'progress:retention_explanation',
                'Spaced repetition brings back words right before you would forget them.'
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
            className="shrink-0 text-xs font-semibold cursor-pointer min-h-[40px] w-full sm:w-auto justify-center"
          >
            {dueCount > 0
              ? t('progress:review_due_words_btn', 'Review {{count}} Due Words', { count: dueCount })
              : t('progress:practice_vocab_btn', 'Practice Vocabulary')}
          </Button>
        )}
      </div>
    </Card>
  );
};
