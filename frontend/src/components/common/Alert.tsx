import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface AlertProps {
  type?: 'info' | 'warning' | 'error' | 'success';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  children,
  className = '',
}) => {
  const config = {
    info: {
      border: 'border-sky-200',
      bg: 'bg-sky-50',
      text: 'text-sky-900',
      icon: <Info className="w-5 h-5 text-sky-700 shrink-0" />,
    },
    warning: {
      border: 'border-amber-200',
      bg: 'bg-amber-50',
      text: 'text-amber-900',
      icon: <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />,
    },
    error: {
      border: 'border-rose-200',
      bg: 'bg-rose-50',
      text: 'text-rose-900',
      icon: <AlertCircle className="w-5 h-5 text-rose-700 shrink-0" />,
    },
    success: {
      border: 'border-emerald-200',
      bg: 'bg-emerald-50',
      text: 'text-emerald-900',
      icon: <CheckCircle className="w-5 h-5 text-emerald-700 shrink-0" />,
    },
  }[type];

  return (
    <div className={`flex gap-3 p-4 rounded-xl border ${config.border} ${config.bg} ${className}`}>
      {config.icon}
      <div className="text-sm">
        {title && <h4 className={`font-semibold mb-1 ${config.text}`}>{title}</h4>}
        <div className="text-stone-700 text-xs leading-relaxed">{children}</div>
      </div>
    </div>
  );
};
