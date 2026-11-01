import React from 'react';
import { Flame, Sparkles, ShieldCheck } from 'lucide-react';
import { Course, Language, RegionalVariety } from '../../../types';
import { useI18n } from '../../../i18n/i18nContext';
import { getLanguageName } from '../../../lib/languages/languageMatrix';

interface WelcomeHeaderProps {
  fullName?: string;
  streakDays: number;
  dueSRSCount: number;
  activeCourse: Course;
}

export const WelcomeHeader: React.FC<WelcomeHeaderProps> = ({
  fullName,
  streakDays,
  dueSRSCount,
  activeCourse,
}) => {
  const { t, interfaceLanguage } = useI18n();

  const getLanguageLabel = (lang: Language) => {
    return getLanguageName(lang, (interfaceLanguage as any) || 'en');
  };

  const getLanguageFlag = (lang: Language, variant?: RegionalVariety) => {
    if (lang === 'en') return variant?.includes('GB') ? '🇬🇧' : '🇺🇸';
    if (lang === 'pt') return variant?.includes('PT') ? '🇵🇹' : '🇧🇷';
    if (lang === 'es') return variant?.includes('ES') ? '🇪🇸' : '🇲🇽';
    if (lang === 'fr') return '🇫🇷';
    if (lang === 'de') return '🇩🇪';
    if (lang === 'it') return '🇮🇹';
    if (lang === 'ja') return '🇯🇵';
    if (lang === 'ko') return '🇰🇷';
    if (lang === 'ru') return '🇷🇺';
    if (lang === 'nl') return '🇳🇱';
    if (lang === 'zh') return '🇨🇳';
    if (lang === 'tr') return '🇹🇷';
    if (lang === 'ta') return '🇮🇳';
    return '🌐';
  };

  const dateLocale = interfaceLanguage === 'en' ? 'en-US' : interfaceLanguage === 'es' ? 'es-ES' : 'pt-BR';
  const todayFormatted = new Date().toLocaleDateString(dateLocale, { weekday: 'long', day: 'numeric', month: 'long' });
  const firstName = fullName?.trim().split(' ')[0] || 'Learner';

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              {t('dash_banner_badge')}
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-700/60 shadow-sm">
              <span>{getLanguageFlag(activeCourse.target_language, activeCourse.regional_variant)}</span>
              <span>{getLanguageLabel(activeCourse.target_language)}</span>
              <span className="text-slate-400 font-normal">({activeCourse.cefr_level})</span>
            </span>
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t('dash_explanations_in')} {activeCourse.explanation_language.toUpperCase()}</span>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
            {t('dash_greeting_prefix')}, {firstName}! {t('dash_greeting_suffix')}
          </h1>

          <p className="text-xs text-slate-400">
            {t('dash_today_is')} {todayFormatted}. {t('dash_continue_focus')} {activeCourse.cefr_level}.
          </p>

          <div className="text-xs font-semibold text-indigo-300 pt-0.5 flex items-center gap-1.5">
            <span>🎯</span>
            <span>
              {t('dashboard:daily_roadmap_prompt', 'What should I learn today? Here is your personalized daily roadmap:')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-2 bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/80 shadow-sm">
            <Flame className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-100">{streakDays} {t('dash_streak_days')}</div>
              <div className="text-[9px] text-slate-400 uppercase font-semibold">{t('dash_streak_title')}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/80 shadow-sm">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-100">{dueSRSCount} {t('dash_srs_due_terms')}</div>
              <div className="text-[9px] text-slate-400 uppercase font-semibold">{t('dash_srs_due_title')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
