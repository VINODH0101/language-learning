import React from 'react';
import { Award, ChevronDown, Compass, Globe } from 'lucide-react';
import { Language, UserTrackState, Course } from '../../../types';
import {
  SUPPORTED_LEARNING_LANGUAGES,
  LANGUAGE_METADATA,
  getLanguageName,
  getRegionalVarietyLabel,
} from '../../../lib/languages/languageMatrix';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { useI18n } from '../../../i18n/i18nContext';

interface ProgressHeaderProps {
  selectedLang: Language;
  onSelectLang: (lang: Language) => void;
  track: UserTrackState;
  activeCourse?: Course;
  onOpenDiagnostic: () => void;
  hasDiagnosticAvailable: boolean;
}

export const ProgressHeader: React.FC<ProgressHeaderProps> = ({
  selectedLang,
  onSelectLang,
  track,
  activeCourse,
  onOpenDiagnostic,
  hasDiagnosticAvailable,
}) => {
  const { t, interfaceLanguage } = useI18n();

  const currentMeta = LANGUAGE_METADATA[selectedLang] || {
    flag: '🌐',
    code: selectedLang,
    nameEn: selectedLang,
  };

  const varietyCode = activeCourse?.regional_variant || track.regional_variety;
  const varietyLabel = getRegionalVarietyLabel(varietyCode, interfaceLanguage);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
      <div>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5" />
            {t('navigation:nav_progress', 'Progress & Learning Analytics')}
          </span>
          <Badge variant="emerald" size="sm">
            {t('dashboard:cefr_level', 'CEFR')}: {track.current_cefr_level}
          </Badge>
          <Badge variant="indigo" size="sm">
            {varietyLabel}
          </Badge>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 flex items-center gap-3">
          <span>{currentMeta.flag}</span>
          <span>{getLanguageName(selectedLang, interfaceLanguage)}</span>
          <span className="text-xs font-normal text-slate-400 font-mono">({selectedLang})</span>
        </h1>

        <p className="text-xs text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
          {t(
            'progress:header_description',
            'Language-specific progress analytics, SuperMemo SM-2 retention stages, and evidence-based curriculum progression.'
          )}
        </p>

        {activeCourse && (
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-400 flex-wrap">
            <span>
              {t('dashboard:goal_title', 'Daily Goal')}:{' '}
              <strong className="text-slate-200">{activeCourse.daily_goal_minutes} min</strong>
            </span>
            <span>•</span>
            <span>
              {t('dashboard:streak', 'Streak')}:{' '}
              <strong className="text-amber-400">{activeCourse.streak_days} {t('common:days', 'days')}</strong>
            </span>
            <span>•</span>
            <span>
              {t('progress:explanation_lang', 'Explanations')}:{' '}
              <strong className="text-slate-200 uppercase">{activeCourse.explanation_language}</strong>
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-wrap">
        {/* Quick Track Switcher for primary tracks + All-Languages Dropdown */}
        <div className="flex items-center gap-2 bg-slate-950/70 p-1.5 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => onSelectLang('pt')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedLang === 'pt'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Português
          </button>
          <button
            type="button"
            onClick={() => onSelectLang('es')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedLang === 'es'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Español
          </button>
          <button
            type="button"
            onClick={() => onSelectLang('en')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedLang === 'en'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            English
          </button>

          {/* Complete 13 languages selector */}
          <div className="relative pl-1 border-l border-slate-800">
            <select
              aria-label={t('progress:select_all_languages', 'All Supported Languages')}
              value={selectedLang}
              onChange={e => onSelectLang(e.target.value as Language)}
              className="appearance-none bg-slate-800/80 hover:bg-slate-750 text-slate-200 text-xs font-bold py-1.5 pl-2.5 pr-7 rounded-xl border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {SUPPORTED_LEARNING_LANGUAGES.map(lang => {
                const meta = LANGUAGE_METADATA[lang];
                const localizedName = getLanguageName(lang, interfaceLanguage);
                return (
                  <option key={lang} value={lang} className="bg-slate-900 text-slate-100">
                    {meta?.flag || '🌐'} {localizedName} ({lang})
                  </option>
                );
              })}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Diagnostic assessment trigger */}
        {hasDiagnosticAvailable && (
          <Button
            variant="outline"
            size="md"
            icon={<Award className="w-4 h-4 text-indigo-400" />}
            onClick={onOpenDiagnostic}
            className="text-xs font-semibold cursor-pointer border-slate-700 hover:border-indigo-500/50"
          >
            {t('progress:take_diagnostic_btn', 'Placement Diagnostic')}
          </Button>
        )}
      </div>
    </div>
  );
};
