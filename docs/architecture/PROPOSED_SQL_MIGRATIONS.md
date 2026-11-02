# Lexilume — Proposed SQL Migrations Specification

> **Repository:** `VINODH0101/language-learning` (Lexilume — Illuminate Your Words)  
> **Production Application:** `https://lexi.monster`  
> **Phase:** Phase 5 — Database Design, Data Mapping & Safe Migration Plan  
> **Target Migration Number:** `015`  
> **Status:** **PROPOSED — SPECIFICATION ONLY. NOT EXECUTED IN DATABASE.**

---

> [!CAUTION]
> **GOVERNANCE & SAFETY NOTICE**  
> The SQL scripts contained in this document are **PROPOSED ARCHITECTURAL BLUEPRINTS**.  
> They have **NOT** been applied to the live production database (`https://lexi.monster`) and have **NOT** been written to active migration directories (`supabase/migrations/`).  
> Execution of these scripts must only occur during an authorized migration window following formal Phase 5 review.

---

## 1. Migration Overview & Sequence

| Script Identifier | Execution Timing | Purpose & Scope |
| :--- | :--- | :--- |
| **`015_content_centred_architecture.sql`** | Phase A (Expand) | Creates 8 target tables, constraints, indexes, RLS policies, and 2 compatibility views. |
| **`015_backfill_legacy_data.sql`** | Phase B (Data Population) | Idempotent, chunked batch migration of legacy vocabulary, progress, and curated texts. |
| **`015_rollback.sql`** | Emergency Rollback Only | Deterministic reversal script restoring database state to Migration 014 baseline. |

---

## 2. Proposed DDL Migration: `015_content_centred_architecture.sql`

```sql
-- ============================================================================
-- Migration 015: Content-Centred Language Learning Architecture
-- Target: Lexilume (https://lexi.monster)
-- Baseline: Migrations 001 through 014
-- Mode: Non-destructive expand phase (IF NOT EXISTS guards on all entities)
-- ============================================================================

-- Set execution safety timeouts
SET statement_timeout = '30s';
SET lock_timeout = '3s';

-- ----------------------------------------------------------------------------
-- 1. Attribution and Licensing
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.content_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_name VARCHAR(100) NOT NULL,
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

-- ----------------------------------------------------------------------------
-- 2. Authentic Content Items Catalog
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.english_content_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(220) NOT NULL,
    summary TEXT,
    genre VARCHAR(50) NOT NULL CHECK (genre IN (
        'conversation', 'dialogue', 'short_story', 'literature', 
        'news_article', 'workplace_email', 'business_report', 
        'academic_essay', 'culture_and_travel', 'grammar_in_action'
    )),
    primary_cefr VARCHAR(2) NOT NULL CHECK (primary_cefr IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    estimated_read_minutes INTEGER NOT NULL DEFAULT 3 CHECK (estimated_read_minutes > 0),
    status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft', 'processing', 'in_review', 'published', 'archived'
    )),
    current_version_id UUID, -- Circular FK added below
    source_id UUID REFERENCES public.content_sources(id) ON DELETE SET NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_english_content_items_slug UNIQUE (slug)
);

CREATE INDEX IF NOT EXISTS idx_content_items_catalog ON public.english_content_items(status, primary_cefr, genre);
CREATE INDEX IF NOT EXISTS idx_content_items_created_at ON public.english_content_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_items_source_id ON public.english_content_items(source_id);

-- ----------------------------------------------------------------------------
-- 3. Immutable Content Versions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.content_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_item_id UUID NOT NULL REFERENCES public.english_content_items(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL DEFAULT 1 CHECK (version_number > 0),
    cefr_level VARCHAR(2) NOT NULL CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
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

-- Circular foreign key from english_content_items to content_versions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_content_items_current_version'
    ) THEN
        ALTER TABLE public.english_content_items
            ADD CONSTRAINT fk_content_items_current_version
            FOREIGN KEY (current_version_id)
            REFERENCES public.content_versions(id)
            ON DELETE SET NULL;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 4. Learning Activities
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.learning_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_version_id UUID NOT NULL REFERENCES public.content_versions(id) ON DELETE CASCADE,
    activity_type VARCHAR(40) NOT NULL CHECK (activity_type IN (
        'reading_comprehension', 'vocabulary_cloze', 'grammar_transformation',
        'listening_dictation', 'sentence_scramble', 'spoken_shadowing', 'free_writing'
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

-- ----------------------------------------------------------------------------
-- 5. Learner Content Progress Telemetry
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.learner_content_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_item_id UUID NOT NULL REFERENCES public.english_content_items(id) ON DELETE CASCADE,
    content_version_id UUID NOT NULL REFERENCES public.content_versions(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'not_started' CHECK (status IN (
        'not_started', 'in_progress', 'completed', 'revisiting'
    )),
    percent_complete INTEGER NOT NULL DEFAULT 0 CHECK (percent_complete >= 0 AND percent_complete <= 100),
    completed_activity_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    time_spent_seconds INTEGER NOT NULL DEFAULT 0 CHECK (time_spent_seconds >= 0),
    comprehension_score REAL CHECK (comprehension_score >= 0.0 AND comprehension_score <= 1.0),
    first_opened_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_studied_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_learner_content_user_item UNIQUE (user_id, content_item_id)
);

CREATE INDEX IF NOT EXISTS idx_learner_progress_user ON public.learner_content_progress(user_id, status, last_studied_at DESC);
CREATE INDEX IF NOT EXISTS idx_learner_progress_item ON public.learner_content_progress(content_item_id);

-- ----------------------------------------------------------------------------
-- 6. Consolidated Personal Lexicon & SM-2 Spaced Repetition
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_saved_words (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    term VARCHAR(100) NOT NULL,
    lemma VARCHAR(100) NOT NULL,
    pos VARCHAR(30),
    cefr_level VARCHAR(2) CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    explanation_language VARCHAR(5) NOT NULL DEFAULT 'en' CHECK (explanation_language IN ('en', 'pt', 'es')),
    definition TEXT NOT NULL,
    context_sentence TEXT,
    context_translation TEXT,
    source_content_id UUID REFERENCES public.english_content_items(id) ON DELETE SET NULL,
    audio_url TEXT,
    ipa VARCHAR(60),
    next_review DATE NOT NULL DEFAULT CURRENT_DATE,
    interval_days INTEGER NOT NULL DEFAULT 0 CHECK (interval_days >= 0),
    ease_factor REAL NOT NULL DEFAULT 2.5 CHECK (ease_factor >= 1.3),
    repetitions INTEGER NOT NULL DEFAULT 0 CHECK (repetitions >= 0),
    lapses INTEGER NOT NULL DEFAULT 0 CHECK (lapses >= 0),
    last_reviewed_at TIMESTAMPTZ,
    state VARCHAR(20) NOT NULL DEFAULT 'learning' CHECK (state IN ('learning', 'reviewing', 'mastered', 'ignored')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_saved_words_user_lemma_lang UNIQUE (user_id, lemma, explanation_language)
);

CREATE INDEX IF NOT EXISTS idx_user_saved_words_review_queue ON public.user_saved_words(user_id, next_review ASC) WHERE state IN ('learning', 'reviewing');
CREATE INDEX IF NOT EXISTS idx_user_saved_words_user_term ON public.user_saved_words(user_id, term);
CREATE INDEX IF NOT EXISTS idx_user_saved_words_source ON public.user_saved_words(source_content_id);

-- ----------------------------------------------------------------------------
-- 7. Mistake Notebook
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_mistakes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_item_id UUID REFERENCES public.english_content_items(id) ON DELETE SET NULL,
    activity_id UUID REFERENCES public.learning_activities(id) ON DELETE SET NULL,
    activity_type VARCHAR(40) NOT NULL,
    error_category VARCHAR(50) NOT NULL CHECK (error_category IN (
        'vocabulary_choice', 'verb_tense', 'preposition', 'spelling', 
        'word_order', 'article_usage', 'comprehension_inference', 'pronunciation'
    )),
    stimulus TEXT NOT NULL,
    user_response TEXT NOT NULL,
    correct_response TEXT NOT NULL,
    pedagogical_explanation TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'unresolved' CHECK (status IN (
        'unresolved', 'review_pending', 'mastered', 'dismissed'
    )),
    occurrences_count INTEGER NOT NULL DEFAULT 1 CHECK (occurrences_count >= 1),
    first_occurred_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_occurred_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_user_mistakes_queue ON public.user_mistakes(user_id, status, error_category);
CREATE INDEX IF NOT EXISTS idx_user_mistakes_content ON public.user_mistakes(content_item_id);

-- ----------------------------------------------------------------------------
-- 8. Content Processing Jobs Tracker
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.content_processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_item_id UUID NOT NULL REFERENCES public.english_content_items(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(30) NOT NULL DEFAULT 'queued' CHECK (status IN (
        'queued', 'running', 'completed', 'failed', 'cancelled'
    )),
    current_stage VARCHAR(50) NOT NULL DEFAULT 'stage_0_intake',
    stages_completed JSONB NOT NULL DEFAULT '[]'::jsonb,
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

-- ----------------------------------------------------------------------------
-- 9. Migration Exception Audit Log
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.migration_exception_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_table VARCHAR(60) NOT NULL,
    source_record_id TEXT NOT NULL,
    error_message TEXT NOT NULL,
    failed_payload JSONB,
    logged_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ----------------------------------------------------------------------------
-- 10. Automatic Updated-At Triggers
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN SELECT unnest(ARRAY[
        'content_sources', 'english_content_items', 'learner_content_progress', 
        'user_saved_words', 'user_mistakes', 'content_processing_jobs'
    ]) LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trigger_update_%I_timestamp ON public.%I;', t, t);
        EXECUTE format('CREATE TRIGGER trigger_update_%I_timestamp BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();', t, t);
    END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 11. Backward Compatibility Views
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_legacy_srs_items AS
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

CREATE OR REPLACE VIEW public.v_legacy_daily_content AS
SELECT 
    c.id::text AS id,
    c.title,
    c.summary AS context_background,
    v.structured_payload->>'cefr_level' AS cefr_level,
    c.genre AS content_type,
    v.structured_payload->>'text' AS source_text,
    c.created_at AS published_at,
    (c.status = 'published') AS is_active,
    c.created_by,
    c.created_at,
    c.updated_at
FROM public.english_content_items c
JOIN public.content_versions v ON c.current_version_id = v.id
WHERE c.status = 'published';

-- ----------------------------------------------------------------------------
-- 12. Row-Level Security Policies
-- ----------------------------------------------------------------------------
ALTER TABLE public.content_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.english_content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learner_content_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_saved_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_mistakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_processing_jobs ENABLE ROW LEVEL SECURITY;

-- Sources
DROP POLICY IF EXISTS "Public and learners can view content sources" ON public.content_sources;
CREATE POLICY "Public and learners can view content sources" ON public.content_sources FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage content sources" ON public.content_sources;
CREATE POLICY "Admins can manage content sources" ON public.content_sources FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Items
DROP POLICY IF EXISTS "Anyone can view published content items" ON public.english_content_items;
CREATE POLICY "Anyone can view published content items" ON public.english_content_items FOR SELECT USING (status = 'published');
DROP POLICY IF EXISTS "Admins can view all content items" ON public.english_content_items;
CREATE POLICY "Admins can view all content items" ON public.english_content_items FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can manage content items" ON public.english_content_items;
CREATE POLICY "Admins can manage content items" ON public.english_content_items FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Versions
DROP POLICY IF EXISTS "Anyone can view published content versions" ON public.content_versions;
CREATE POLICY "Anyone can view published content versions" ON public.content_versions FOR SELECT USING (is_published = true);
DROP POLICY IF EXISTS "Admins can view all content versions" ON public.content_versions;
CREATE POLICY "Admins can view all content versions" ON public.content_versions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can manage content versions" ON public.content_versions;
CREATE POLICY "Admins can manage content versions" ON public.content_versions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Activities
DROP POLICY IF EXISTS "Anyone can view published activities" ON public.learning_activities;
CREATE POLICY "Anyone can view published activities" ON public.learning_activities FOR SELECT USING (EXISTS (SELECT 1 FROM public.content_versions v WHERE v.id = learning_activities.content_version_id AND v.is_published = true));
DROP POLICY IF EXISTS "Admins can manage activities" ON public.learning_activities;
CREATE POLICY "Admins can manage activities" ON public.learning_activities FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Progress
DROP POLICY IF EXISTS "Learners can view own progress" ON public.learner_content_progress;
CREATE POLICY "Learners can view own progress" ON public.learner_content_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Learners can insert own progress" ON public.learner_content_progress;
CREATE POLICY "Learners can insert own progress" ON public.learner_content_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Learners can update own progress" ON public.learner_content_progress;
CREATE POLICY "Learners can update own progress" ON public.learner_content_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view all progress" ON public.learner_content_progress;
CREATE POLICY "Admins can view all progress" ON public.learner_content_progress FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Saved Words
DROP POLICY IF EXISTS "Learners can view own saved words" ON public.user_saved_words;
CREATE POLICY "Learners can view own saved words" ON public.user_saved_words FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Learners can insert own saved words" ON public.user_saved_words;
CREATE POLICY "Learners can insert own saved words" ON public.user_saved_words FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Learners can update own saved words" ON public.user_saved_words;
CREATE POLICY "Learners can update own saved words" ON public.user_saved_words FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Learners can delete own saved words" ON public.user_saved_words;
CREATE POLICY "Learners can delete own saved words" ON public.user_saved_words FOR DELETE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view all saved words" ON public.user_saved_words;
CREATE POLICY "Admins can view all saved words" ON public.user_saved_words FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Mistakes
DROP POLICY IF EXISTS "Learners can view own mistakes" ON public.user_mistakes;
CREATE POLICY "Learners can view own mistakes" ON public.user_mistakes FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Learners can insert own mistakes" ON public.user_mistakes;
CREATE POLICY "Learners can insert own mistakes" ON public.user_mistakes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Learners can update own mistakes" ON public.user_mistakes;
CREATE POLICY "Learners can update own mistakes" ON public.user_mistakes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view all mistakes" ON public.user_mistakes;
CREATE POLICY "Admins can view all mistakes" ON public.user_mistakes FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Jobs
DROP POLICY IF EXISTS "Admins can manage processing jobs" ON public.content_processing_jobs;
CREATE POLICY "Admins can manage processing jobs" ON public.content_processing_jobs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
```

---

## 3. Proposed Batch Backfill Script: `015_backfill_legacy_data.sql`

```sql
-- ============================================================================
-- Batch Backfill: Legacy Data to Target Schema
-- Target: Lexilume (https://lexi.monster)
-- Execution Mode: Controlled, idempotent, chunked transactions
-- ============================================================================

-- Step 1: Backfill Content Sources
INSERT INTO public.content_sources (
    source_name,
    source_type,
    author,
    original_url,
    license_type,
    attribution_notice
)
SELECT 
    ls.source_key,
    'open_license',
    ls.attribution_data->>'author',
    ls.attribution_data->>'url',
    coalesce(ls.license_code, 'CC-BY-SA-4.0'),
    coalesce(ls.attribution_data->>'notice', 'Curated educational material')
FROM public.licenses_and_sources ls
ON CONFLICT DO NOTHING;

-- Step 2: Backfill Curated Reading Materials into Content Items & Versions
DO $$
DECLARE
    rec RECORD;
    v_item_id UUID;
    v_ver_id UUID;
    v_slug TEXT;
BEGIN
    FOR rec IN 
        SELECT id, title, cefr_level, content_payload, created_at 
        FROM public.curated_materials
    LOOP
        v_slug := lower(regexp_replace(rec.title, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(rec.id::text, 1, 8);
        
        -- Insert Content Item
        INSERT INTO public.english_content_items (
            title,
            slug,
            summary,
            genre,
            primary_cefr,
            estimated_read_minutes,
            status,
            created_at
        ) VALUES (
            rec.title,
            v_slug,
            substring(rec.content_payload->>'excerpt' from 1 for 300),
            'short_story',
            coalesce(rec.cefr_level, 'B1'),
            coalesce((rec.content_payload->>'reading_time_minutes')::integer, 3),
            'published',
            rec.created_at
        )
        ON CONFLICT (slug) DO UPDATE SET updated_at = timezone('utc'::text, now())
        RETURNING id INTO v_item_id;

        -- Insert Content Version 1
        INSERT INTO public.content_versions (
            content_item_id,
            version_number,
            cefr_level,
            structured_payload,
            word_count,
            is_published,
            published_at,
            created_at
        ) VALUES (
            v_item_id,
            1,
            coalesce(rec.cefr_level, 'B1'),
            jsonb_build_object(
                'title', rec.title,
                'raw_text', rec.content_payload->>'full_text',
                'source', 'legacy_curated_materials'
            ),
            coalesce((rec.content_payload->>'word_count')::integer, 0),
            true,
            rec.created_at,
            rec.created_at
        )
        ON CONFLICT (content_item_id, version_number) DO UPDATE SET change_summary = 'Backfilled from legacy curated materials'
        RETURNING id INTO v_ver_id;

        -- Link current_version_id
        UPDATE public.english_content_items 
        SET current_version_id = v_ver_id 
        WHERE id = v_item_id AND current_version_id IS NULL;
    END LOOP;
END $$;

-- Step 3: Backfill Vocabulary and Spaced Repetition (Batch Chunked)
DO $$
DECLARE
    v_batch_size CONSTANT INTEGER := 500;
    v_rows_migrated INTEGER := 0;
    v_total_migrated INTEGER := 0;
    v_last_processed_id UUID := '00000000-0000-0000-0000-000000000000'::uuid;
BEGIN
    LOOP
        WITH batch AS (
            SELECT 
                st.id,
                st.user_id,
                st.source_text,
                st.target_text,
                st.target_lang,
                st.created_at
            FROM public.saved_translations st
            WHERE st.id > v_last_processed_id
              AND st.user_id IN (SELECT id FROM auth.users)
            ORDER BY st.id ASC
            LIMIT v_batch_size
        ),
        inserted AS (
            INSERT INTO public.user_saved_words (
                user_id,
                term,
                lemma,
                explanation_language,
                definition,
                next_review,
                ease_factor,
                interval_days,
                repetitions,
                state,
                created_at,
                updated_at
            )
            SELECT 
                b.user_id,
                b.source_text,
                lower(trim(b.source_text)),
                coalesce(b.target_lang, 'en'),
                b.target_text,
                CURRENT_DATE,
                2.5,
                0,
                0,
                'learning',
                b.created_at,
                b.created_at
            FROM batch b
            ON CONFLICT (user_id, lemma, explanation_language) 
            DO UPDATE SET 
                definition = EXCLUDED.definition,
                updated_at = timezone('utc'::text, now())
            RETURNING id
        )
        SELECT count(*), max(b.id) 
        INTO v_rows_migrated, v_last_processed_id 
        FROM batch b;

        EXIT WHEN v_rows_migrated = 0;
        v_total_migrated := v_total_migrated + v_rows_migrated;
        PERFORM pg_sleep(0.05);
    END LOOP;

    RAISE NOTICE 'Vocabulary backfill complete. Processed % records.', v_total_migrated;
END $$;
```

---

## 4. Proposed Reversal Script: `015_rollback.sql`

```sql
-- ============================================================================
-- Migration 015 Rollback Script
-- Target: Lexilume (https://lexi.monster)
-- Reversion: Restores database to exact Migration 014 baseline
-- Safety: Legacy tables 001-014 are completely untouched
-- ============================================================================

DROP VIEW IF EXISTS public.v_legacy_daily_content CASCADE;
DROP VIEW IF EXISTS public.v_legacy_srs_items CASCADE;

DROP TABLE IF EXISTS public.migration_exception_logs CASCADE;
DROP TABLE IF EXISTS public.content_processing_jobs CASCADE;
DROP TABLE IF EXISTS public.user_mistakes CASCADE;
DROP TABLE IF EXISTS public.user_saved_words CASCADE;
DROP TABLE IF EXISTS public.learner_content_progress CASCADE;
DROP TABLE IF EXISTS public.learning_activities CASCADE;

-- Drop circular constraint before dropping versions & items
ALTER TABLE IF EXISTS public.english_content_items DROP CONSTRAINT IF EXISTS fk_content_items_current_version;

DROP TABLE IF EXISTS public.content_versions CASCADE;
DROP TABLE IF EXISTS public.english_content_items CASCADE;
DROP TABLE IF EXISTS public.content_sources CASCADE;
```
