import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

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
  return (
    <nav aria-label="Navegação estrutural" className={`flex items-center gap-1.5 text-xs text-slate-400 ${className}`}>
      <button
        onClick={items[0]?.onClick}
        className="flex items-center gap-1 hover:text-slate-200 transition cursor-pointer p-1 rounded"
        title="Início"
        aria-label="Início"
      >
        <Home className="w-3.5 h-3.5" />
      </button>

      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
          {item.active ? (
            <span className="font-semibold text-slate-200 truncate max-w-[200px]" aria-current="page">
              {item.label}
            </span>
          ) : (
            <button
              onClick={item.onClick}
              className="hover:text-slate-200 transition cursor-pointer truncate max-w-[200px]"
            >
              {item.label}
            </button>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
