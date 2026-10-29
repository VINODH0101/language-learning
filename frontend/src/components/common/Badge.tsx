import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'indigo' | 'amber' | 'rose' | 'slate' | 'sky';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'indigo',
  size = 'md',
  className = '',
}) => {
  const variantMap = {
    emerald: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60',
    indigo: 'bg-indigo-950/80 text-indigo-300 border-indigo-800/60',
    amber: 'bg-amber-950/80 text-amber-300 border-amber-800/60',
    rose: 'bg-rose-950/80 text-rose-300 border-rose-800/60',
    slate: 'bg-slate-800 text-slate-300 border-slate-700',
    sky: 'bg-sky-950/80 text-sky-300 border-sky-800/60',
  }[variant];

  const sizeMap = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-semibold',
  }[size];

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border ${variantMap} ${sizeMap} ${className}`}>
      {children}
    </span>
  );
};
