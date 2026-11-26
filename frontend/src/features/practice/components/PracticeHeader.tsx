import React from 'react';
import { Globe2 } from 'lucide-react';
import { Language } from '../../../types';
import {
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

const TRACKS: Language[] = ['pt', 'es', 'en'];

export const PracticeHeader: React.FC<PracticeHeaderProps> = ({
  selectedLanguage,
  regionalVariety,
  onSelectLanguage,
}) => {
  const { t, interfaceLanguage } = useI18n();

  const languageLabel = (lang: Language) =>
    getLanguageName(lang, (interfaceLanguage as any) || 'en');

  return (
    <header className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs">
      <div className="flex flex-col gap-5">
        {/* Eyebrow kicker & context badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200/80">
            {t('practice:header_badge', 'Practice & Recall')}
          </span>
          <Badge variant="slate" size="sm">
            {t('practice:active_badge', 'SM-2')}
          </Badge>
          {regionalVariety && (
            <Badge variant="slate" size="sm">
              {getRegionalVarietyLabel(regionalVariety as any, (interfaceLanguage as any) || 'en')}
            </Badge>
          )}
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div className="min-w-0">
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 tracking-tight leading-tight">
              {t('practice:page_title', 'Practice & Spaced Repetition')}
            </h1>
            <p className="text-sm text-stone-600 mt-2 max-w-2xl leading-relaxed">
              {t(
                'practice:page_subtitle',
                'One calm place to review vocabulary, work through exercises, and train your ear, voice and reading.'
              )}
            </p>
          </div>

          {/* Language track switcher: segmented control on desktop, native select on mobile */}
          <div className="shrink-0">
            <div
              role="group"
              aria-label={t('practice:language_track_label', 'Learning track')}
              className="hidden sm:inline-flex items-center gap-1 bg-stone-100 border border-stone-200 p-1 rounded-xl"
            >
              {TRACKS.map(lang => {
                const isActive = selectedLanguage === lang;
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => onSelectLanguage(lang)}
                    aria-pressed={isActive}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-white text-stone-900 border border-stone-200 shadow-xs'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    {languageLabel(lang)} ({lang.toUpperCase()})
                  </button>
                );
              })}
            </div>

            <div className="relative sm:hidden">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <Globe2 className="w-4 h-4" />
              </div>
              <select
                value={selectedLanguage}
                onChange={e => onSelectLanguage(e.target.value as Language)}
                aria-label={t('practice:select_track_aria', 'Selecionar trilha de idioma de prática')}
                className="w-full pl-9 pr-8 py-2 bg-white border border-stone-200 rounded-xl text-sm font-medium text-stone-800 focus:outline-none focus:border-stone-500 cursor-pointer appearance-none"
              >
                {TRACKS.map(lang => (
                  <option key={lang} value={lang}>
                    {languageLabel(lang)} ({lang.toUpperCase()})
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-stone-400 text-[10px]">
                ▼
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
