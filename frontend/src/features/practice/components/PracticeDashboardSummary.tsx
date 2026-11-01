import React from 'react';
import { Target, Sparkles, BookOpen, ArrowRight, CheckCircle2, Flame } from 'lucide-react';
import { Language } from '../../../types';
import { getLanguageName } from '../../../lib/languages/languageMatrix';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { ProgressBar } from '../../../components/common/ProgressBar';
import { useI18n } from '../../../i18n/i18nContext';
import { PracticeCategory, PracticeSubMode } from '../types';

interface PracticeDashboardSummaryProps {
  language: Language;
  cefrLevel: string;
  dueCount: number;
  newCount: number;
  todayReviewed: number;
  dailyTarget: number;
  onQuickStart: () => void;
  onSelectCategory: (cat: PracticeCategory, subMode?: PracticeSubMode) => void;
}

export const PracticeDashboardSummary: React.FC<PracticeDashboardSummaryProps> = ({
  language,
  cefrLevel,
  dueCount,
  newCount,
  todayReviewed,
  dailyTarget,
  onQuickStart,
  onSelectCategory,
}) => {
  const { t, interfaceLanguage } = useI18n();
  const progressPct = Math.min(100, Math.round((todayReviewed / dailyTarget) * 100));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        {/* Track & CEFR Status */}
        <div className="p-3.5 bg-slate-850/70 border border-slate-800/80 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            {t('practice:summary_track_label', 'Trilha Ativa')}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-slate-100">
              {getLanguageName(language, (interfaceLanguage as any) || 'en')}
            </span>
            <Badge variant="indigo" size="sm">
              CEFR {cefrLevel}
            </Badge>
          </div>
        </div>

        {/* Due Cards */}
        <div className="p-3.5 bg-slate-850/70 border border-slate-800/80 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            {t('practice:summary_due_label', 'Recordação Pendente')}
          </span>
          <div className="flex items-center justify-between">
            <span className={`text-2xl font-black ${dueCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {dueCount}
            </span>
            <Badge variant={dueCount > 0 ? 'rose' : 'emerald'} size="sm">
              {dueCount > 0 ? t('practice:due_items', 'Para Hoje') : t('practice:all_clear', 'Em Dia')}
            </Badge>
          </div>
        </div>

        {/* New Vocabulary */}
        <div className="p-3.5 bg-slate-850/70 border border-slate-800/80 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            {t('practice:summary_new_label', 'Novos Vocábulos')}
          </span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-sky-400">
              {newCount}
            </span>
            <button
              onClick={() => onSelectCategory('vocabulary', 'srs')}
              className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold cursor-pointer underline"
            >
              {t('practice:explore_vocab', 'Aprender Novos')}
            </button>
          </div>
        </div>

        {/* Quick Start Action */}
        <div className="flex flex-col justify-center">
          <Button
            variant={dueCount > 0 ? 'primary' : 'outline'}
            size="md"
            icon={<ArrowRight className="w-4 h-4" />}
            onClick={onQuickStart}
            className="w-full justify-center text-xs font-bold cursor-pointer min-h-[44px]"
          >
            {dueCount > 0
              ? `${t('practice:review_now', 'Revisar')} (${dueCount})`
              : t('practice:start_free_practice', 'Praticar Vocabulário')}
          </Button>
        </div>
      </div>

      {/* Daily Review Goal Progress */}
      <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
          <Target className="w-4 h-4 text-indigo-400" />
          <span>{t('practice:daily_goal_label', 'Meta Diária de Revisões SM-2:')}</span>
          <span className="font-mono text-indigo-300 font-bold">
            {todayReviewed} / {dailyTarget} ({progressPct}%)
          </span>
        </div>
        <div className="w-full sm:w-64">
          <ProgressBar progress={progressPct} variant="indigo" />
        </div>
      </div>
    </div>
  );
};
