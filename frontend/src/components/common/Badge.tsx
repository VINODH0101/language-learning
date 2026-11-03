import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'indigo' | 'amber' | 'rose' | 'slate' | 'sky';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  size = 'md',
  className = '',
}) => {
  const variantMap = {
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    indigo: 'bg-stone-100 text-stone-800 border-stone-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200/80',
    rose: 'bg-rose-50 text-rose-800 border-rose-200/80',
    slate: 'bg-stone-100 text-stone-700 border-stone-200',
    sky: 'bg-sky-50 text-sky-800 border-sky-200/80',
  }[variant];

  const sizeMap = {
    sm: 'px-2 py-0.5 text-[11px] leading-tight',
    md: 'px-2.5 py-0.5 text-xs font-medium',
  }[size];

  return (
    <span className={`inline-flex items-center gap-1 rounded-md border tracking-wide ${variantMap} ${sizeMap} ${className}`}>
      {children}
    </span>
  );
};
