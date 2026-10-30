/**
 * Unified Domain Types for Lexilume Multilingual Content Engine
 * Lexilume — Illuminate Your Words
 */

import {
  Language,
  RegionalVariety,
  ExplanationLanguage,
  CEFRLevel,
  Attribution,
} from './index';

// ============================================================================
// 1. CONTENT CATEGORIES & EXERCISE TYPES
// ============================================================================

export type ContentCategory =
  | 'vocabulary'
  | 'grammar'
  | 'reading'
  | 'listening'
  | 'speaking'
  | 'writing'
  | 'conversation'
  | 'exercises'
  | 'cultural_learning'
  | 'false_friends'
  | 'pronunciation'
  | 'spaced_repetition';

export type MultilingualExerciseType =
  | 'multiple_choice'
  | 'cloze'
  | 'reorder'
  | 'translation'
  | 'matching'
  | 'listening_comprehension'
  | 'reading_comprehension'
  | 'grammar_correction'
  | 'writing_response'
  | 'conversation_response'
  | 'pronunciation_practice';

// ============================================================================
// 2. REQUIRED VOCABULARY STRUCTURE
// ============================================================================

export interface MultilingualVocabularyRecord {
  id: string;
  word: string;
  language: Language;
  locale: RegionalVariety;
  translation: string;
  translationsByLang?: Partial<Record<Language | ExplanationLanguage, string>>;
  definition: string;
  definitionsByLang?: Partial<Record<Language | ExplanationLanguage, string>>;
  part_of_speech: string;
  cefr_level: CEFRLevel;
  example_sentence_target: string;
  example_sentence_translation: string;
  phonetic_ipa?: string;
  audio_url?: string | null;
  frequency_rank?: number;
  frequency_per_million?: number;
  synonyms: string[];
  antonyms: string[];
  inflections: string[];
  collocations: string[];
  false_friend_warning?: string | null;
  attribution: Attribution;
}

// ============================================================================
// 3. EXERCISE RECORD
// ============================================================================

export interface MultilingualExerciseRecord {
  id: string;
  language: Language;
  cefr_level: CEFRLevel;
  exercise_type: MultilingualExerciseType;
  prompt: string;
  context_passage?: string;
  audio_url?: string;
  target_slot_index?: number;
  acceptable_solutions: string[];
  distractors: Array<{ text: string; why_incorrect: string }>;
  matching_pairs?: Array<{ left: string; right: string }>;
  rubric?: string;
  explanation: string;
  hint?: string;
  attribution: Attribution;
}

// ============================================================================
// 4. LANGUAGE PEDAGOGY & GRAMMAR STRUCTURE
// ============================================================================

export interface LanguagePedagogyProfile {
  language: Language;
  displayName: string;
  scriptFamily: string;
  keyPedagogicalPillars: string[];
  morphologicalType: 'fusional' | 'agglutinative' | 'isolating' | 'introflexive';
  wordOrder: 'SVO' | 'SOV' | 'V2' | 'VSO' | 'flexible';
  grammaticalGender: boolean;
  caseSystem: boolean;
  particleSystem: boolean;
  tonal: boolean;
  vowelHarmony: boolean;
  honorificRegisters: boolean;
  orthographicNotes: string;
}

export interface MultilingualGrammarRecord {
  id: string;
  rule_code: string;
  language: Language;
  cefr_level: CEFRLevel;
  title: string;
  category: string;
  explanation: string;
  structural_formula: string;
  examples: Array<{
    target: string;
    translation: string;
    note?: string;
  }>;
  common_errors: Array<{
    incorrect: string;
    correct: string;
    reason: string;
  }>;
  language_specific_notes: Record<string, string>;
  attribution: Attribution;
}

// ============================================================================
// 5. 12-STEP PIPELINE CONFIG & OUTPUT
// ============================================================================

export interface ContentPipelineInput {
  target_language: Language;
  locale?: RegionalVariety;
  cefr_level: CEFRLevel;
  explanation_language: ExplanationLanguage;
  topic?: string;
  requested_categories?: ContentCategory[];
}

export interface UnifiedContentItem {
  id: string;
  category: ContentCategory;
  language: Language;
  locale: RegionalVariety;
  cefr_level: CEFRLevel;
  explanation_language: ExplanationLanguage;
  title: string;
  data: unknown;
  attribution: Attribution;
  is_verified: boolean;
  created_at: string;
}

export interface ContentPipelineResult {
  step: number;
  success: boolean;
  target_language: Language;
  locale: RegionalVariety;
  cefr_level: CEFRLevel;
  explanation_language: ExplanationLanguage;
  vocabulary: MultilingualVocabularyRecord[];
  grammar: MultilingualGrammarRecord[];
  exercises: MultilingualExerciseRecord[];
  assembled_items: UnifiedContentItem[];
  validation_errors: string[];
  gap_notes: string[];
  timestamp: string;
}

// ============================================================================
// 6. CONTENT GAP REGISTRY RECORD
// ============================================================================

export interface ContentGapRecord {
  language: Language;
  category: ContentCategory;
  coverageStatus: 'complete' | 'partial' | 'gap_documented';
  availableSources: string[];
  missingResources: string[];
  pedagogicalMitigation: string;
  lastAudited: string;
}
