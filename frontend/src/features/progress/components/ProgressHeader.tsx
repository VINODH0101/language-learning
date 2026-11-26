import React from 'react';
import { Award, Globe2 } from 'lucide-react';
import { Language, UserTrackState, Course } from '../../../types';
import {
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

const TRACKS: Language[] = ['pt', 'es', 'en'];

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
    <header className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-8 shadow-xs">
      <div className="flex flex-col gap-5">
        {/* Eyebrow kicker & context badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200/80">
            {t('navigation:nav_progress', 'Progress')}
          </span>
          <Badge variant="slate" size="sm">
            {t('dashboard:cefr_level', 'CEFR')}: {track.current_cefr_level}
          </Badge>
          <Badge variant="slate" size="sm">
            {varietyLabel}
          </Badge>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div className="min-w-0">
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 tracking-tight leading-tight flex items-center gap-2.5">
              <span aria-hidden="true">{currentMeta.flag}</span>
              <span className="truncate">{getLanguageName(selectedLang, interfaceLanguage)}</span>
            </h1>

            <p className="text-sm text-stone-600 mt-2 max-w-2xl leading-relaxed">
              {t(
                'progress:header_description',
                'A calm, language-specific view of what you have learned, what is fading, and what to do next.'
              )}
            </p>

            {activeCourse && (
              <div className="flex items-center gap-x-3 gap-y-1 mt-3 text-xs text-stone-500 flex-wrap">
                <span>
                  {t('dashboard:goal_title', 'Daily Goal')}:{' '}
                  <strong className="text-stone-800">{activeCourse.daily_goal_minutes} min</strong>
                </span>
                <span className="text-stone-300" aria-hidden="true">•</span>
                <span>
                  {t('dashboard:streak', 'Streak')}:{' '}
                  <strong className="text-amber-700">
                    {activeCourse.streak_days} {t('common:days', 'days')}
                  </strong>
                </span>
                <span className="text-stone-300" aria-hidden="true">•</span>
                <span>
                  {t('progress:explanation_lang', 'Explanations')}:{' '}
                  <strong className="text-stone-800">
                    {getLanguageName(activeCourse.explanation_language, interfaceLanguage)}
                  </strong>
                </span>
              </div>
            )}
          </div>

          {/* Language track switcher (desktop segmented, mobile native select) + placement CTA */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {/* Desktop Track Switcher */}
            <div
              role="group"
              aria-label={t('progress:language_track_label', 'Learning track')}
              className="hidden sm:inline-flex items-center gap-1 bg-stone-100 border border-stone-200 p-1 rounded-xl"
            >
              {TRACKS.map(lang => {
                const isActive = selectedLang === lang;
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => onSelectLang(lang)}
                    aria-pressed={isActive}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer min-h-[34px] ${
                      isActive
                        ? 'bg-white text-stone-900 border border-stone-200 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {getLanguageName(lang, interfaceLanguage)}
                  </button>
                );
              })}
            </div>

            {/* Mobile Track Selector */}
            <div className="relative sm:hidden">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <Globe2 className="w-4 h-4" />
              </div>
              <select
                value={selectedLang}
                onChange={e => onSelectLang(e.target.value as Language)}
                aria-label={t('progress:language_track_label', 'Learning track')}
                className="w-full pl-9 pr-8 py-2.5 bg-white border border-stone-200 rounded-xl text-sm font-semibold text-stone-800 focus:outline-none focus:border-stone-500 cursor-pointer appearance-none min-h-[44px]"
              >
                {TRACKS.map(lang => (
                  <option key={lang} value={lang}>
                    {LANGUAGE_METADATA[lang]?.flag} {getLanguageName(lang, interfaceLanguage)} ({lang.toUpperCase()})
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-stone-400 text-[10px]">
                ▼
              </div>
            </div>

            {hasDiagnosticAvailable && (
              <Button
                variant="outline"
                size="md"
                icon={<Award className="w-4 h-4 text-amber-700" />}
                onClick={onOpenDiagnostic}
                className="text-xs font-semibold cursor-pointer justify-center min-h-[44px] sm:min-h-[40px]"
              >
                {t('progress:take_diagnostic_btn', 'Placement Diagnostic')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
