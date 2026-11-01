import React from 'react';
import { Sparkles, BookOpen, Languages } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { useI18n } from '../../../i18n/i18nContext';

interface PracticeReminderProps {
  dueSRSCount: number;
  onNavigateTab: (tab: 'practice' | 'vocabulary' | 'translate') => void;
}

export const PracticeReminder: React.FC<PracticeReminderProps> = ({
  dueSRSCount,
  onNavigateTab,
}) => {
  const { t } = useI18n();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* SRS Flashcards Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <h3 className="font-bold text-sm text-slate-100">{t('dash_srs_card_title')}</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {dueSRSCount > 0
              ? t('dash_srs_card_desc_due').replace('{count}', String(dueSRSCount))
              : t('dash_srs_card_desc_clean')}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full min-h-[44px] text-xs cursor-pointer"
          onClick={() => onNavigateTab('practice')}
        >
          {t('dash_srs_card_btn')}
        </Button>
      </div>

      {/* Vocabulary Library Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-sm text-slate-100">{t('dash_vocab_card_title')}</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {t('dash_vocab_card_desc')}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full min-h-[44px] text-xs text-indigo-300 border-indigo-700/50 hover:bg-indigo-950/40 cursor-pointer"
          onClick={() => onNavigateTab('vocabulary')}
        >
          {t('dash_vocab_card_btn')}
        </Button>
      </div>

      {/* Translation & False Friends */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm text-slate-100">{t('dash_translate_card_title')}</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {t('dash_translate_card_desc')}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full min-h-[44px] text-xs cursor-pointer"
          onClick={() => onNavigateTab('translate')}
        >
          {t('dash_translate_card_btn')}
        </Button>
      </div>
    </div>
  );
};
