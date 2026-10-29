-- Polyglot C1 Daily: Initial Database Schema Migration
-- Migration 001_initial_schema.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Legal Attribution and Licenses
CREATE TABLE IF NOT EXISTS public.licenses_and_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_name VARCHAR(120) NOT NULL,
    source_url TEXT NOT NULL,
    license_type VARCHAR(64) NOT NULL,
    attribution_text TEXT NOT NULL,
    terms_url TEXT,
    imported_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_licenses_source_name ON public.licenses_and_sources(source_name);

-- 2. User Profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
    preferred_delivery_hour_utc SMALLINT NOT NULL DEFAULT 4,
    study_mode VARCHAR(20) NOT NULL DEFAULT 'full',
    diagnostic_completed BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Language Tracks
CREATE TABLE IF NOT EXISTS public.language_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    language_code VARCHAR(10) NOT NULL,
    regional_variety VARCHAR(20) NOT NULL,
    current_cefr_level VARCHAR(5) NOT NULL DEFAULT 'A1',
    target_cefr_level VARCHAR(5) NOT NULL DEFAULT 'C1',
    current_curriculum_node_id UUID,
    streak_days INTEGER NOT NULL DEFAULT 0,
    total_lessons_completed INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_language UNIQUE (user_id, language_code)
);

-- 4. Curriculum Nodes
CREATE TABLE IF NOT EXISTS public.curriculum_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language_code VARCHAR(10) NOT NULL,
    cefr_level VARCHAR(5) NOT NULL,
    sequence_order INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL,
    skill_category VARCHAR(50) NOT NULL,
    can_do_statement TEXT NOT NULL,
    regional_relevance VARCHAR(20) DEFAULT 'all',
    prerequisite_node_id UUID REFERENCES public.curriculum_nodes(id),
    is_consolidation_review BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_lang_level_seq UNIQUE (language_code, cefr_level, sequence_order)
);
CREATE INDEX IF NOT EXISTS idx_curriculum_lookup ON public.curriculum_nodes(language_code, cefr_level, sequence_order);

-- 5. Vocabulary Lexicon
CREATE TABLE IF NOT EXISTS public.vocabulary_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language_code VARCHAR(10) NOT NULL,
    lemma VARCHAR(120) NOT NULL,
    part_of_speech VARCHAR(30) NOT NULL,
    cefr_level VARCHAR(5) NOT NULL,
    definition_en TEXT NOT NULL,
    definition_target TEXT NOT NULL,
    phonetic_ipa VARCHAR(120),
    regional_tags TEXT[] DEFAULT ARRAY['all']::TEXT[],
    example_sentence_target TEXT NOT NULL,
    example_sentence_en TEXT NOT NULL,
    audio_url TEXT,
    curriculum_node_id UUID REFERENCES public.curriculum_nodes(id),
    license_id UUID NOT NULL REFERENCES public.licenses_and_sources(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_vocab_lookup ON public.vocabulary_items(language_code, cefr_level, lemma);

-- 6. Grammar Rules Bank
CREATE TABLE IF NOT EXISTS public.grammar_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language_code VARCHAR(10) NOT NULL,
    rule_code VARCHAR(60) NOT NULL UNIQUE,
    cefr_level VARCHAR(5) NOT NULL,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(60) NOT NULL,
    explanation_markdown TEXT NOT NULL,
    structural_formula TEXT NOT NULL,
    examples JSONB NOT NULL,
    common_errors JSONB NOT NULL,
    regional_notes JSONB,
    license_id UUID NOT NULL REFERENCES public.licenses_and_sources(id),
    curriculum_node_id UUID REFERENCES public.curriculum_nodes(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_grammar_lookup ON public.grammar_rules(language_code, cefr_level);

-- 7. Exercise Templates
CREATE TABLE IF NOT EXISTS public.exercise_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    curriculum_node_id UUID NOT NULL REFERENCES public.curriculum_nodes(id),
    language_code VARCHAR(10) NOT NULL,
    exercise_type VARCHAR(40) NOT NULL,
    prompt_text TEXT NOT NULL,
    context_passage TEXT,
    target_slot_index INTEGER,
    acceptable_solutions TEXT[] NOT NULL,
    distractors JSONB,
    explanation TEXT NOT NULL,
    difficulty SMALLINT NOT NULL DEFAULT 3,
    license_id UUID NOT NULL REFERENCES public.licenses_and_sources(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_exercise_node ON public.exercise_templates(curriculum_node_id, exercise_type);

-- 8. Curated Materials
CREATE TABLE IF NOT EXISTS public.curated_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    curriculum_node_id UUID REFERENCES public.curriculum_nodes(id),
    language_code VARCHAR(10) NOT NULL,
    material_type VARCHAR(40) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content_target TEXT NOT NULL,
    content_en TEXT,
    vocabulary_glossary JSONB,
    comprehension_questions JSONB NOT NULL,
    speaking_prompt TEXT,
    writing_prompt TEXT,
    audio_url TEXT,
    license_id UUID NOT NULL REFERENCES public.licenses_and_sources(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 9. Daily Lessons
CREATE TABLE IF NOT EXISTS public.daily_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    language_track_id UUID NOT NULL REFERENCES public.language_tracks(id) ON DELETE CASCADE,
    lesson_date DATE NOT NULL,
    curriculum_node_id UUID NOT NULL REFERENCES public.curriculum_nodes(id),
    study_mode VARCHAR(20) NOT NULL DEFAULT 'full',
    estimated_minutes SMALLINT NOT NULL DEFAULT 50,
    status VARCHAR(30) NOT NULL DEFAULT 'generated',
    content_payload JSONB NOT NULL,
    completed_sections TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_review_day BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    CONSTRAINT uq_user_track_date UNIQUE (user_id, language_track_id, lesson_date)
);
CREATE INDEX IF NOT EXISTS idx_lessons_user_date ON public.daily_lessons(user_id, lesson_date DESC);

-- 10. Lesson Exercise Attempts
CREATE TABLE IF NOT EXISTS public.lesson_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES public.daily_lessons(id) ON DELETE CASCADE,
    exercise_template_id UUID NOT NULL REFERENCES public.exercise_templates(id),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    submitted_answer TEXT,
    is_correct BOOLEAN,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    feedback_notes TEXT,
    completed_at TIMESTAMPTZ,
    CONSTRAINT uq_lesson_exercise UNIQUE (lesson_id, exercise_template_id)
);

-- 11. Spaced Repetition (SRS) Vocabulary History
CREATE TABLE IF NOT EXISTS public.user_vocabulary_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    vocabulary_item_id UUID NOT NULL REFERENCES public.vocabulary_items(id) ON DELETE CASCADE,
    repetition_count INTEGER NOT NULL DEFAULT 0,
    ease_factor NUMERIC(4, 2) NOT NULL DEFAULT 2.50,
    interval_days INTEGER NOT NULL DEFAULT 0,
    next_review_date DATE NOT NULL DEFAULT CURRENT_DATE,
    last_reviewed_at TIMESTAMPTZ,
    lapse_count INTEGER NOT NULL DEFAULT 0,
    history JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_vocab UNIQUE (user_id, vocabulary_item_id)
);
CREATE INDEX IF NOT EXISTS idx_srs_due_review ON public.user_vocabulary_history(user_id, next_review_date);

-- 12. Email Deliveries and Idempotency Tracking
CREATE TABLE IF NOT EXISTS public.email_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key VARCHAR(120) NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    delivery_date DATE NOT NULL,
    provider VARCHAR(40) NOT NULL DEFAULT 'resend',
    provider_message_id VARCHAR(150),
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    attempt_count INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_delivery_date UNIQUE (user_id, delivery_date)
);
