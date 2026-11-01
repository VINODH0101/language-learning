/**
 * Domain TypeScript interfaces for Polyglot C1 Daily frontend.
 */

export type Language =
  | 'en'
  | 'pt'
  | 'es'
  | 'fr'
  | 'de'
  | 'it'
  | 'ja'
  | 'ko'
  | 'ru'
  | 'nl'
  | 'zh'
  | 'tr'
  | 'ta';

export type RegionalVariety =
  | 'pt-BR'
  | 'pt-PT'
  | 'es-ES'
  | 'es-419'
  | 'es-MX'
  | 'es-AR'
  | 'en-US'
  | 'en-GB'
  | 'fr-FR'
  | 'fr-CA'
  | 'de-DE'
  | 'de-AT'
  | 'de-CH'
  | 'it-IT'
  | 'ja-JP'
  | 'ko-KR'
  | 'ru-RU'
  | 'nl-NL'
  | 'nl-BE'
  | 'zh-Hans'
  | 'zh-CN'
  | 'tr-TR'
  | 'ta-IN'
  | 'ta-LK'
  | 'all';

export type ExplanationLanguage = 'en' | 'pt' | 'es';

export type InterfaceLanguage =
  | 'en'
  | 'pt'
  | 'pt-BR'
  | 'pt-PT'
  | 'es'
  | 'fr'
  | 'de'
  | 'it'
  | 'ja'
  | 'ko'
  | 'ru'
  | 'nl'
  | 'zh-Hans'
  | 'tr'
  | 'ta';

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export type StudyMode = 'full' | 'compact';

export type SessionDuration = '5' | '10' | '20';

export type ReadingViewMode = 'original' | 'side_by_side' | 'sentence_by_sentence';

export type MistakeCategory =
  | 'false_friend'
  | 'subjunctive_mood'
  | 'preposition'
  | 'vocabulary'
  | 'agreement'
  | 'grammar';

export interface Course {
  id: string;
  user_id: string;
  target_language: Language;
  regional_variant: RegionalVariety;
  cefr_level: CEFRLevel;
  explanation_language: ExplanationLanguage;
  daily_goal_minutes: number;
  streak_days: number;
  total_lessons_completed: number;
  completed_curriculum_node_ids: string[];
  last_studied_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CourseConfig {
  course_id?: string;
  target_language: Language;
  regional_variant: RegionalVariety;
  cefr_level: CEFRLevel;
  explanation_language: ExplanationLanguage;
  interface_language?: 'en' | 'pt' | 'es';
}

export interface ActiveLessonProgress {
  id: string; // e.g. 'pt' | 'es' | 'en' or course_id
  course_id?: string;
  language: Language;
  curriculum_node_id: string;
  lesson_date: string;
  selected_tab: string;
  reading_scroll_ratio?: number;
  exercise_answers: Record<string, string>;
  completed_sections: string[];
  updated_at: string;
}

export interface MistakeNotebookItem {
  id: string;
  user_id: string;
  language: Language;
  error_category: MistakeCategory;
  prompt: string;
  context_passage?: string;
  user_answer: string;
  correct_answer: string;
  explanation: string;
  timestamp: string;
  reviewed_count: number;
  is_resolved: boolean;
}

export interface SavedVocabularyRecord {
  id: string;
  user_id: string;
  source_text: string;
  translated_text: string;
  source_lang: string;
  target_lang: string;
  part_of_speech?: string;
  phonetic_ipa?: string;
  context_sentence?: string;
  is_verified: boolean;
  created_at: string;
}

export interface DialogueTurn {
  speaker: string;
  line: string;
  translation: string;
  natural_translation?: string;
  translation_pt?: string;
  translation_es?: string;
  notes?: string;
}

export interface DialogueScenario {
  id: string;
  language: Language;
  title: string;
  category: 'travel' | 'work' | 'restaurant' | 'shopping' | 'interview';
  cefr_level: CEFRLevel;
  context: string;
  turns: DialogueTurn[];
  pragmatic_tips: string[];
  vocabulary: Array<{ term: string; meaning: string; usage_note?: string }>;
}

export type ExerciseType =
  | 'cloze'
  | 'multiple_choice'
  | 'reorder'
  | 'error_correction'
  | 'translation'
  | 'matching'
  | 'listening_comprehension'
  | 'reading_comprehension'
  | 'grammar_correction'
  | 'writing_response'
  | 'conversation_response'
  | 'pronunciation_practice';

export * from './contentEngine';

export type MasteryStatus = 'unseen' | 'presented' | 'learning' | 'reviewing' | 'mastered';

export interface Attribution {
  source_name: string;
  source_url: string;
  license_type: string;
  attribution_text: string;
  terms_url?: string;
}

export interface VocabularyItem {
  id: string;
  language: Language;
  lemma: string;
  part_of_speech: string;
  cefr_level: CEFRLevel;
  definition_en: string;
  definition_target: string;
  definition_pt?: string;
  definition_es?: string;
  phonetic_ipa?: string;
  regional_tags: RegionalVariety[];
  example_sentence_target: string;
  example_sentence_en: string;
  example_sentence_pt?: string;
  example_sentence_es?: string;
  collocations: string[];
  audio_url?: string | null;
  false_friend_warning?: string | null;
  attribution: Attribution;
}

export interface GrammarExample {
  target: string;
  en: string;
  pt?: string;
  es?: string;
  note?: string;
}

export interface CommonError {
  incorrect: string;
  correct: string;
  reason: string;
}

export interface GrammarRule {
  id: string;
  rule_code: string;
  language: Language;
  cefr_level: CEFRLevel;
  title: string;
  category: string;
  explanation_markdown: string;
  structural_formula: string;
  examples: GrammarExample[];
  common_errors: CommonError[];
  regional_notes: Record<string, string>;
  attribution: Attribution;
}

export interface DistractorItem {
  text: string;
  why_incorrect: string;
}

export interface ExerciseTemplate {
  id: string;
  curriculum_node_id: string;
  language: Language;
  exercise_type: ExerciseType;
  prompt: string;
  context_passage?: string;
  target_slot_index?: number;
  acceptable_solutions: string[];
  distractors: DistractorItem[];
  explanation: string;
  hint?: string;
  difficulty: number;
  attribution: Attribution;
}

export interface CurriculumNode {
  id: string;
  language: Language;
  cefr_level: CEFRLevel;
  sequence_order: number;
  title: string;
  slug: string;
  skill_category: string;
  can_do_statement: string;
  regional_relevance: RegionalVariety;
  prerequisite_node_id?: string | null;
  is_consolidation_review: boolean;
  description: string;
}

export interface FalseFriendItem {
  id: string;
  portuguese_term: string;
  spanish_term: string;
  pt_meaning_en: string;
  es_meaning_en: string;
  pt_example: string;
  es_example: string;
  interference_warning: string;
  cefr_level: CEFRLevel;
  attribution: Attribution;
}

export interface CuratedMaterial {
  id: string;
  language: Language;
  material_type: 'reading_passage' | 'conversation_script' | 'listening_transcript';
  title: string;
  cefr_level: CEFRLevel;
  regional_variety: RegionalVariety;
  content_target: string;
  content_en?: string;
  content_pt?: string;
  content_es?: string;
  glossary?: Record<string, string>;
  comprehension_questions?: Array<{
    question: string;
    options: string[];
    correct_option_index: number;
    explanation: string;
  }>;
  speaking_prompt?: string | null;
  writing_prompt?: string | null;
  audio_url?: string | null;
  attribution: Attribution;
}

export interface DiagnosticQuestion {
  id: string;
  language: Language;
  cefr_level: CEFRLevel;
  skill: string;
  prompt: string;
  options: string[];
  correct_option_index: number;
  explanation: string;
  grammatical_focus: string;
}

export interface DiagnosticResult {
  user_id: string;
  language: Language;
  recommended_cefr_level: CEFRLevel;
  recommended_curriculum_node_id: string;
  score_by_level: Record<string, number>;
  overall_score_percent: number;
  total_questions: number;
  correct_count: number;
  diagnostic_date: string;
  feedback_summary: string;
  strengths: string[];
  recommended_focus_areas: string[];
}

export interface SRSItemState {
  vocabulary_item_id: string;
  course_id?: string;
  language: Language;
  repetition_count: number;
  ease_factor: number;
  interval_days: number;
  next_review_date: string; // YYYY-MM-DD
  last_reviewed_at?: string | null;
  lapse_count: number;
  mastery_status: MasteryStatus;
  history: Array<{
    review_date: string;
    grade: number;
    interval_days: number;
    ease_factor: number;
  }>;
}

export interface ExerciseAttempt {
  id: string;
  exercise_id: string;
  submitted_answer: string;
  is_correct: boolean;
  feedback: string;
  attempt_count: number;
  timestamp: string;
  language?: Language;
  exercise_type?: string;
  score?: number;
  max_score?: number;
}

export type ActivityType =
  | 'lesson_completed'
  | 'exercise_attempted'
  | 'exercise_completed'
  | 'vocabulary_reviewed'
  | 'vocabulary_mastered'
  | 'poetry_opened'
  | 'poetry_listened'
  | 'poetry_completed'
  | 'conversation_started'
  | 'conversation_listened'
  | 'conversation_completed'
  | 'diagnostic_completed'
  | 'country_explored'
  | 'cultural_article_read';

export interface UnifiedActivityEvent {
  id: string;
  user_id: string;
  learning_language?: Language;
  activity_type: ActivityType;
  content_id?: string;
  content_version?: string;
  title?: string;
  cefr_level?: CEFRLevel;
  completion_status: 'started' | 'in_progress' | 'completed' | 'abandoned';
  score?: number;
  max_score?: number;
  duration_minutes?: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface UserTrackState {
  user_id: string;
  language: Language;
  regional_variety: RegionalVariety;
  current_cefr_level: CEFRLevel;
  target_cefr_level: CEFRLevel;
  current_curriculum_node_id?: string | null;
  streak_days: number;
  total_lessons_completed: number;
  completed_curriculum_node_ids: string[];
  presented_vocabulary_ids: string[];
  mastered_vocabulary_ids: string[];
  recent_node_history: string[];
  recent_exercise_history: string[];
  last_lesson_date?: string | null;
}

export type UserRole = 'guest' | 'user' | 'admin';

export type AccountStatus = 'active' | 'disabled';

export interface UserProfile {
  id: string;
  auth_user_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  account_status: AccountStatus;
  native_language: Language | string;
  primary_target_language: Language;
  interface_language: InterfaceLanguage;
  explanation_language: ExplanationLanguage;
  pt_variety: 'pt-BR' | 'pt-PT';
  es_variety: 'es-ES' | 'es-419' | 'es-MX' | 'es-AR';
  study_mode: StudyMode;
  daily_goal_minutes: number;
  theme: 'light' | 'dark' | 'system';
  onboarding_completed: boolean;
  email_daily_lesson_opt_in: boolean;
  email_notifications_enabled: boolean;
  avatar_url?: string;
  created_at: string;
  last_active_at?: string;
  total_lessons_completed?: number;
  saved_vocabulary_count?: number;
  accuracy_rate?: number;
  streak_days?: number;
}

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  admin_email?: string;
  action: string;
  target_user_id?: string;
  target_user_email?: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface UserSettings {
  user_id: string;
  full_name: string;
  email: string;
  native_language: Language | string;
  primary_target_language: Language;
  pt_variety: 'pt-BR' | 'pt-PT';
  es_variety: 'es-ES' | 'es-419' | 'es-MX' | 'es-AR';
  en_variety?: 'en-US' | 'en-GB';
  explanation_language?: ExplanationLanguage;
  interface_language?: InterfaceLanguage;
  study_mode: StudyMode;
  target_timezone: string;
  preferred_delivery_hour_utc: number;
  email_notifications_enabled: boolean;
  diagnostic_completed_pt: boolean;
  diagnostic_completed_es: boolean;
  diagnostic_completed_en?: boolean;
}

export interface SavedTranslationBookmark {
  id: string;
  source_text: string;
  translated_text: string;
  source_lang: Language | string;
  target_lang: Language | string;
  provider_used: string;
  is_verified: boolean;
  notes?: string;
  created_at: string;
}

export interface DailyLessonPayload {
  lesson_id: string;
  lesson_date: string;
  language: Language;
  regional_variety: RegionalVariety;
  explanation_language?: ExplanationLanguage;
  cefr_level: CEFRLevel;
  curriculum_node_id: string;
  curriculum_topic_title: string;
  study_mode: StudyMode;
  estimated_study_minutes: number;
  section_1_objectives: Array<{ category: string; can_do_statement: string; target_competency: string }>;
  section_2_vocabulary: VocabularyItem[];
  section_3_grammar: GrammarRule;
  section_4_reading: {
    title: string;
    passage_target: string;
    passage_en?: string;
    passage_pt?: string;
    passage_es?: string;
    glossary: Record<string, string>;
    comprehension_questions: Array<{ question: string; options: string[]; correct_option_index: number; explanation: string }>;
    attribution: Attribution;
    article_url?: string;
    thumbnail_url?: string | null;
    topic_category?: string;
    provider?: 'wikipedia' | 'curated';
    article_id?: string;
  };
  section_5_conversation: {
    title: string;
    context: string;
    dialogue: Array<{
      speaker: string;
      line: string;
      translation?: string;
      translation_pt?: string;
      translation_es?: string;
    }>;
    pragmatic_notes: string[];
    attribution: Attribution;
  };
  section_6_speaking: {
    prompt: string;
    guiding_questions: string[];
    suggested_phrases: string[];
    suggested_phrases_translations?: Record<string, { pt?: string; es?: string; en?: string }>;
    model_pronunciation_guide?: string;
    target_duration_minutes: number;
  };
  section_7_writing: {
    prompt: string;
    genre_register: string;
    structural_guidelines: string[];
    evaluation_criteria: string[];
    suggested_connectors: string[];
    target_word_count: number;
  };
  section_8_listening: {
    title: string;
    audio_source_url?: string | null;
    audio_player_notes: string;
    transcript_target: string;
    comprehension_tasks: string[];
    attribution: Attribution;
  };
  section_9_exercises: Array<{
    id: string;
    exercise_type: string;
    prompt: string;
    context_passage?: string;
    options?: string[];
    hint?: string;
    distractor_explanations?: Record<string, string>;
  }>;
  section_10_answer_keys: Array<{
    exercise_id: string;
    acceptable_solutions: string[];
    explanation: string;
    distractor_feedback?: Record<string, string>;
  }>;
  section_11_review: {
    due_vocabulary_reviews: VocabularyItem[];
    consolidated_grammar_rules: GrammarRule[];
    review_strategy_note: string;
  };
  section_12_further_resources: Array<{
    title: string;
    resource_type: string;
    url: string;
    description: string;
  }>;
  false_friend_alerts: FalseFriendItem[];
  attributions: Attribution[];
}

export * from './dailyContent';
export * from './admin';
