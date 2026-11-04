import React from 'react';
import { BookMarked, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { useI18n } from '../../../i18n/i18nContext';

interface VocabularySummaryProps {
  dueSRSCount: number;
  savedThisWeekCount: number;
  onReviewDue: () => void;
  onOpenVocabulary: () => void;
  isLoading?: boolean;
}

export const VocabularySummary: React.FC<VocabularySummaryProps> = ({
  dueSRSCount,
  savedThisWeekCount,
  onReviewDue,
  onOpenVocabulary,
  isLoading = false,
}) => {
  const { t } = useI18n();

  return (
    <section aria-label="Vocabulary & Spaced Repetition" className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-7 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-100">
        <div>
          <span className="text-xs uppercase tracking-widest text-stone-500 font-semibold block mb-1">
            {t('dashboard:vocabulary_kicker', 'Spaced Repetition & Recall')}
          </span>
          <h2 className="font-serif text-2xl font-bold text-stone-900 tracking-tight">
            {t('dashboard:vocabulary_summary_title', 'Vocabulary Summary')}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {dueSRSCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200/80">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>{dueSRSCount} {t('dash_srs_due_terms', 'terms due today')}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t('dashboard:all_reviews_completed', 'All caught up')}</span>
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-5">
        {/* Metric 1: Due Words */}
        <div className="p-4 rounded-xl bg-stone-50/70 border border-stone-200/70">
          <div className="text-xs font-medium text-stone-500 mb-1">
            {t('dashboard:due_today_title', 'Due for Review Today')}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-stone-900">
              {dueSRSCount}
            </span>
            <span className="text-xs text-stone-500 font-sans">
              {dueSRSCount === 1 ? 'word' : 'words'}
            </span>
          </div>
          <p className="text-xs text-stone-600 mt-1">
            {dueSRSCount > 0
              ? t('dashboard:words_ready_desc', 'Scheduled for active recall via the SM-2 algorithm.')
              : t('dashboard:words_caught_up_desc', 'No terms pending review. New intervals will unlock tomorrow.')}
          </p>
        </div>

        {/* Metric 2: Saved this week */}
        <div className="p-4 rounded-xl bg-stone-50/70 border border-stone-200/70">
          <div className="text-xs font-medium text-stone-500 mb-1">
            {t('dashboard:saved_recently_title', 'Saved in Past 7 Days')}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-stone-900">
              {savedThisWeekCount}
            </span>
            <span className="text-xs text-stone-500 font-sans">
              {savedThisWeekCount === 1 ? 'word' : 'words'}
            </span>
          </div>
          <p className="text-xs text-stone-600 mt-1">
            {t('dashboard:saved_words_desc', 'Discovered during reading, dialogues, and contextual lookups.')}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
        <p className="text-xs text-stone-500 order-2 sm:order-1">
          {t('dashboard:lookup_tip', 'Tap any word while reading stories or poetry to save it to your lexicon.')}
        </p>

        <div className="flex items-center gap-2.5 w-full sm:w-auto order-1 sm:order-2">
          {dueSRSCount > 0 && (
            <Button
              variant="primary"
              size="md"
              onClick={onReviewDue}
              className="flex-1 sm:flex-initial"
              icon={<Sparkles className="w-4 h-4 text-amber-300" />}
            >
              {t('dashboard:review_due_words_btn', 'Review Due Words')} ({dueSRSCount})
            </Button>
          )}

          <Button
            variant="outline"
            size="md"
            onClick={onOpenVocabulary}
            className="flex-1 sm:flex-initial"
            icon={<BookMarked className="w-4 h-4 text-stone-600" />}
          >
            <span>{t('dashboard:my_words_btn', 'My Words')}</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 text-stone-400" />
          </Button>
        </div>
      </div>
    </section>
  );
};
