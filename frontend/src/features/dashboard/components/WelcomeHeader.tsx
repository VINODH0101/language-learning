import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { Course, Language, RegionalVariety } from '../../../types';
import { useI18n } from '../../../i18n/i18nContext';
import { getLanguageName } from '../../../lib/languages/languageMatrix';

interface WelcomeHeaderProps {
  fullName?: string;
  streakDays?: number;
  dueSRSCount?: number;
  activeCourse: Course;
}

export const WelcomeHeader: React.FC<WelcomeHeaderProps> = ({
  fullName,
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

  const dateLocale =
    interfaceLanguage === 'en'
      ? 'en-US'
      : interfaceLanguage === 'es'
      ? 'es-ES'
      : 'pt-BR';

  const todayFormatted = new Date().toLocaleDateString(dateLocale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const firstName = fullName?.trim().split(' ')[0] || 'Learner';

  return (
    <header aria-label="Personal Welcome" className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs">
      <div className="flex flex-col gap-4">
        {/* Eyebrow Kicker & Four-Way Decoupled Language Matrix */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-semibold uppercase tracking-widest text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200/80">
            {t('dash_banner_badge', 'Lexilume Daily Immersion')}
          </span>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-800 border border-stone-200">
            <span aria-hidden="true">
              {getLanguageFlag(activeCourse.target_language, activeCourse.regional_variant)}
            </span>
            <span>
              {t('dashboard:learning_label', 'Learning')}{' '}
              <strong className="font-semibold text-stone-900">
                {getLanguageLabel(activeCourse.target_language)}
              </strong>
            </span>
            <span className="text-stone-300">•</span>
            <span className="font-semibold text-stone-700">
              {activeCourse.cefr_level}
            </span>
            <span className="text-stone-300">•</span>
            <span className="inline-flex items-center gap-1 text-stone-600">
              <ShieldCheck className="w-3.5 h-3.5 text-stone-500" />
              <span>
                {t('dash_explanations_in', 'Explanations in')}{' '}
                <strong className="font-medium text-stone-800">
                  {getLanguageName(activeCourse.explanation_language as Language, (interfaceLanguage as any) || 'en')}
                </strong>
              </span>
            </span>
          </div>
        </div>

        {/* Editorial Greeting Headline */}
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 tracking-tight leading-tight">
            {t('dash_greeting_prefix', 'Welcome')}, {firstName}! {t('dash_greeting_suffix', '')}
          </h1>

          <p className="text-sm text-stone-600 mt-2 leading-relaxed">
            {t('dash_today_is', 'Today is')} {todayFormatted}.{' '}
            {t('dashboard:welcome_subhead', 'Explore authentic literature, practice spoken dialogue, and reinforce your vocabulary.')}
          </p>
        </div>
      </div>
    </header>
  );
};
