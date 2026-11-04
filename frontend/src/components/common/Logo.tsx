import React from 'react';
import { BRANDING } from '../../config/branding';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  /** Optional localized context (e.g. target + explanation language). Never hardcode languages here. */
  subtitle?: React.ReactNode;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showTagline = false,
  subtitle,
  className = '',
}) => {
  const iconDimensions = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  }[size];

  const titleSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  }[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Lexilume Emblem: Stylized geometric 'L' emitting an illumination beam over a subtle open book curve */}
      <div
        className={`${iconDimensions} rounded-xl bg-gradient-to-br from-stone-900 via-stone-800 to-amber-700 p-0.5 shadow-sm flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-200 border border-amber-600/30`}
      >
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
          aria-hidden="true"
        >
          {/* Subtle background glow */}
          <circle cx="20" cy="18" r="14" fill="url(#lexilume-glow)" opacity="0.4" />

          {/* Book / light beam rays */}
          <path
            d="M20 7L23 13M20 7L17 13M20 7V14"
            stroke="#fbbf24"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.85"
          />

          {/* Stylized Modern Illuminated 'L' */}
          <path
            d="M14 11V27C14 27.5523 14.4477 28 15 28H27C27.5523 28 28 27.5523 28 27V25.5C28 24.9477 27.5523 24.5 27 24.5H18.5V11C18.5 10.4477 18.0523 10 17.5 10H15C14.4477 10 14 10.4477 14 11Z"
            fill="url(#lexilume-l-grad)"
          />

          {/* Accent Luminescence Dot / Sparkle at upper apex */}
          <circle cx="20" cy="7" r="2.2" fill="#fbbf24" />
          <circle cx="20" cy="7" r="1" fill="#ffffff" />

          <defs>
            <linearGradient id="lexilume-l-grad" x1="14" y1="10" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ffffff" />
              <stop offset="0.6" stopColor="#fef3c7" />
              <stop offset="1" stopColor="#fcd34d" />
            </linearGradient>
            <radialGradient id="lexilume-glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(20 18) rotate(90) scale(14)">
              <stop stopColor="#f59e0b" />
              <stop offset="1" stopColor="#b45309" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5">
          <span className={`font-extrabold text-stone-900 ${titleSizes} tracking-tight font-sans leading-none`}>
            {BRANDING.name}
          </span>
          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-50 text-amber-900 border border-amber-200 uppercase tracking-wider">
            AI
          </span>
        </div>
        {subtitle ? (
          <div className="text-[10px] text-stone-500 font-medium tracking-wide mt-0.5 max-w-[15rem] truncate">
            {subtitle}
          </div>
        ) : showTagline ? (
          <p className="text-[11px] text-amber-800/90 font-medium tracking-tight mt-0.5">
            {BRANDING.tagline}
          </p>
        ) : null}
      </div>
    </div>
  );
};
