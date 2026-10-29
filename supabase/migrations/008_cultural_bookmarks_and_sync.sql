-- ==============================================================================
-- Polyglot C1 Daily — Migration 008: Cultural Bookmarks and Sync Queue
-- Supports worldwide cultural discovery bookmarks under Row-Level Security
-- ==============================================================================

-- 1. Create cultural_bookmarks table
CREATE TABLE IF NOT EXISTS public.cultural_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    article_id VARCHAR(100) NOT NULL,
    article_title VARCHAR(255) NOT NULL,
    content_language VARCHAR(10) NOT NULL CHECK (content_language IN ('pt', 'es', 'en')),
    origin_country VARCHAR(100) NOT NULL,
    topic VARCHAR(50) NOT NULL,
    cefr_level VARCHAR(10) NOT NULL CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_cultural_bookmark UNIQUE (user_id, article_id)
);

-- Index for speedy queries ordered by save time
CREATE INDEX IF NOT EXISTS idx_cultural_bookmarks_user ON public.cultural_bookmarks(user_id, created_at DESC);

-- 2. Enable Row-Level Security
ALTER TABLE public.cultural_bookmarks ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies: Authenticated users can only manage their own bookmarks
DROP POLICY IF EXISTS "Users can view own cultural bookmarks" ON public.cultural_bookmarks;
CREATE POLICY "Users can view own cultural bookmarks"
    ON public.cultural_bookmarks
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own cultural bookmarks" ON public.cultural_bookmarks;
CREATE POLICY "Users can insert own cultural bookmarks"
    ON public.cultural_bookmarks
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own cultural bookmarks" ON public.cultural_bookmarks;
CREATE POLICY "Users can delete own cultural bookmarks"
    ON public.cultural_bookmarks
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 4. Quota Enforcement: Limit each user to max 200 cultural bookmarks to protect free-tier storage
CREATE OR REPLACE FUNCTION public.check_cultural_bookmark_quota()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO current_count
    FROM public.cultural_bookmarks
    WHERE user_id = NEW.user_id;

    IF current_count >= 200 THEN
        RAISE EXCEPTION 'Capacidade máxima de artigos culturais salvos atingida (limite de 200 favoritos). Remova favoritos antigos antes de salvar novos.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_cultural_bookmark_quota ON public.cultural_bookmarks;
CREATE TRIGGER trg_enforce_cultural_bookmark_quota
    BEFORE INSERT ON public.cultural_bookmarks
    FOR EACH ROW
    EXECUTE FUNCTION public.check_cultural_bookmark_quota();
