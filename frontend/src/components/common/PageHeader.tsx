import React from 'react';
import { Breadcrumbs, BreadcrumbItem } from './Breadcrumbs';
import { Language } from '../../types';
import { useI18n } from '../../i18n/i18nContext';
import { getLanguageName } from '../../lib/languages/languageMatrix';
import { Badge } from './Badge';

interface ActionConfig {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

interface PageHeaderProps {
  breadcrumbs?: BreadcrumbItem[];
  title: string;
  description: string;
  targetLanguage?: Language;
  explanationLanguage?: Language;
  cefrLevel?: string;
  itemCount?: number;
  itemCountLabel?: string;
  primaryAction?: ActionConfig;
  secondaryAction?: ActionConfig;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  breadcrumbs,
  title,
  description,
  targetLanguage,
  explanationLanguage,
  cefrLevel,
  itemCount,
  itemCountLabel = 'Items',
  primaryAction,
  secondaryAction,
  className = '',
}) => {
  const { t, interfaceLanguage } = useI18n();
  const getLangName = (lang: string) =>
    getLanguageName(lang as any, interfaceLanguage as any);

  return (
    <header className={`bg-white border border-stone-200 rounded-2xl p-5 sm:p-8 shadow-xs space-y-4 ${className}`}>
      {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div className="space-y-2.5 max-w-3xl min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {targetLanguage && (
              <span className="text-xs font-semibold uppercase tracking-widest text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200/80">
                {getLangName(targetLanguage)}
              </span>
            )}

            {cefrLevel && (
              <Badge variant="slate" size="sm">
                {cefrLevel}
              </Badge>
            )}

            {explanationLanguage && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-600 border border-stone-200">
                <span>{t('dashboard:explanations_in', 'Explanations in')}:</span>
                <strong className="text-stone-900 font-semibold">{getLangName(explanationLanguage)}</strong>
              </span>
            )}

            {typeof itemCount === 'number' && (
              <Badge variant="emerald" size="sm">
                {itemCount} {itemCountLabel}
              </Badge>
            )}
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 tracking-tight leading-tight">
            {title}
          </h1>

          <p className="text-sm text-stone-600 leading-relaxed">
            {description}
          </p>
        </div>

        {(primaryAction || secondaryAction) && (
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            {secondaryAction && (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                disabled={secondaryAction.disabled}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 text-xs sm:text-sm font-semibold transition min-h-[44px] cursor-pointer disabled:opacity-50"
              >
                {secondaryAction.icon}
                <span>{secondaryAction.label}</span>
              </button>
            )}

            {primaryAction && (
              <button
                type="button"
                onClick={primaryAction.onClick}
                disabled={primaryAction.disabled}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-semibold shadow-xs transition min-h-[44px] cursor-pointer disabled:opacity-50"
              >
                {primaryAction.icon}
                <span>{primaryAction.label}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
