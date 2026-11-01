-- ==============================================================================
-- Lexilume — Migration 011: Daily Lessons Schema Reconciliation & Deduplication
-- Harmonizes PostgREST Python engine endpoints with Supabase daily_lessons schema.
-- ==============================================================================

-- 1. Extend daily_lessons table with direct language, fingerprint, and payload alias columns
ALTER TABLE public.daily_lessons
    ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'pt',
    ADD COLUMN IF NOT EXISTS cefr_level VARCHAR(5) DEFAULT 'C1',
    ADD COLUMN IF NOT EXISTS content_fingerprint VARCHAR(64),
    ADD COLUMN IF NOT EXISTS payload JSONB;

-- 2. Populate payload from content_payload if payload is null
UPDATE public.daily_lessons
SET payload = content_payload
WHERE payload IS NULL AND content_payload IS NOT NULL;

-- 3. Populate content_payload from payload if content_payload is null
UPDATE public.daily_lessons
SET content_payload = payload
WHERE content_payload IS NULL AND payload IS NOT NULL;

-- 4. Create trigger to keep content_payload and payload synchronized
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

-- 5. Create performance and query indexes
CREATE INDEX IF NOT EXISTS idx_daily_lessons_lang_date ON public.daily_lessons(user_id, language, lesson_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_lessons_fingerprint ON public.daily_lessons(content_fingerprint);

-- 6. Ensure Service Role and Authenticated RLS policies exist
ALTER TABLE public.daily_lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on daily_lessons" ON public.daily_lessons;
CREATE POLICY "Service role full access on daily_lessons"
    ON public.daily_lessons
    FOR ALL
    TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Users can manage own daily lessons" ON public.daily_lessons;
CREATE POLICY "Users can manage own daily lessons"
    ON public.daily_lessons
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id OR user_id IN (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()))
    WITH CHECK (auth.uid() = user_id OR user_id IN (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()));
