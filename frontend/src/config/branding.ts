export const BRANDING = {
  name: 'Lexilume',
  tagline: 'Illuminate Your Words.',
  shortDescription: 'Your personalized multilingual learning companion.',
  description:
    'Lexilume helps learners build language proficiency through personalized daily lessons, vocabulary practice, reading comprehension, grammar exercises, translation, spaced repetition, and AI-assisted learning.',
  productCategory: 'AI-Powered Multilingual Learning Platform',
  version: '2.0.0',
  year: 2026,
  copyright: '© 2026 Lexilume. All rights reserved.',
  theme: {
    primaryColor: '#6366f1', // Indigo
    accentColor: '#06b6d4',  // Cyan
    darkBg: '#090d16',
    cardBg: '#0f172a',
  },
} as const;

export type BrandingConfig = typeof BRANDING;
