/**
 * Design System Theme Constants & Tokens
 * 
 * Centralizes UI spacing, border radius, and core semantic color definitions.
 */

export const THEME_TOKENS = {
  colors: {
    bg: {
      primary: 'bg-slate-950',
      secondary: 'bg-slate-900',
      elevated: 'bg-slate-800/80',
    },
    border: {
      subtle: 'border-slate-850',
      standard: 'border-slate-800',
      strong: 'border-slate-700',
    },
    brand: {
      primary: 'indigo',
      accent: 'emerald',
      warning: 'amber',
      danger: 'rose',
    },
    text: {
      primary: 'text-slate-100',
      secondary: 'text-slate-400',
      muted: 'text-slate-500',
    },
  },
  radius: {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    full: 'rounded-full',
  },
} as const;
