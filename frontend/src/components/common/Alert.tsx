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
      border: 'border-sky-800/80',
      bg: 'bg-sky-950/40',
      text: 'text-sky-300',
      icon: <Info className="w-5 h-5 text-sky-400 shrink-0" />,
    },
    warning: {
      border: 'border-amber-800/80',
      bg: 'bg-amber-950/40',
      text: 'text-amber-300',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    },
    error: {
      border: 'border-rose-800/80',
      bg: 'bg-rose-950/40',
      text: 'text-rose-300',
      icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    },
    success: {
      border: 'border-emerald-800/80',
      bg: 'bg-emerald-950/40',
      text: 'text-emerald-300',
      icon: <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />,
    },
  }[type];

  return (
    <div className={`flex gap-3 p-4 rounded-xl border ${config.border} ${config.bg} ${className}`}>
      {config.icon}
      <div className="text-sm">
        {title && <h4 className={`font-semibold mb-1 ${config.text}`}>{title}</h4>}
        <div className="text-slate-300 text-xs leading-relaxed">{children}</div>
      </div>
    </div>
  );
};
