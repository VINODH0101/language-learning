import React from 'react';
import { RotateCcw } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`bg-white border border-dashed border-stone-300 rounded-2xl p-8 sm:p-12 text-center space-y-4 max-w-lg mx-auto shadow-xs animate-fadeIn ${className}`}>
      {icon && (
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mx-auto">
          {icon}
        </div>
      )}

      <div className="space-y-1.5">
        <h3 className="font-serif text-lg font-bold text-stone-900">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          {description}
        </p>
      </div>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-semibold shadow-xs transition min-h-[44px] cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
};
