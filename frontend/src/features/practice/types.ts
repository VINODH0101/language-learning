/**
 * Lexilume Practice Suite Types
 */

import { Language, VocabularyItem } from '../../types';
import { SavedVocabularyRecord } from '../../services/localDb';

export type PracticeCategory =
  | 'all'
  | 'vocabulary'
  | 'exercises'
  | 'receptive'
  | 'productive'
  | 'tools';

export type PracticeSubMode =
  // Vocabulary
  | 'srs'
  | 'phrasebook'
  | 'daily_poetry_vocab'
  // Exercises
  | 'multiple_choice'
  | 'cloze'
  | 'mistakes'
  | 'false_friends'
  // Receptive
  | 'listening'
  | 'reading'
  // Productive
  | 'speaking'
  | 'conversation'
  | 'proofreading'
  // Tools
  | 'ocr'
  | 'dictionary';

export interface ExerciseValidationResult {
  isCorrect: boolean;
  score: number; // 0.0 to 1.0
  matchedSolution?: string;
  feedback: string;
  explanation: string;
  matchedDistractorFeedback?: string;
  isAccentErrorOnly: boolean;
}

export interface FlashcardSessionStats {
  again: number;
  hard: number;
  good: number;
  easy: number;
  total: number;
  startedAt: string;
  completedAt?: string;
}

export interface VocabDeckPartition {
  due: VocabularyItem[];
  newWords: VocabularyItem[];
  mastered: VocabularyItem[];
  savedPhrasebook: SavedVocabularyRecord[];
  all: VocabularyItem[];
}

export interface PracticeDashboardSummaryProps {
  language: Language;
  dueCount: number;
  newCount: number;
  todayReviewed: number;
  dailyTarget: number;
  onQuickStart: () => void;
  onSelectCategory: (category: PracticeCategory, subMode?: PracticeSubMode) => void;
}
