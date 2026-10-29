import React from 'react';
import { Breadcrumbs, BreadcrumbItem } from './Breadcrumbs';
import { Language } from '../../types';
import { Globe, BookOpen, Layers } from 'lucide-react';

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
  itemCountLabel = 'Itens',
  primaryAction,
  secondaryAction,
  className = '',
}) => {
  const getLangName = (lang: string) => {
    if (lang === 'pt') return 'Português';
    if (lang === 'es') return 'Español';
    return 'English';
  };

  return (
    <div className={`space-y-4 border-b border-slate-800 pb-5 ${className}`}>
      {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Title, Description & Metadata */}
        <div className="space-y-2 max-w-3xl">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-100 tracking-tight">
              {title}
            </h1>

            {targetLanguage && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-700/60 uppercase">
                {getLangName(targetLanguage)}
              </span>
            )}

            {cefrLevel && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-950/80 text-amber-300 border border-amber-700/60">
                {cefrLevel}
              </span>
            )}

            {explanationLanguage && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                <span>Explicações:</span>
                <strong className="text-slate-100 font-semibold">{getLangName(explanationLanguage)}</strong>
              </span>
            )}

            {typeof itemCount === 'number' && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                {itemCount} {itemCountLabel}
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Action Buttons with Touch-Friendly Heights */}
        {(primaryAction || secondaryAction) && (
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            {secondaryAction && (
              <button
                onClick={secondaryAction.onClick}
                disabled={secondaryAction.disabled}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold transition min-h-[44px] cursor-pointer disabled:opacity-50"
              >
                {secondaryAction.icon}
                <span>{secondaryAction.label}</span>
              </button>
            )}

            {primaryAction && (
              <button
                onClick={primaryAction.onClick}
                disabled={primaryAction.disabled}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md transition min-h-[44px] cursor-pointer disabled:opacity-50"
              >
                {primaryAction.icon}
                <span>{primaryAction.label}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
