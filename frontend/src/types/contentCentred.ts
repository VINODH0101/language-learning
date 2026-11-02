/**
 * Lexilume — Content-Centred Domain Types (Phase 7)
 * 
 * Strict Domain Invariants:
 * 1. Interface, target/learning, and explanation languages are decoupled.
 * 2. Published content versions are strictly immutable.
 * 3. Compound unique key for saved vocabulary includes target_language, lemma, pos, explanation_language.
 * 4. All scheduling parameters for SM-2 are retained.
 * 5. Stable surrogate keys (UUIDs) for all content, version, activity, and attempt tracking.
 */

import { Language, ExplanationLanguage, CEFRLevel } from './index';

// ============================================================================
// 1. CONTENT ENUMS & CATEGORIES
// ============================================================================

export type ContentGenre =
  | 'conversation'
  | 'dialogue'
  | 'short_story'
  | 'literature'
  | 'news_article'
  | 'workplace_email'
  | 'business_report'
  | 'academic_essay'
  | 'culture_and_travel'
  | 'grammar_in_action'
  | 'instructions_and_guides'
  | 'interview_and_discussion'
  | 'reviews_and_opinions';

export type ContentStatus =
  | 'draft'
  | 'processing'
  | 'review_required'
  | 'approved'
  | 'published'
  | 'archived';

export type RightsStatus =
  | 'original'
  | 'public_domain'
  | 'licensed'
  | 'permitted'
  | 'restricted'
  | 'unknown';

export type SourceType =
  | 'public_domain'
  | 'open_license'
  | 'editorial'
  | 'user_submitted'
  | 'partner';

export type ActivityType =
  | 'reading_comprehension'
  | 'vocabulary_cloze'
  | 'grammar_transformation'
  | 'listening_dictation'
  | 'sentence_scramble'
  | 'spoken_shadowing'
  | 'free_writing'
  | 'true_false'
  | 'short_answer';

export type ProcessingStageName =
  | 'stage_0_intake'
  | 'stage_1_detect_lang'
  | 'stage_2_classify'
  | 'stage_3_segment'
  | 'stage_4_translate'
  | 'stage_5_extract_lexicon'
  | 'stage_6_extract_grammar'
  | 'stage_7_generate_activities'
  | 'stage_8_validate';

export type ProcessingJobStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type LearnerContentStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'revisiting';

export type SavedWordState =
  | 'learning'
  | 'reviewing'
  | 'mastered'
  | 'ignored';

export type ErrorCategory =
  | 'vocabulary_choice'
  | 'verb_tense'
  | 'preposition'
  | 'spelling'
  | 'word_order'
  | 'article_usage'
  | 'comprehension_inference'
  | 'pronunciation'
  | 'general';

export type MistakeStatus =
  | 'unresolved'
  | 'review_pending'
  | 'mastered'
  | 'dismissed';

// ============================================================================
// 2. CONTENT ENTITIES
// ============================================================================

export interface ContentSource {
  id: string;
  source_name: string;
  source_type: SourceType;
  author?: string;
  original_url?: string;
  license_type: string;
  license_text?: string;
  attribution_notice: string;
  created_at: string;
  updated_at: string;
}

export interface ContentItem {
  id: string;
  title: string;
  slug: string;
  target_language: Language;
  explanation_language: ExplanationLanguage;
  source_language?: string;
  summary?: string;
  genre: ContentGenre;
  primary_cefr: CEFRLevel;
  estimated_read_minutes: number;
  status: ContentStatus;
  current_version_id?: string;
  source_id?: string;
  rights_status: RightsStatus;
  rights_notes?: string;
  attribution_notice?: string;
  source_url?: string;
  author?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Token, Sentence, Paragraph Hierarchy
export interface ContentToken {
  text: string;
  lemma: string;
  pos: string;
  cefr?: CEFRLevel;
  gloss_id?: string;
  audio_offset_ms?: {
    start: number;
    end: number;
  };
}

export interface ContentSentence {
  id: string;
  order: number;
  text: string;
  tokens: ContentToken[];
  translations?: Partial<Record<ExplanationLanguage, string>>;
  grammar_rule_ids?: string[];
}

export interface ContentParagraph {
  id: string;
  order: number;
  sentences: ContentSentence[];
}

export interface LexicalAnnotation {
  id: string;
  lemma: string;
  term: string;
  pos: string;
  cefr?: CEFRLevel;
  ipa?: string;
  contextual_meaning: string;
  general_definition?: string;
  context_translation: Partial<Record<ExplanationLanguage, string>>;
  example_sentence?: string;
  audio_url?: string;
}

export interface GrammarPoint {
  id: string;
  title: string;
  target_tokens: string[];
  explanation_summary: string;
  explanations?: Partial<Record<ExplanationLanguage, string>>;
  pattern?: string;
}

export interface StructuredPayload {
  title: string;
  summary?: string;
  paragraphs: ContentParagraph[];
  annotations: Record<string, LexicalAnnotation>;
  grammar_points: GrammarPoint[];
}

export interface ContentVersion {
  id: string;
  content_item_id: string;
  version_number: number;
  cefr_level: CEFRLevel;
  structured_payload: StructuredPayload;
  audio_metadata: Record<string, unknown>;
  word_count: number;
  sentence_count: number;
  lexical_density?: number;
  is_published: boolean;
  change_summary?: string;
  created_by?: string;
  published_at?: string;
  created_at: string;
}

/**
 * Validates a structured content payload against domain bounds and memory limits.
 */
export function validateStructuredPayload(payload: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!payload || typeof payload !== 'object') {
    return { valid: false, errors: ['Structured payload must be a non-null object'] };
  }

  const p = payload as any;
  if (!p.title || typeof p.title !== 'string') {
    errors.push('Structured payload title is required and must be a string');
  }

  if (!Array.isArray(p.paragraphs)) {
    errors.push('Structured payload must contain a paragraphs array');
  } else {
    if (p.paragraphs.length > 200) {
      errors.push('Exceeded maximum allowed paragraphs limit (200)');
    }
    for (let i = 0; i < p.paragraphs.length; i++) {
      const para = p.paragraphs[i];
      if (!para || typeof para !== 'object' || !Array.isArray(para.sentences)) {
        errors.push(`Paragraph at index ${i} must have a valid sentences array`);
        break;
      }
      if (para.sentences.length > 100) {
        errors.push(`Paragraph at index ${i} exceeded maximum sentences limit (100)`);
        break;
      }
    }
  }

  try {
    const serialized = JSON.stringify(payload);
    if (serialized.length > 500_000) {
      errors.push('Structured payload exceeds maximum size limit (500 KB)');
    }
  } catch (e) {
    errors.push('Structured payload cannot be serialized to JSON');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates an activity configuration payload.
 */
export function validateActivityConfiguration(config: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!config || typeof config !== 'object') {
    return { valid: false, errors: ['Activity configuration must be a non-null object'] };
  }

  const c = config as any;
  if (!Array.isArray(c.questions)) {
    errors.push('Activity configuration must contain a questions array');
  } else {
    if (c.questions.length > 50) {
      errors.push('Exceeded maximum questions limit (50)');
    }
    for (let i = 0; i < c.questions.length; i++) {
      const q = c.questions[i];
      if (!q.stem || typeof q.stem !== 'string') {
        errors.push(`Question ${i + 1} is missing a stem prompt`);
      }
      if (!q.correct_answer || typeof q.correct_answer !== 'string') {
        errors.push(`Question ${i + 1} is missing a valid correct_answer`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================================
// 3. LEARNING ACTIVITIES
// ============================================================================

export interface ActivityQuestionOption {
  id: string;
  text: string;
}

export interface ActivityQuestion {
  id: string;
  type: string;
  stem: string;
  options?: ActivityQuestionOption[];
  correct_answer: string;
  explanation: string;
  reference_sentence_id?: string;
  target_token?: string;
}

export interface LearningActivityConfiguration {
  instructions: string;
  questions: ActivityQuestion[];
  passing_score_percent?: number;
}

export interface LearningActivity {
  id: string;
  content_version_id: string;
  activity_type: ActivityType;
  activity_title: string;
  activity_order: number;
  estimated_minutes: number;
  configuration: LearningActivityConfiguration;
  created_at: string;
}

// ============================================================================
// 4. LEARNER TELEMETRY & PROGRESS
// ============================================================================

export interface LearnerContentProgress {
  id: string;
  user_id: string;
  content_item_id: string;
  content_version_id: string;
  status: LearnerContentStatus;
  percent_complete: number;
  completed_activity_ids: string[];
  time_spent_seconds: number;
  comprehension_score?: number;
  client_mutation_id?: string;
  first_opened_at: string;
  last_studied_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// 5. PERSONAL VOCABULARY & SM-2 SPDCED REPETITION
// ============================================================================

export interface UserSavedWord {
  id: string;
  user_id: string;
  target_language: Language;
  explanation_language: ExplanationLanguage;
  term: string;
  lemma: string;
  pos: string;
  cefr_level?: CEFRLevel;
  definition: string;
  context_sentence?: string;
  context_translation?: string;
  source_content_id?: string;
  source_version_id?: string;
  audio_url?: string;
  ipa?: string;
  client_mutation_id?: string;

  // SM-2 Spaced Repetition Parameters (Fully Preserved)
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  lapses: number;
  last_reviewed_at?: string;
  next_review: string; // YYYY-MM-DD
  legacy_srs_item_id?: string;

  state: SavedWordState;
  created_at: string;
  updated_at: string;
}

export interface UserWordReviewEvent {
  id: string;
  user_id: string;
  saved_word_id: string;
  rating: number; // 0 to 5
  previous_interval_days: number;
  new_interval_days: number;
  previous_ease_factor: number;
  new_ease_factor: number;
  client_mutation_id?: string;
  reviewed_at: string;
}

// ============================================================================
// 6. MISTAKE NOTEBOOK
// ============================================================================

export interface UserMistake {
  id: string;
  user_id: string;
  content_item_id?: string;
  content_version_id?: string;
  activity_id?: string;
  activity_type: string;
  error_category: ErrorCategory;
  stimulus: string;
  user_response: string;
  correct_response: string;
  pedagogical_explanation: string;
  status: MistakeStatus;
  occurrences_count: number;
  client_mutation_id?: string;
  first_occurred_at: string;
  last_occurred_at: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// 7. CONTENT PROCESSING PIPELINE JOBS
// ============================================================================

export interface ContentProcessingJob {
  id: string;
  content_item_id: string;
  version_number: number;
  status: ProcessingJobStatus;
  current_stage: ProcessingStageName;
  stages_completed: ProcessingStageName[];
  stage_outputs: Record<string, unknown>;
  stage_timings: Record<string, number>;
  error_message?: string;
  retry_count: number;
  triggered_by?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}
