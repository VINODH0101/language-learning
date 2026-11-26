/**
 * Lexilume — Practice Mode Registry
 *
 * A single, declarative source of truth for every practice activity.
 * Keeping labels, grouping and counts here lets the Practice page render
 * one calm, scannable menu instead of two stacked rows of tabs.
 */

import React from 'react';
import {
  Sparkles,
  Bookmark,
  Feather,
  HelpCircle,
  PenTool,
  CheckCircle2,
  Filter,
  Headphones,
  BookOpen,
  Mic,
  MessageSquare,
  FileText,
  Camera,
} from 'lucide-react';
import { PracticeSubMode } from './types';
import { Language } from '../../types';

export type PracticeGroupId =
  | 'vocabulary'
  | 'exercises'
  | 'receptive'
  | 'productive'
  | 'tools';

export interface PracticeModeCounts {
  srsDue: number;
  srsTotal: number;
  phrasebook: number;
  multipleChoice: number;
  cloze: number;
  mistakes: number;
}

export interface PracticeModeMeta {
  id: PracticeSubMode;
  group: PracticeGroupId;
  labelKey: string;
  labelFallback: string;
  descriptionKey: string;
  descriptionFallback: string;
  icon: React.ComponentType<{ className?: string }>;
  countKind?: keyof PracticeModeCounts;
}

export interface PracticeGroupMeta {
  id: PracticeGroupId;
  labelKey: string;
  labelFallback: string;
}

export const PRACTICE_GROUPS: PracticeGroupMeta[] = [
  {
    id: 'vocabulary',
    labelKey: 'practice:group_vocabulary',
    labelFallback: 'Vocabulary & recall',
  },
  {
    id: 'exercises',
    labelKey: 'practice:group_exercises',
    labelFallback: 'Exercises',
  },
  {
    id: 'receptive',
    labelKey: 'practice:group_receptive',
    labelFallback: 'Comprehension',
  },
  {
    id: 'productive',
    labelKey: 'practice:group_productive',
    labelFallback: 'Speaking & writing',
  },
  {
    id: 'tools',
    labelKey: 'practice:group_tools',
    labelFallback: 'Study tools',
  },
];

export const PRACTICE_MODES: PracticeModeMeta[] = [
  {
    id: 'srs',
    group: 'vocabulary',
    labelKey: 'practice:submode_srs',
    labelFallback: 'SM-2 Flashcards',
    descriptionKey: 'practice:desc_srs',
    descriptionFallback: 'Review the words the SM-2 algorithm schedules for today.',
    icon: Sparkles,
    countKind: 'srsDue',
  },
  {
    id: 'phrasebook',
    group: 'vocabulary',
    labelKey: 'practice:submode_phrasebook',
    labelFallback: 'Saved Words',
    descriptionKey: 'practice:desc_phrasebook',
    descriptionFallback: 'Practise the words you saved while reading.',
    icon: Bookmark,
    countKind: 'phrasebook',
  },
  {
    id: 'daily_poetry_vocab',
    group: 'vocabulary',
    labelKey: 'practice:submode_daily_poetry',
    labelFallback: 'Daily Poetry (Lexicon)',
    descriptionKey: 'practice:desc_daily_poetry',
    descriptionFallback: 'Meet today’s poem and keep its most useful words.',
    icon: Feather,
  },
  {
    id: 'multiple_choice',
    group: 'exercises',
    labelKey: 'practice:submode_multiple_choice',
    labelFallback: 'Multiple Choice',
    descriptionKey: 'practice:desc_multiple_choice',
    descriptionFallback: 'Choose the correct option in short, focused questions.',
    icon: HelpCircle,
    countKind: 'multipleChoice',
  },
  {
    id: 'cloze',
    group: 'exercises',
    labelKey: 'practice:submode_cloze',
    labelFallback: 'Fill in Blanks & Correction',
    descriptionKey: 'practice:desc_cloze',
    descriptionFallback: 'Complete sentences and correct small grammatical slips.',
    icon: PenTool,
    countKind: 'cloze',
  },
  {
    id: 'mistakes',
    group: 'exercises',
    labelKey: 'practice:submode_mistakes',
    labelFallback: 'Mistake Notebook',
    descriptionKey: 'practice:desc_mistakes',
    descriptionFallback: 'Revisit the answers you missed and lock them in.',
    icon: CheckCircle2,
    countKind: 'mistakes',
  },
  {
    id: 'false_friends',
    group: 'exercises',
    labelKey: 'practice:submode_false_friends',
    labelFallback: 'False Friends Trainer',
    descriptionKey: 'practice:desc_false_friends',
    descriptionFallback: 'Separate look-alike words that mean different things.',
    icon: Filter,
  },
  {
    id: 'listening',
    group: 'receptive',
    labelKey: 'practice:submode_listening',
    labelFallback: 'Listening Studio',
    descriptionKey: 'practice:desc_listening',
    descriptionFallback: 'Train your ear with audio and comprehension checks.',
    icon: Headphones,
  },
  {
    id: 'reading',
    group: 'receptive',
    labelKey: 'practice:submode_reading',
    labelFallback: 'Reading Studio',
    descriptionKey: 'practice:desc_reading',
    descriptionFallback: 'Read authentic texts and look up words as you go.',
    icon: BookOpen,
  },
  {
    id: 'speaking',
    group: 'productive',
    labelKey: 'practice:submode_speaking',
    labelFallback: 'Speaking Coach',
    descriptionKey: 'practice:desc_speaking',
    descriptionFallback: 'Say it aloud and compare your pronunciation.',
    icon: Mic,
  },
  {
    id: 'conversation',
    group: 'productive',
    labelKey: 'practice:submode_conversation',
    labelFallback: 'Conversation Studio',
    descriptionKey: 'practice:desc_conversation',
    descriptionFallback: 'Work through realistic everyday dialogues.',
    icon: MessageSquare,
  },
  {
    id: 'proofreading',
    group: 'productive',
    labelKey: 'practice:submode_proofreading',
    labelFallback: 'Writing Coach',
    descriptionKey: 'practice:desc_proofreading',
    descriptionFallback: 'Write a short text and get precise corrections.',
    icon: FileText,
  },
  {
    id: 'ocr',
    group: 'tools',
    labelKey: 'practice:submode_ocr',
    labelFallback: 'Scan & Learn (OCR)',
    descriptionKey: 'practice:desc_ocr',
    descriptionFallback: 'Photograph real-world text and turn it into practice.',
    icon: Camera,
  },
];

/** Modes that are actually available for a given target language. */
export function getVisiblePracticeModes(language: Language): PracticeModeMeta[] {
  // The false-friends trainer is only meaningful between PT/ES and EN.
  return PRACTICE_MODES.filter(
    mode => mode.id !== 'false_friends' || language !== 'en'
  );
}

export function getPracticeModeMeta(mode: PracticeSubMode): PracticeModeMeta {
  return PRACTICE_MODES.find(entry => entry.id === mode) || PRACTICE_MODES[0];
}

/**
 * Resolves the badge count for a mode.
 * Flashcards prioritise the number of due cards, falling back to the deck total.
 */
export function getPracticeModeCount(
  mode: PracticeModeMeta,
  counts: PracticeModeCounts
): { value: number; urgent: boolean } | null {
  if (!mode.countKind) return null;

  if (mode.countKind === 'srsDue') {
    if (counts.srsDue > 0) return { value: counts.srsDue, urgent: true };
    if (counts.srsTotal > 0) return { value: counts.srsTotal, urgent: false };
    return null;
  }

  const value = counts[mode.countKind];
  if (value <= 0) return null;
  return { value, urgent: mode.countKind === 'mistakes' };
}
