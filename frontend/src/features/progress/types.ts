import { Language, RegionalVariety, CEFRLevel } from '../../types';

export interface ProgressFilterState {
  selectedLanguage: Language;
  selectedVariety?: RegionalVariety;
  timeRange: 'all' | '30d' | '7d';
}

export interface CEFRLevelProgress {
  level: CEFRLevel;
  title: string;
  totalUnits: number;
  completedUnits: number;
  percentage: number;
  isUnlocked: boolean;
  isActive: boolean;
}

export interface SkillScore {
  name: string;
  category: 'reading' | 'listening' | 'writing' | 'speaking' | 'grammar' | 'vocabulary';
  activityCount: number;
  estimatedProficiencyPct: number | null; // null indicates insufficient data
  lastPracticed?: string;
}

export interface ExerciseTypePerformance {
  type: string;
  label: string;
  totalAttempts: number;
  correctAttempts: number;
  accuracyPct: number;
}
