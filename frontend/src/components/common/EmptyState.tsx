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
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-8 sm:p-12 text-center space-y-4 max-w-lg mx-auto shadow-sm animate-fadeIn ${className}`}>
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center text-indigo-400 mx-auto">
          {icon}
        </div>
      )}

      <div className="space-y-1.5">
        <h3 className="text-base sm:text-lg font-bold text-slate-100">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          {description}
        </p>
      </div>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md transition min-h-[44px] cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
};
