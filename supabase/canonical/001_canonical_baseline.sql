-- ==============================================================================
-- Lexilume — Canonical Baseline Database Schema (Migration 001_canonical_baseline.sql)
-- 
-- Single, consistent, reproducible database schema for Lexilume.
-- Unifies:
-- - Supabase Authentication (auth.users identity provider)
-- - React / TypeScript frontend & Dexie IndexedDB sync engine
-- - Python Polyglot learning engine (FastAPI / PostgREST)
-- - Spaced Repetition System (SM-2)
-- - Multi-course and linguistic decoupling (Interface, Target, Explanation, Variety)
-- - Strict Row-Level Security (RLS) and Tenant Isolation
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. EDUCATIONAL REFERENCE TABLES (Public Read)
-- ==============================================================================

-- 1.1 Legal Attribution and Sources
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

-- 1.2 Curriculum Nodes Bank
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

-- 1.3 Vocabulary Lexicon Bank
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
    license_id UUID REFERENCES public.licenses_and_sources(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_vocab_lookup ON public.vocabulary_items(language_code, cefr_level, lemma);

-- 1.4 Grammar Rules Bank
CREATE TABLE IF NOT EXISTS public.grammar_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language_code VARCHAR(10) NOT NULL,
    rule_code VARCHAR(60) NOT NULL UNIQUE,
    cefr_level VARCHAR(5) NOT NULL,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(60) NOT NULL,
    explanation_markdown TEXT NOT NULL,
    structural_formula TEXT NOT NULL,
    examples JSONB NOT NULL DEFAULT '[]'::JSONB,
    common_errors JSONB NOT NULL DEFAULT '[]'::JSONB,
    regional_notes JSONB,
    license_id UUID REFERENCES public.licenses_and_sources(id),
    curriculum_node_id UUID REFERENCES public.curriculum_nodes(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_grammar_lookup ON public.grammar_rules(language_code, cefr_level);

-- 1.5 Exercise Templates Bank
CREATE TABLE IF NOT EXISTS public.exercise_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    curriculum_node_id UUID REFERENCES public.curriculum_nodes(id),
    language_code VARCHAR(10) NOT NULL,
    exercise_type VARCHAR(40) NOT NULL,
    prompt_text TEXT NOT NULL,
    context_passage TEXT,
    target_slot_index INTEGER,
    acceptable_solutions TEXT[] NOT NULL,
    distractors JSONB,
    explanation TEXT NOT NULL,
    difficulty SMALLINT NOT NULL DEFAULT 3,
    license_id UUID REFERENCES public.licenses_and_sources(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_exercise_node ON public.exercise_templates(curriculum_node_id, exercise_type);

-- 1.6 Curated Materials Bank
CREATE TABLE IF NOT EXISTS public.curated_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    curriculum_node_id UUID REFERENCES public.curriculum_nodes(id),
    language_code VARCHAR(10) NOT NULL,
    material_type VARCHAR(40) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content_target TEXT NOT NULL,
    content_en TEXT,
    vocabulary_glossary JSONB,
    comprehension_questions JSONB NOT NULL DEFAULT '[]'::JSONB,
    speaking_prompt TEXT,
    writing_prompt TEXT,
    audio_url TEXT,
    license_id UUID REFERENCES public.licenses_and_sources(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 2. USER IDENTITY, ROLES & PREFERENCES
-- ==============================================================================

-- 2.1 User Profiles Table
-- Direct foreign key to auth.users(id) with matching id and auth_user_id
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    native_language VARCHAR(10) NOT NULL DEFAULT 'pt',
    primary_target_language VARCHAR(10) NOT NULL DEFAULT 'es',
    interface_language VARCHAR(10) NOT NULL DEFAULT 'en',
    explanation_language VARCHAR(10) NOT NULL DEFAULT 'en',
    pt_variety VARCHAR(20) NOT NULL DEFAULT 'pt-BR',
    es_variety VARCHAR(20) NOT NULL DEFAULT 'es-ES',
    study_mode VARCHAR(20) NOT NULL DEFAULT 'full',
    daily_goal_minutes SMALLINT NOT NULL DEFAULT 10,
    theme VARCHAR(20) NOT NULL DEFAULT 'dark',
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    diagnostic_completed BOOLEAN NOT NULL DEFAULT FALSE,
    account_status VARCHAR(20) NOT NULL DEFAULT 'active',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
    preferred_delivery_hour_utc SMALLINT NOT NULL DEFAULT 4,
    email_daily_lesson_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
    email_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_profiles_auth UNIQUE (auth_user_id)
);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON public.user_profiles(is_active, last_active_at);

-- 2.2 User Roles Table (RBAC)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    assigned_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_roles_user_id UNIQUE (user_id)
);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Helper function to check admin role safely in RLS policies
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid()
          AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2.3 Administrative Audit Logs Table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES auth.users(id),
    action VARCHAR(80) NOT NULL,
    target_user_id UUID,
    details JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin ON public.admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_date ON public.admin_audit_logs(created_at DESC);

-- ==============================================================================
-- 3. LEARNING PROGRESS & TRACKS
-- ==============================================================================

-- 3.1 Multi-Course Management (Frontend & Sync Engine)
CREATE TABLE IF NOT EXISTS public.user_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_language VARCHAR(10) NOT NULL,
    regional_variant VARCHAR(20) NOT NULL,
    cefr_level VARCHAR(5) NOT NULL DEFAULT 'B1',
    explanation_language VARCHAR(10) NOT NULL DEFAULT 'en',
    daily_goal_minutes SMALLINT NOT NULL DEFAULT 10,
    streak_days INTEGER NOT NULL DEFAULT 0,
    total_lessons_completed INTEGER NOT NULL DEFAULT 0,
    completed_curriculum_node_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_course UNIQUE (user_id, target_language, regional_variant, cefr_level)
);
CREATE INDEX IF NOT EXISTS idx_user_courses_user ON public.user_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_courses_active ON public.user_courses(user_id, is_active);

-- 3.2 Learning Tracks (Python Polyglot Engine Representation)
CREATE TABLE IF NOT EXISTS public.user_learning_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    language VARCHAR(10) NOT NULL,
    regional_variety VARCHAR(20) NOT NULL DEFAULT 'all',
    current_cefr_level VARCHAR(5) NOT NULL DEFAULT 'A1',
    target_cefr_level VARCHAR(5) NOT NULL DEFAULT 'C1',
    current_curriculum_node_id VARCHAR(100),
    streak_days INTEGER NOT NULL DEFAULT 1,
    total_lessons_completed INTEGER NOT NULL DEFAULT 0,
    completed_curriculum_node_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    presented_vocabulary_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    mastered_vocabulary_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    recent_node_history TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    recent_exercise_history JSONB NOT NULL DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_learning_tracks UNIQUE (user_id, language)
);
CREATE INDEX IF NOT EXISTS idx_user_learning_tracks_lookup ON public.user_learning_tracks(user_id, language);

-- Automatic synchronization trigger: user_courses -> user_learning_tracks
CREATE OR REPLACE FUNCTION public.sync_user_course_to_learning_track()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_learning_tracks (
        user_id,
        language,
        regional_variety,
        current_cefr_level,
        streak_days,
        total_lessons_completed,
        completed_curriculum_node_ids,
        updated_at
    )
    VALUES (
        NEW.user_id,
        NEW.target_language,
        NEW.regional_variant,
        NEW.cefr_level,
        NEW.streak_days,
        NEW.total_lessons_completed,
        NEW.completed_curriculum_node_ids,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (user_id, language) DO UPDATE SET
        regional_variety = EXCLUDED.regional_variety,
        current_cefr_level = EXCLUDED.current_cefr_level,
        streak_days = EXCLUDED.streak_days,
        total_lessons_completed = EXCLUDED.total_lessons_completed,
        completed_curriculum_node_ids = EXCLUDED.completed_curriculum_node_ids,
        updated_at = CURRENT_TIMESTAMP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_user_course_to_learning_track ON public.user_courses;
CREATE TRIGGER trg_sync_user_course_to_learning_track
    AFTER INSERT OR UPDATE ON public.user_courses
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_user_course_to_learning_track();

-- ==============================================================================
-- 4. SPACED REPETITION & VOCABULARY
-- ==============================================================================

-- 4.1 Spaced Repetition (SM-2) Items Table
CREATE TABLE IF NOT EXISTS public.srs_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vocabulary_item_id VARCHAR(120) NOT NULL,
    language VARCHAR(10) NOT NULL,
    repetition_count INTEGER NOT NULL DEFAULT 0,
    ease_factor NUMERIC(4, 2) NOT NULL DEFAULT 2.50,
    interval_days INTEGER NOT NULL DEFAULT 1,
    next_review_date DATE NOT NULL DEFAULT CURRENT_DATE,
    last_reviewed_at TIMESTAMPTZ,
    lapse_count INTEGER NOT NULL DEFAULT 0,
    mastery_status VARCHAR(20) NOT NULL DEFAULT 'presented',
    history JSONB NOT NULL DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_srs_user_vocab UNIQUE (user_id, vocabulary_item_id)
);
CREATE INDEX IF NOT EXISTS idx_srs_items_user_due ON public.srs_items(user_id, next_review_date);
CREATE INDEX IF NOT EXISTS idx_srs_items_user_lang ON public.srs_items(user_id, language);

-- 4.2 Saved Translations / Personal Phrasebook Table
CREATE TABLE IF NOT EXISTS public.saved_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source_text VARCHAR(1000) NOT NULL,
    translated_text VARCHAR(1000) NOT NULL,
    source_lang VARCHAR(10) NOT NULL,
    target_lang VARCHAR(10) NOT NULL,
    provider_used VARCHAR(40) NOT NULL DEFAULT 'dictionary',
    is_verified BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_saved_translations_key UNIQUE (user_id, source_text, target_lang)
);
CREATE INDEX IF NOT EXISTS idx_saved_translations_user ON public.saved_translations(user_id, created_at DESC);

-- Quota Enforcement Trigger: Max 500 saved vocabulary items per user
CREATE OR REPLACE FUNCTION public.check_saved_translation_quota()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO current_count
    FROM public.saved_translations
    WHERE user_id = NEW.user_id;

    IF current_count >= 500 THEN
        RAISE EXCEPTION 'Capacidade máxima de vocabulário atingida (limite de 500 itens salvos). Remova itens antigos antes de salvar novos.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_saved_translation_quota ON public.saved_translations;
CREATE TRIGGER trg_enforce_saved_translation_quota
    BEFORE INSERT ON public.saved_translations
    FOR EACH ROW
    EXECUTE FUNCTION public.check_saved_translation_quota();

-- ==============================================================================
-- 5. CULTURAL BOOKMARKS & DISCOVERY
-- ==============================================================================

-- 5.1 Cultural Bookmarks Table
CREATE TABLE IF NOT EXISTS public.cultural_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    article_id VARCHAR(100) NOT NULL,
    article_title VARCHAR(255) NOT NULL,
    content_language VARCHAR(10) NOT NULL,
    origin_country VARCHAR(100) NOT NULL,
    topic VARCHAR(50) NOT NULL,
    cefr_level VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_cultural_bookmark UNIQUE (user_id, article_id)
);
CREATE INDEX IF NOT EXISTS idx_cultural_bookmarks_user ON public.cultural_bookmarks(user_id, created_at DESC);

-- Quota Enforcement Trigger: Max 200 cultural bookmarks per user
CREATE OR REPLACE FUNCTION public.check_cultural_bookmark_quota()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO current_count
    FROM public.cultural_bookmarks
    WHERE user_id = NEW.user_id;

    IF current_count >= 200 THEN
        RAISE EXCEPTION 'Capacidade máxima de artigos culturais atingida (limite de 200 favoritos). Remova artigos antigos antes de salvar novos.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_cultural_bookmark_quota ON public.cultural_bookmarks;
CREATE TRIGGER trg_enforce_cultural_bookmark_quota
    BEFORE INSERT ON public.cultural_bookmarks
    FOR EACH ROW
    EXECUTE FUNCTION public.check_cultural_bookmark_quota();

-- ==============================================================================
-- 6. EXERCISES, DAILY LESSONS & READING ASSIGNMENTS
-- ==============================================================================

-- 6.1 Exercise Attempts Table
CREATE TABLE IF NOT EXISTS public.exercise_attempts (
    id VARCHAR(120) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exercise_id VARCHAR(120) NOT NULL,
    curriculum_node_id VARCHAR(100),
    language VARCHAR(10),
    submitted_answer TEXT,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    score INTEGER,
    max_score INTEGER,
    passed BOOLEAN,
    feedback TEXT,
    attempt_count INTEGER NOT NULL DEFAULT 1,
    response_payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_user ON public.exercise_attempts(user_id, created_at DESC);

-- 6.2 Daily Lessons Table
CREATE TABLE IF NOT EXISTS public.daily_lessons (
    id VARCHAR(120) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    language VARCHAR(10) NOT NULL DEFAULT 'pt',
    lesson_date DATE NOT NULL,
    cefr_level VARCHAR(5) NOT NULL DEFAULT 'C1',
    curriculum_node_id VARCHAR(100),
    study_mode VARCHAR(20) NOT NULL DEFAULT 'full',
    estimated_minutes SMALLINT NOT NULL DEFAULT 15,
    content_fingerprint VARCHAR(64),
    status VARCHAR(30) NOT NULL DEFAULT 'generated',
    payload JSONB NOT NULL,
    content_payload JSONB NOT NULL,
    completed_sections TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    CONSTRAINT uq_daily_lessons_user_date UNIQUE (user_id, language, lesson_date)
);
CREATE INDEX IF NOT EXISTS idx_daily_lessons_lookup ON public.daily_lessons(user_id, language, lesson_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_lessons_fingerprint ON public.daily_lessons(content_fingerprint);

-- Synchronization Trigger: Keep payload and content_payload identical
CREATE OR REPLACE FUNCTION public.sync_daily_lessons_payload()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.payload IS NOT NULL AND NEW.content_payload IS NULL THEN
        NEW.content_payload := NEW.payload;
    ELSIF NEW.content_payload IS NOT NULL AND NEW.payload IS NULL THEN
        NEW.payload := NEW.content_payload;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_daily_lessons_payload ON public.daily_lessons;
CREATE TRIGGER trg_sync_daily_lessons_payload
    BEFORE INSERT OR UPDATE ON public.daily_lessons
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_daily_lessons_payload();

-- 6.3 Minimal Wikipedia Reading Assignments Table
CREATE TABLE IF NOT EXISTS public.lesson_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    language VARCHAR(10) NOT NULL,
    assignment_date DATE NOT NULL,
    article_id VARCHAR(50) NOT NULL,
    article_title VARCHAR(255) NOT NULL,
    article_url TEXT NOT NULL,
    revision_id VARCHAR(50),
    cefr_level VARCHAR(5) NOT NULL DEFAULT 'B2',
    topic_category VARCHAR(50) NOT NULL DEFAULT 'General',
    status VARCHAR(30) NOT NULL DEFAULT 'assigned',
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_lang_assignment_date UNIQUE (user_id, language, assignment_date)
);
CREATE INDEX IF NOT EXISTS idx_assignments_user_date ON public.lesson_assignments(user_id, assignment_date DESC);
CREATE INDEX IF NOT EXISTS idx_assignments_article ON public.lesson_assignments(article_id);

-- ==============================================================================
-- 7. EMAIL DELIVERIES & RETENTION LOGS
-- ==============================================================================

-- 7.1 Email Deliveries Ledger Table
CREATE TABLE IF NOT EXISTS public.email_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    delivery_date DATE NOT NULL,
    delivery_purpose VARCHAR(50) NOT NULL DEFAULT 'daily_digest',
    idempotency_key VARCHAR(128) NOT NULL UNIQUE,
    provider VARCHAR(50) NOT NULL DEFAULT 'resend',
    provider_message_id VARCHAR(255),
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'sent', 'failed')),
    attempt_count INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_delivery_date_purpose UNIQUE (user_id, delivery_date, delivery_purpose)
);
CREATE INDEX IF NOT EXISTS idx_email_deliveries_user_date ON public.email_deliveries(user_id, delivery_date);
CREATE INDEX IF NOT EXISTS idx_email_deliveries_status ON public.email_deliveries(status);

-- 7.2 Retention Maintenance Logs Table
CREATE TABLE IF NOT EXISTS public.retention_cleanup_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    executed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_dry_run BOOLEAN NOT NULL DEFAULT FALSE,
    pruned_lessons_count INTEGER NOT NULL DEFAULT 0,
    pruned_attempts_count INTEGER NOT NULL DEFAULT 0,
    preserved_users_count INTEGER NOT NULL DEFAULT 0,
    preserved_tracks_count INTEGER NOT NULL DEFAULT 0,
    preserved_srs_count INTEGER NOT NULL DEFAULT 0,
    log_summary TEXT NOT NULL
);

-- ==============================================================================
-- 8. AUTOMATED SIGNUP & PROFILE INITIALIZATION TRIGGER
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (
        id,
        auth_user_id,
        email,
        full_name,
        created_at,
        last_active_at
    )
    VALUES (
        NEW.id,
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Learner'),
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (auth_user_id) DO UPDATE SET
        email = EXCLUDED.email,
        last_active_at = CURRENT_TIMESTAMP;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users if auth schema is present in environment
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_new_user();
    END IF;
END $$;

-- ==============================================================================
-- 9. ROW-LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- 9.1 Public Educational Reference Tables (Public Read Access)
ALTER TABLE public.licenses_and_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grammar_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curated_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access on licenses" ON public.licenses_and_sources;
CREATE POLICY "Public read access on licenses" ON public.licenses_and_sources
    FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public read access on curriculum" ON public.curriculum_nodes;
CREATE POLICY "Public read access on curriculum" ON public.curriculum_nodes
    FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public read access on vocabulary" ON public.vocabulary_items;
CREATE POLICY "Public read access on vocabulary" ON public.vocabulary_items
    FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public read access on grammar" ON public.grammar_rules;
CREATE POLICY "Public read access on grammar" ON public.grammar_rules
    FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public read access on exercise templates" ON public.exercise_templates;
CREATE POLICY "Public read access on exercise templates" ON public.exercise_templates
    FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public read access on curated materials" ON public.curated_materials;
CREATE POLICY "Public read access on curated materials" ON public.curated_materials
    FOR SELECT TO anon, authenticated USING (true);

-- 9.2 User Profiles RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = auth_user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = auth_user_id OR public.is_admin())
    WITH CHECK (auth.uid() = auth_user_id OR public.is_admin());

-- 9.3 User Roles & Audit Logs RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
CREATE POLICY "Users can view own role" ON public.user_roles
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" ON public.user_roles
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.admin_audit_logs
    FOR SELECT TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can insert audit logs" ON public.admin_audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = admin_id AND public.is_admin());

-- 9.4 User Courses RLS
ALTER TABLE public.user_courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own courses" ON public.user_courses;
CREATE POLICY "Users can view own courses" ON public.user_courses
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert own courses" ON public.user_courses;
CREATE POLICY "Users can insert own courses" ON public.user_courses
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own courses" ON public.user_courses;
CREATE POLICY "Users can update own courses" ON public.user_courses
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own courses" ON public.user_courses;
CREATE POLICY "Users can delete own courses" ON public.user_courses
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- 9.5 User Learning Tracks RLS
ALTER TABLE public.user_learning_tracks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own learning tracks" ON public.user_learning_tracks;
CREATE POLICY "Users can view own learning tracks" ON public.user_learning_tracks
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert own learning tracks" ON public.user_learning_tracks;
CREATE POLICY "Users can insert own learning tracks" ON public.user_learning_tracks
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own learning tracks" ON public.user_learning_tracks;
CREATE POLICY "Users can update own learning tracks" ON public.user_learning_tracks
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 9.6 SRS Items RLS
ALTER TABLE public.srs_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own srs items" ON public.srs_items;
CREATE POLICY "Users can manage own srs items" ON public.srs_items
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 9.7 Saved Translations RLS
ALTER TABLE public.saved_translations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own saved translations" ON public.saved_translations;
CREATE POLICY "Users can view own saved translations" ON public.saved_translations
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own saved translations" ON public.saved_translations;
CREATE POLICY "Users can insert own saved translations" ON public.saved_translations
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own saved translations" ON public.saved_translations;
CREATE POLICY "Users can update own saved translations" ON public.saved_translations
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own saved translations" ON public.saved_translations;
CREATE POLICY "Users can delete own saved translations" ON public.saved_translations
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- 9.8 Cultural Bookmarks RLS
ALTER TABLE public.cultural_bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own cultural bookmarks" ON public.cultural_bookmarks;
CREATE POLICY "Users can view own cultural bookmarks" ON public.cultural_bookmarks
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own cultural bookmarks" ON public.cultural_bookmarks;
CREATE POLICY "Users can insert own cultural bookmarks" ON public.cultural_bookmarks
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own cultural bookmarks" ON public.cultural_bookmarks;
CREATE POLICY "Users can update own cultural bookmarks" ON public.cultural_bookmarks
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own cultural bookmarks" ON public.cultural_bookmarks;
CREATE POLICY "Users can delete own cultural bookmarks" ON public.cultural_bookmarks
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- 9.9 Exercise Attempts RLS
ALTER TABLE public.exercise_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own exercise attempts" ON public.exercise_attempts;
CREATE POLICY "Users can view own exercise attempts" ON public.exercise_attempts
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert own exercise attempts" ON public.exercise_attempts;
CREATE POLICY "Users can insert own exercise attempts" ON public.exercise_attempts
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- 9.10 Daily Lessons RLS
ALTER TABLE public.daily_lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own daily lessons" ON public.daily_lessons;
CREATE POLICY "Users can view own daily lessons" ON public.daily_lessons
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert own daily lessons" ON public.daily_lessons;
CREATE POLICY "Users can insert own daily lessons" ON public.daily_lessons
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own daily lessons" ON public.daily_lessons;
CREATE POLICY "Users can update own daily lessons" ON public.daily_lessons
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 9.11 Minimal Reading Assignments RLS
ALTER TABLE public.lesson_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own assignments" ON public.lesson_assignments;
CREATE POLICY "Users can view own assignments" ON public.lesson_assignments
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own assignments" ON public.lesson_assignments;
CREATE POLICY "Users can insert own assignments" ON public.lesson_assignments
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own assignments" ON public.lesson_assignments;
CREATE POLICY "Users can update own assignments" ON public.lesson_assignments
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

-- 9.12 Email Deliveries & Retention Logs RLS
ALTER TABLE public.email_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retention_cleanup_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Learners can view own email deliveries" ON public.email_deliveries;
CREATE POLICY "Learners can view own email deliveries" ON public.email_deliveries
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- 9.13 Service Role Super-Access on All User & Maintenance Tables
CREATE POLICY "Service role full access on user_profiles" ON public.user_profiles
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on user_roles" ON public.user_roles
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on admin_audit_logs" ON public.admin_audit_logs
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on user_courses" ON public.user_courses
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on user_learning_tracks" ON public.user_learning_tracks
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on srs_items" ON public.srs_items
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on saved_translations" ON public.saved_translations
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on cultural_bookmarks" ON public.cultural_bookmarks
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on exercise_attempts" ON public.exercise_attempts
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on daily_lessons" ON public.daily_lessons
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on lesson_assignments" ON public.lesson_assignments
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on email_deliveries" ON public.email_deliveries
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on retention_cleanup_logs" ON public.retention_cleanup_logs
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ==============================================================================
-- 10. GRANTS
-- ==============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO authenticated, service_role;

GRANT SELECT ON TABLE
    public.licenses_and_sources,
    public.curriculum_nodes,
    public.vocabulary_items,
    public.grammar_rules,
    public.exercise_templates,
    public.curated_materials,
    public.daily_published_content
TO anon;

-- ==============================================================================
-- 11. DAILY CONTENT STUDIO (POETRY & CONVERSATION)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.daily_published_content (
    id VARCHAR(64) PRIMARY KEY,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('poetry', 'conversation')),
    title VARCHAR(255) NOT NULL,
    author_or_speaker VARCHAR(255),
    scenario TEXT,
    learning_language VARCHAR(10) NOT NULL CHECK (learning_language <> 'hi'),
    cefr_level VARCHAR(5) NOT NULL CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1')),
    excerpt TEXT,
    full_content TEXT,
    dialogue JSONB,
    cultural_context TEXT,
    country_name VARCHAR(100),
    country_code VARCHAR(10),
    translation TEXT,
    published_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    archived_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_daily_content_active 
    ON public.daily_published_content(content_type, learning_language, is_active);

CREATE INDEX IF NOT EXISTS idx_daily_content_published 
    ON public.daily_published_content(published_at DESC);

ALTER TABLE public.daily_published_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active daily content"
    ON public.daily_published_content
    FOR SELECT
    USING (is_active = TRUE OR auth.role() = 'service_role');

CREATE POLICY "Service role full access on daily_published_content"
    ON public.daily_published_content
    FOR ALL
    TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

CREATE POLICY "Admins can manage daily published content"
    ON public.daily_published_content
    FOR ALL
    TO authenticated
    USING (
        (auth.jwt() ->> 'role') = 'admin'
        OR EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        (auth.jwt() ->> 'role') = 'admin'
        OR EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );
