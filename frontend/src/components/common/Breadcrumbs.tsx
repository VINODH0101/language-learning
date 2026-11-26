import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { useI18n } from '../../i18n/i18nContext';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  active?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
  const { t } = useI18n();

  return (
    <nav aria-label={t('navigation:menu_title', 'Navigation Menu')} className={`flex items-center gap-1.5 text-xs text-stone-500 ${className}`}>
      <button
        type="button"
        onClick={items[0]?.onClick}
        className="flex items-center gap-1 hover:text-stone-900 transition cursor-pointer p-1 rounded-md hover:bg-stone-100"
        title={t('nav_home')}
        aria-label={t('nav_home')}
      >
        <Home className="w-3.5 h-3.5" />
      </button>

      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          <ChevronRight className="w-3 h-3 text-stone-300 shrink-0" />
          {item.active ? (
            <span className="font-semibold text-stone-800 truncate max-w-[200px]" aria-current="page">
              {item.label}
            </span>
          ) : (
            <button
              type="button"
              onClick={item.onClick}
              className="hover:text-stone-900 transition cursor-pointer truncate max-w-[200px]"
            >
              {item.label}
            </button>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
