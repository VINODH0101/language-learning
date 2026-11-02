-- ==============================================================================
-- Lexilume — Migration 015: Content-Centred Learning Architecture
--
-- Core Invariants:
-- 1. Authentic content is the primary source of truth for learning activities.
-- 2. Published content versions are strictly immutable.
-- 3. Four-way linguistic decoupling: target_language and explanation_language
--    are independent columns.
-- 4. Cross-language lemma collision protection: unique constraint on
--    (user_id, target_language, lemma, pos, explanation_language).
-- 5. Full SM-2 scheduling parameter retention.
-- 6. Stable surrogate keys (UUIDs) for progress and mistakes.
-- 7. Idempotent sync support via client_mutation_id.
-- 8. Backward-compatibility views declare WITH (security_invoker = true).
-- 9. Row-Level Security (RLS) enabled on all tables with explicit user isolation.
-- ==============================================================================

-- 1. Content Sources & Licensing
CREATE TABLE IF NOT EXISTS public.content_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_name VARCHAR(150) NOT NULL,
    source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('public_domain', 'open_license', 'editorial', 'user_submitted', 'partner')),
    author VARCHAR(150),
    original_url TEXT,
    license_type VARCHAR(50) NOT NULL DEFAULT 'CC-BY-SA-4.0',
    license_text TEXT,
    attribution_notice TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_content_sources_license ON public.content_sources(license_type);

-- 2. Content Items (Unified Catalog for Authentic Learning Content)
CREATE TABLE IF NOT EXISTS public.content_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    target_language VARCHAR(10) NOT NULL DEFAULT 'en' CHECK (target_language IN ('en', 'pt', 'es')),
    explanation_language VARCHAR(10) NOT NULL DEFAULT 'en' CHECK (explanation_language IN ('en', 'pt', 'es')),
    source_language VARCHAR(10) DEFAULT 'en',
    summary TEXT,
    genre VARCHAR(50) NOT NULL CHECK (genre IN (
        'conversation', 'dialogue', 'short_story', 'literature', 
        'news_article', 'workplace_email', 'business_report', 
        'academic_essay', 'culture_and_travel', 'grammar_in_action',
        'instructions_and_guides', 'interview_and_discussion', 'reviews_and_opinions'
    )),
    primary_cefr VARCHAR(5) NOT NULL CHECK (primary_cefr IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    estimated_read_minutes INTEGER NOT NULL DEFAULT 3 CHECK (estimated_read_minutes > 0),
    status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft', 'processing', 'review_required', 'approved', 'published', 'archived'
    )),
    current_version_id UUID,
    source_id UUID REFERENCES public.content_sources(id) ON DELETE SET NULL,
    rights_status VARCHAR(50) NOT NULL DEFAULT 'public_domain' CHECK (rights_status IN (
        'original', 'public_domain', 'licensed', 'permitted', 'restricted', 'unknown'
    )),
    rights_notes TEXT,
    source_url TEXT,
    author VARCHAR(150),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_content_items_slug UNIQUE (slug)
);

CREATE INDEX IF NOT EXISTS idx_content_items_catalog ON public.content_items(target_language, status, primary_cefr, genre);
CREATE INDEX IF NOT EXISTS idx_content_items_created_at ON public.content_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_items_source_id ON public.content_items(source_id);

-- 3. Content Versions (Immutable Snapshots)
CREATE TABLE IF NOT EXISTS public.content_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_item_id UUID NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL DEFAULT 1 CHECK (version_number > 0),
    cefr_level VARCHAR(5) NOT NULL CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    structured_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    audio_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    word_count INTEGER NOT NULL DEFAULT 0 CHECK (word_count >= 0),
    sentence_count INTEGER NOT NULL DEFAULT 0 CHECK (sentence_count >= 0),
    lexical_density REAL CHECK (lexical_density >= 0.0 AND lexical_density <= 1.0),
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    change_summary VARCHAR(255),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_content_versions_item_version UNIQUE (content_item_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_content_versions_item ON public.content_versions(content_item_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_content_versions_published ON public.content_versions(is_published, cefr_level);
CREATE INDEX IF NOT EXISTS idx_content_versions_payload_gin ON public.content_versions USING gin(structured_payload);

-- Circular foreign key from content_items to content_versions
ALTER TABLE public.content_items
    ADD CONSTRAINT fk_content_items_current_version
    FOREIGN KEY (current_version_id)
    REFERENCES public.content_versions(id)
    ON DELETE SET NULL;

-- 4. Learning Activities (Bound to Immutable Content Versions)
CREATE TABLE IF NOT EXISTS public.learning_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_version_id UUID NOT NULL REFERENCES public.content_versions(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN (
        'reading_comprehension', 'vocabulary_cloze', 'grammar_transformation',
        'listening_dictation', 'sentence_scramble', 'spoken_shadowing', 'free_writing',
        'true_false', 'short_answer'
    )),
    activity_title VARCHAR(150) NOT NULL,
    activity_order INTEGER NOT NULL DEFAULT 1 CHECK (activity_order > 0),
    estimated_minutes INTEGER NOT NULL DEFAULT 5 CHECK (estimated_minutes > 0),
    configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_learning_activities_version_order UNIQUE (content_version_id, activity_order)
);

CREATE INDEX IF NOT EXISTS idx_learning_activities_version ON public.learning_activities(content_version_id, activity_order ASC);
CREATE INDEX IF NOT EXISTS idx_learning_activities_type ON public.learning_activities(activity_type);

-- 5. Learner Content Progress (Tracked per Learner, Item, and Version)
CREATE TABLE IF NOT EXISTS public.learner_content_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_item_id UUID NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
    content_version_id UUID NOT NULL REFERENCES public.content_versions(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'not_started' CHECK (status IN (
        'not_started', 'in_progress', 'completed', 'revisiting'
    )),
    percent_complete INTEGER NOT NULL DEFAULT 0 CHECK (percent_complete >= 0 AND percent_complete <= 100),
    completed_activity_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    time_spent_seconds INTEGER NOT NULL DEFAULT 0 CHECK (time_spent_seconds >= 0),
    comprehension_score REAL CHECK (comprehension_score >= 0.0 AND comprehension_score <= 1.0),
    client_mutation_id VARCHAR(64),
    first_opened_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_studied_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_learner_content_user_item UNIQUE (user_id, content_item_id)
);

CREATE INDEX IF NOT EXISTS idx_learner_progress_user ON public.learner_content_progress(user_id, status, last_studied_at DESC);
CREATE INDEX IF NOT EXISTS idx_learner_progress_item ON public.learner_content_progress(content_item_id);
CREATE INDEX IF NOT EXISTS idx_learner_progress_mutation ON public.learner_content_progress(user_id, client_mutation_id) WHERE client_mutation_id IS NOT NULL;

-- 6. User Saved Words (Personal Lexicon & SM-2 Spaced Repetition)
-- Resolves Risk 1: unique constraint includes target_language and pos
-- Resolves Risk 2: full retention of all 8 SM-2 scheduling fields
CREATE TABLE IF NOT EXISTS public.user_saved_words (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_language VARCHAR(10) NOT NULL DEFAULT 'en' CHECK (target_language IN ('en', 'pt', 'es')),
    explanation_language VARCHAR(10) NOT NULL DEFAULT 'en' CHECK (explanation_language IN ('en', 'pt', 'es')),
    term VARCHAR(120) NOT NULL,
    lemma VARCHAR(120) NOT NULL,
    pos VARCHAR(30) NOT NULL DEFAULT 'other',
    cefr_level VARCHAR(5) CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    definition TEXT NOT NULL,
    context_sentence TEXT,
    context_translation TEXT,
    source_content_id UUID REFERENCES public.content_items(id) ON DELETE SET NULL,
    source_version_id UUID REFERENCES public.content_versions(id) ON DELETE SET NULL,
    audio_url TEXT,
    ipa VARCHAR(80),
    client_mutation_id VARCHAR(64),

    -- SM-2 Spaced Repetition Scheduling Fields (Fully Preserved)
    ease_factor REAL NOT NULL DEFAULT 2.5 CHECK (ease_factor >= 1.3),
    interval_days INTEGER NOT NULL DEFAULT 0 CHECK (interval_days >= 0),
    repetitions INTEGER NOT NULL DEFAULT 0 CHECK (repetitions >= 0),
    lapses INTEGER NOT NULL DEFAULT 0 CHECK (lapses >= 0),
    last_reviewed_at TIMESTAMPTZ,
    next_review DATE NOT NULL DEFAULT CURRENT_DATE,
    legacy_srs_item_id VARCHAR(100),

    state VARCHAR(20) NOT NULL DEFAULT 'learning' CHECK (state IN ('learning', 'reviewing', 'mastered', 'ignored')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_saved_words UNIQUE (user_id, target_language, lemma, pos, explanation_language)
);

CREATE INDEX IF NOT EXISTS idx_user_saved_words_review_queue ON public.user_saved_words(user_id, target_language, next_review ASC) WHERE state IN ('learning', 'reviewing');
CREATE INDEX IF NOT EXISTS idx_user_saved_words_user_term ON public.user_saved_words(user_id, target_language, term);
CREATE INDEX IF NOT EXISTS idx_user_saved_words_source ON public.user_saved_words(source_content_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_words_mutation ON public.user_saved_words(user_id, client_mutation_id) WHERE client_mutation_id IS NOT NULL;

-- 7. User Word Review Events (Discrete History of SM-2 Reviews)
CREATE TABLE IF NOT EXISTS public.user_word_review_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    saved_word_id UUID NOT NULL REFERENCES public.user_saved_words(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 0 AND rating <= 5),
    previous_interval_days INTEGER NOT NULL DEFAULT 0,
    new_interval_days INTEGER NOT NULL,
    previous_ease_factor REAL NOT NULL,
    new_ease_factor REAL NOT NULL,
    client_mutation_id VARCHAR(64),
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_word_reviews_user_word ON public.user_word_review_events(user_id, saved_word_id, reviewed_at DESC);

-- 8. User Mistakes (Mistake Notebook for Pedagogical Remediation)
CREATE TABLE IF NOT EXISTS public.user_mistakes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_item_id UUID REFERENCES public.content_items(id) ON DELETE SET NULL,
    content_version_id UUID REFERENCES public.content_versions(id) ON DELETE SET NULL,
    activity_id UUID REFERENCES public.learning_activities(id) ON DELETE SET NULL,
    activity_type VARCHAR(50) NOT NULL,
    error_category VARCHAR(50) NOT NULL CHECK (error_category IN (
        'vocabulary_choice', 'verb_tense', 'preposition', 'spelling', 
        'word_order', 'article_usage', 'comprehension_inference', 'pronunciation', 'general'
    )),
    stimulus TEXT NOT NULL,
    user_response TEXT NOT NULL,
    correct_response TEXT NOT NULL,
    pedagogical_explanation TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'unresolved' CHECK (status IN (
        'unresolved', 'review_pending', 'mastered', 'dismissed'
    )),
    occurrences_count INTEGER NOT NULL DEFAULT 1 CHECK (occurrences_count >= 1),
    client_mutation_id VARCHAR(64),
    first_occurred_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_occurred_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_user_mistakes_queue ON public.user_mistakes(user_id, status, error_category);
CREATE INDEX IF NOT EXISTS idx_user_mistakes_content ON public.user_mistakes(content_item_id);
CREATE INDEX IF NOT EXISTS idx_user_mistakes_mutation ON public.user_mistakes(user_id, client_mutation_id) WHERE client_mutation_id IS NOT NULL;

-- 9. Content Processing Jobs (Durable Asynchronous Pipeline Tracker)
CREATE TABLE IF NOT EXISTS public.content_processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_item_id UUID NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL DEFAULT 1 CHECK (version_number > 0),
    status VARCHAR(30) NOT NULL DEFAULT 'queued' CHECK (status IN (
        'queued', 'running', 'completed', 'failed', 'cancelled'
    )),
    current_stage VARCHAR(50) NOT NULL DEFAULT 'stage_0_intake',
    stages_completed JSONB NOT NULL DEFAULT '[]'::jsonb,
    stage_outputs JSONB NOT NULL DEFAULT '{}'::jsonb,
    stage_timings JSONB NOT NULL DEFAULT '{}'::jsonb,
    error_message TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0 CHECK (retry_count >= 0),
    triggered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_content_jobs_worker ON public.content_processing_jobs(status, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_content_jobs_item ON public.content_processing_jobs(content_item_id, version_number);

-- 10. Migration Exception Logs (Audit of Skipped/Malformed Items)
CREATE TABLE IF NOT EXISTS public.migration_exception_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_table VARCHAR(100) NOT NULL,
    source_record_id VARCHAR(100),
    reason TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 11. Compatibility Views (Resolves Risk 6 with security_invoker = true)
-- ==============================================================================

-- 11.1 English Content Items Compatibility View
CREATE OR REPLACE VIEW public.english_content_items 
WITH (security_invoker = true) AS
SELECT 
    id,
    title,
    slug,
    summary,
    genre,
    primary_cefr,
    estimated_read_minutes,
    status,
    current_version_id,
    source_id,
    created_by,
    created_at,
    updated_at
FROM public.content_items
WHERE target_language = 'en';

-- 11.2 Spaced Repetition Compatibility View (Emulates legacy srs_items)
CREATE OR REPLACE VIEW public.v_legacy_srs_items 
WITH (security_invoker = true) AS
SELECT 
    id,
    user_id,
    lemma AS vocabulary_item_id,
    interval_days AS interval,
    ease_factor,
    repetitions,
    next_review::text AS next_review_date,
    last_reviewed_at AS last_reviewed,
    created_at,
    updated_at
FROM public.user_saved_words;

-- 11.3 Daily Content Compatibility View (Emulates legacy daily_published_content)
CREATE OR REPLACE VIEW public.v_legacy_daily_content 
WITH (security_invoker = true) AS
SELECT 
    c.id::text AS id,
    c.title,
    c.summary AS context_background,
    v.cefr_level AS cefr_level,
    c.genre AS content_type,
    v.structured_payload->>'text' AS source_text,
    c.created_at AS published_at,
    (c.status = 'published') AS is_active,
    c.created_by,
    c.created_at,
    c.updated_at
FROM public.content_items c
JOIN public.content_versions v ON c.current_version_id = v.id
WHERE c.status = 'published';

-- ==============================================================================
-- 12. Row-Level Security (RLS) Policies
-- ==============================================================================

ALTER TABLE public.content_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learner_content_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_saved_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_word_review_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_mistakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.migration_exception_logs ENABLE ROW LEVEL SECURITY;

-- 12.1 Content Sources: Public read; Admin write
DROP POLICY IF EXISTS "Public read access on content_sources" ON public.content_sources;
CREATE POLICY "Public read access on content_sources"
    ON public.content_sources FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Admin write access on content_sources" ON public.content_sources;
CREATE POLICY "Admin write access on content_sources"
    ON public.content_sources FOR ALL
    TO authenticated
    USING (public.is_admin() OR auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (public.is_admin() OR auth.jwt() ->> 'role' = 'service_role');

-- 12.2 Content Items: Public read for published; Admin full access
DROP POLICY IF EXISTS "Public read published content_items" ON public.content_items;
CREATE POLICY "Public read published content_items"
    ON public.content_items FOR SELECT
    USING (status = 'published' OR public.is_admin() OR auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Admin write access on content_items" ON public.content_items;
CREATE POLICY "Admin write access on content_items"
    ON public.content_items FOR ALL
    TO authenticated
    USING (public.is_admin() OR auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (public.is_admin() OR auth.jwt() ->> 'role' = 'service_role');

-- 12.3 Content Versions: Public read for published; Admin full access
DROP POLICY IF EXISTS "Public read published content_versions" ON public.content_versions;
CREATE POLICY "Public read published content_versions"
    ON public.content_versions FOR SELECT
    USING (is_published = true OR public.is_admin() OR auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Admin write access on content_versions" ON public.content_versions;
CREATE POLICY "Admin write access on content_versions"
    ON public.content_versions FOR ALL
    TO authenticated
    USING (public.is_admin() OR auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (public.is_admin() OR auth.jwt() ->> 'role' = 'service_role');

-- 12.4 Learning Activities: Public read for published versions; Admin full access
DROP POLICY IF EXISTS "Public read learning_activities for published content" ON public.learning_activities;
CREATE POLICY "Public read learning_activities for published content"
    ON public.learning_activities FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.content_versions cv
            WHERE cv.id = learning_activities.content_version_id AND cv.is_published = true
        )
        OR public.is_admin()
        OR auth.jwt() ->> 'role' = 'service_role'
    );

DROP POLICY IF EXISTS "Admin write access on learning_activities" ON public.learning_activities;
CREATE POLICY "Admin write access on learning_activities"
    ON public.learning_activities FOR ALL
    TO authenticated
    USING (public.is_admin() OR auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (public.is_admin() OR auth.jwt() ->> 'role' = 'service_role');

-- 12.5 Learner Content Progress: Strictly User-Owned
DROP POLICY IF EXISTS "Learner reads own progress" ON public.learner_content_progress;
CREATE POLICY "Learner reads own progress"
    ON public.learner_content_progress FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Learner inserts own progress" ON public.learner_content_progress;
CREATE POLICY "Learner inserts own progress"
    ON public.learner_content_progress FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Learner updates own progress" ON public.learner_content_progress;
CREATE POLICY "Learner updates own progress"
    ON public.learner_content_progress FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Learner deletes own progress" ON public.learner_content_progress;
CREATE POLICY "Learner deletes own progress"
    ON public.learner_content_progress FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

-- 12.6 User Saved Words: Strictly User-Owned
DROP POLICY IF EXISTS "User reads own saved words" ON public.user_saved_words;
CREATE POLICY "User reads own saved words"
    ON public.user_saved_words FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "User inserts own saved words" ON public.user_saved_words;
CREATE POLICY "User inserts own saved words"
    ON public.user_saved_words FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "User updates own saved words" ON public.user_saved_words;
CREATE POLICY "User updates own saved words"
    ON public.user_saved_words FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "User deletes own saved words" ON public.user_saved_words;
CREATE POLICY "User deletes own saved words"
    ON public.user_saved_words FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

-- 12.7 User Word Review Events: Strictly User-Owned
DROP POLICY IF EXISTS "User reads own review events" ON public.user_word_review_events;
CREATE POLICY "User reads own review events"
    ON public.user_word_review_events FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "User inserts own review events" ON public.user_word_review_events;
CREATE POLICY "User inserts own review events"
    ON public.user_word_review_events FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

-- 12.8 User Mistakes: Strictly User-Owned
DROP POLICY IF EXISTS "User reads own mistakes" ON public.user_mistakes;
CREATE POLICY "User reads own mistakes"
    ON public.user_mistakes FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "User inserts own mistakes" ON public.user_mistakes;
CREATE POLICY "User inserts own mistakes"
    ON public.user_mistakes FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "User updates own mistakes" ON public.user_mistakes;
CREATE POLICY "User updates own mistakes"
    ON public.user_mistakes FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "User deletes own mistakes" ON public.user_mistakes;
CREATE POLICY "User deletes own mistakes"
    ON public.user_mistakes FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

-- 12.9 Content Processing Jobs: Admin & Service Role Only
DROP POLICY IF EXISTS "Admin access on content_processing_jobs" ON public.content_processing_jobs;
CREATE POLICY "Admin access on content_processing_jobs"
    ON public.content_processing_jobs FOR ALL
    TO authenticated
    USING (public.is_admin() OR auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (public.is_admin() OR auth.jwt() ->> 'role' = 'service_role');

-- 12.10 Migration Exception Logs: Admin & Service Role Only
DROP POLICY IF EXISTS "Admin access on migration_exception_logs" ON public.migration_exception_logs;
CREATE POLICY "Admin access on migration_exception_logs"
    ON public.migration_exception_logs FOR ALL
    TO authenticated
    USING (public.is_admin() OR auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (public.is_admin() OR auth.jwt() ->> 'role' = 'service_role');

-- ==============================================================================
-- 13. Idempotent Triggers for updated_at & Immutability
-- ==============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE FUNCTION public.update_updated_at_column()
        RETURNS TRIGGER AS $trg$
        BEGIN
            NEW.updated_at = timezone('utc'::text, now());
            RETURN NEW;
        END;
        $trg$ LANGUAGE plpgsql;
    END IF;
END $$;

DROP TRIGGER IF EXISTS trg_content_sources_updated_at ON public.content_sources;
CREATE TRIGGER trg_content_sources_updated_at
    BEFORE UPDATE ON public.content_sources
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_content_items_updated_at ON public.content_items;
CREATE TRIGGER trg_content_items_updated_at
    BEFORE UPDATE ON public.content_items
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_learner_progress_updated_at ON public.learner_content_progress;
CREATE TRIGGER trg_learner_progress_updated_at
    BEFORE UPDATE ON public.learner_content_progress
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_user_saved_words_updated_at ON public.user_saved_words;
CREATE TRIGGER trg_user_saved_words_updated_at
    BEFORE UPDATE ON public.user_saved_words
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_user_mistakes_updated_at ON public.user_mistakes;
CREATE TRIGGER trg_user_mistakes_updated_at
    BEFORE UPDATE ON public.user_mistakes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_content_jobs_updated_at ON public.content_processing_jobs;
CREATE TRIGGER trg_content_jobs_updated_at
    BEFORE UPDATE ON public.content_processing_jobs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 13.2 Idempotent Database Trigger for Content Version Immutability
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'prevent_published_version_mutation') THEN
        CREATE FUNCTION public.prevent_published_version_mutation()
        RETURNS TRIGGER AS $immut$
        BEGIN
            -- If already published, reject any alterations to pedagogical payload or core metrics
            IF OLD.is_published = true THEN
                IF NEW.structured_payload IS DISTINCT FROM OLD.structured_payload OR
                   NEW.cefr_level IS DISTINCT FROM OLD.cefr_level OR
                   NEW.word_count IS DISTINCT FROM OLD.word_count OR
                   NEW.sentence_count IS DISTINCT FROM OLD.sentence_count THEN
                    RAISE EXCEPTION 'Published content versions are immutable. Create a new version edition instead (version_number + 1).'
                        USING ERRCODE = '23514';
                END IF;
            END IF;
            RETURN NEW;
        END;
        $immut$ LANGUAGE plpgsql;
    END IF;
END $$;

DROP TRIGGER IF EXISTS trg_prevent_published_version_mutation ON public.content_versions;
CREATE TRIGGER trg_prevent_published_version_mutation
    BEFORE UPDATE ON public.content_versions
    FOR EACH ROW EXECUTE FUNCTION public.prevent_published_version_mutation();
