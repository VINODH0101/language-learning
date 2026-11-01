import React from 'react';
import {
  Sparkles,
  BookOpen,
  HelpCircle,
  PenTool,
  CheckCircle2,
  Filter,
  Headphones,
  Mic,
  MessageSquare,
  Camera,
  Layers,
  Bookmark,
  Feather,
} from 'lucide-react';
import { PracticeCategory, PracticeSubMode } from '../types';
import { useI18n } from '../../../i18n/i18nContext';
import { Language } from '../../../types';

interface PracticeCategoryNavProps {
  selectedCategory: PracticeCategory;
  selectedSubMode: PracticeSubMode;
  language: Language;
  counts: {
    srsDue: number;
    srsTotal: number;
    phrasebook: number;
    multipleChoice: number;
    cloze: number;
    mistakes: number;
  };
  onSelectCategory: (cat: PracticeCategory, subMode?: PracticeSubMode) => void;
  onSelectSubMode: (subMode: PracticeSubMode) => void;
}

export const PracticeCategoryNav: React.FC<PracticeCategoryNavProps> = ({
  selectedCategory,
  selectedSubMode,
  language,
  counts,
  onSelectCategory,
  onSelectSubMode,
}) => {
  const { t } = useI18n();

  const categories: Array<{ id: PracticeCategory; label: string; icon: React.ReactNode }> = [
    {
      id: 'all',
      label: t('practice:cat_all', 'Todos os Modos'),
      icon: <Layers className="w-4 h-4 text-sky-400" />,
    },
    {
      id: 'vocabulary',
      label: t('practice:cat_vocabulary', 'Vocabulário & SRS'),
      icon: <Sparkles className="w-4 h-4 text-sky-400" />,
    },
    {
      id: 'exercises',
      label: t('practice:cat_exercises', 'Exercícios Práticos'),
      icon: <PenTool className="w-4 h-4 text-emerald-400" />,
    },
    {
      id: 'receptive',
      label: t('practice:cat_receptive', 'Compreensão (Áudio e Leitura)'),
      icon: <Headphones className="w-4 h-4 text-indigo-400" />,
    },
    {
      id: 'productive',
      label: t('practice:cat_productive', 'Produção (Fala e Escrita)'),
      icon: <Mic className="w-4 h-4 text-purple-400" />,
    },
    {
      id: 'tools',
      label: t('practice:cat_tools', 'Ferramentas de Estudo'),
      icon: <Camera className="w-4 h-4 text-amber-400" />,
    },
  ];

  return (
    <div className="space-y-3">
      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800 no-scrollbar">
        {categories.map(cat => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-slate-800 text-sky-400 border border-sky-500/40 shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800'
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sub-Mode Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {(selectedCategory === 'all' || selectedCategory === 'vocabulary') && (
          <>
            <button
              onClick={() => onSelectSubMode('srs')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                selectedSubMode === 'srs'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-850 text-slate-400 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>
                {t('practice:submode_srs', 'Cartões SM-2')} (
                {counts.srsDue > 0
                  ? t('practice:submode_srs_due', '{{count}} pendentes', { count: counts.srsDue })
                  : t('practice:submode_srs_total', '{{count}} total', { count: counts.srsTotal })})
              </span>
            </button>

            <button
              onClick={() => onSelectSubMode('phrasebook')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                selectedSubMode === 'phrasebook'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-850 text-slate-400 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('practice:submode_phrasebook', 'Palavras Salvas')} ({counts.phrasebook})</span>
            </button>

            <button
              onClick={() => onSelectSubMode('daily_poetry_vocab')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                selectedSubMode === 'daily_poetry_vocab'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-850 text-slate-400 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Feather className="w-3.5 h-3.5 text-purple-400" />
              <span>{t('practice:submode_daily_poetry', 'Poesia do Dia (Léxico)')}</span>
            </button>
          </>
        )}

        {(selectedCategory === 'all' || selectedCategory === 'exercises') && (
          <>
            <button
              onClick={() => onSelectSubMode('multiple_choice')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                selectedSubMode === 'multiple_choice'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-850 text-slate-400 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('practice:submode_multiple_choice', 'Múltipla Escolha')} ({counts.multipleChoice})</span>
            </button>

            <button
              onClick={() => onSelectSubMode('cloze')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                selectedSubMode === 'cloze'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-850 text-slate-400 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <PenTool className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('practice:submode_cloze', 'Lacunas e Correção')} ({counts.cloze})</span>
            </button>

            <button
              onClick={() => onSelectSubMode('mistakes')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                selectedSubMode === 'mistakes'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-850 text-slate-400 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />
              <span>{t('practice:submode_mistakes', 'Caderno de Erros')} ({counts.mistakes})</span>
            </button>

            {(language === 'pt' || language === 'es') && (
              <button
                onClick={() => onSelectSubMode('false_friends')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                  selectedSubMode === 'false_friends'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-slate-850 text-slate-400 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <Filter className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('practice:submode_false_friends', 'Treinador Falsos Cognatos')}</span>
              </button>
            )}
          </>
        )}

        {(selectedCategory === 'all' || selectedCategory === 'receptive') && (
          <>
            <button
              onClick={() => onSelectSubMode('listening')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                selectedSubMode === 'listening'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-850 text-slate-400 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Headphones className="w-3.5 h-3.5 text-indigo-400" />
              <span>{t('practice:submode_listening', 'Listening Studio')}</span>
            </button>

            <button
              onClick={() => onSelectSubMode('reading')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                selectedSubMode === 'reading'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-850 text-slate-400 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('practice:submode_reading', 'Reading Studio')}</span>
            </button>
          </>
        )}

        {(selectedCategory === 'all' || selectedCategory === 'productive') && (
          <>
            <button
              onClick={() => onSelectSubMode('speaking')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                selectedSubMode === 'speaking'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-850 text-slate-400 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Mic className="w-3.5 h-3.5 text-purple-400" />
              <span>{t('practice:submode_speaking', 'Speaking Coach')}</span>
            </button>

            <button
              onClick={() => onSelectSubMode('conversation')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                selectedSubMode === 'conversation'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-850 text-slate-400 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
              <span>{t('practice:submode_conversation', 'Conversation Studio')}</span>
            </button>

            <button
              onClick={() => onSelectSubMode('proofreading')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                selectedSubMode === 'proofreading'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-850 text-slate-400 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <PenTool className="w-3.5 h-3.5 text-teal-400" />
              <span>{t('practice:submode_proofreading', 'Writing Coach')}</span>
            </button>
          </>
        )}

        {(selectedCategory === 'all' || selectedCategory === 'tools') && (
          <>
            <button
              onClick={() => onSelectSubMode('ocr')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                selectedSubMode === 'ocr'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-850 text-slate-400 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('practice:submode_ocr', 'Scan & Learn (OCR)')}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
