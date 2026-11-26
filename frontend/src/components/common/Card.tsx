import React from 'react';

interface CardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  action,
  children,
  className = '',
  hoverable = false,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm transition-all ${
        hoverable ? 'hover:border-stone-300 hover:shadow-md cursor-pointer' : ''
      } ${className}`}
    >
      {(title || subtitle || action) && (
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between gap-4">
          <div>
            {title && <h3 className="text-base font-serif font-bold text-stone-900">{title}</h3>}
            {subtitle && <p className="text-xs text-stone-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
};
