import React from 'react';
import { Globe2, Sparkles, BookOpen } from 'lucide-react';
import { Language } from '../../../types';
import {
  SUPPORTED_LEARNING_LANGUAGES,
  getLanguageName,
  getRegionalVarietyLabel,
} from '../../../lib/languages/languageMatrix';
import { Badge } from '../../../components/common/Badge';
import { useI18n } from '../../../i18n/i18nContext';

interface PracticeHeaderProps {
  selectedLanguage: Language;
  regionalVariety?: string;
  onSelectLanguage: (lang: Language) => void;
}

export const PracticeHeader: React.FC<PracticeHeaderProps> = ({
  selectedLanguage,
  regionalVariety,
  onSelectLanguage,
}) => {
  const { t, interfaceLanguage } = useI18n();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
            {t('practice:header_badge', 'Centro de Treinamento e Consolidação')}
          </span>
          <Badge variant="sky" size="sm">
            {t('practice:active_badge', 'Treino Ativo')}
          </Badge>
          {regionalVariety && (
            <Badge variant="indigo" size="sm">
              {getRegionalVarietyLabel(regionalVariety as any, (interfaceLanguage as any) || 'en')}
            </Badge>
          )}
        </div>
        <h1 className="text-2xl font-bold text-slate-100">
          {t('practice:page_title', 'Prática e Recordação Espaçada')}
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
          {t(
            'practice:page_subtitle',
            'Pratique com exercícios determinísticos, flashcards de retenção SM-2, diálogos interativos e literatura diária.'
          )}
        </p>
      </div>

      {/* Language Track Selector & Quick Switchers */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {/* Quick Toggles (PT, ES, EN) */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/80">
          <button
            onClick={() => onSelectLanguage('pt')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedLanguage === 'pt'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {getLanguageName('pt', (interfaceLanguage as any) || 'en')} (PT)
          </button>
          <button
            onClick={() => onSelectLanguage('es')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedLanguage === 'es'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {getLanguageName('es', (interfaceLanguage as any) || 'en')} (ES)
          </button>
          <button
            onClick={() => onSelectLanguage('en')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedLanguage === 'en'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {getLanguageName('en', (interfaceLanguage as any) || 'en')} (EN)
          </button>
        </div>

        {/* Full 13-Language Dropdown */}
        <div className="relative min-w-[170px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Globe2 className="w-4 h-4" />
          </div>
          <select
            value={selectedLanguage}
            onChange={e => onSelectLanguage(e.target.value as Language)}
            aria-label={t('practice:select_track_aria', 'Selecionar trilha de idioma de prática')}
            className="w-full pl-9 pr-8 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer appearance-none"
          >
            {SUPPORTED_LEARNING_LANGUAGES.map(lang => (
              <option key={lang} value={lang}>
                {getLanguageName(lang, (interfaceLanguage as any) || 'en')} ({lang.toUpperCase()})
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400 text-xs">
            ▼
          </div>
        </div>
      </div>
    </div>
  );
};
