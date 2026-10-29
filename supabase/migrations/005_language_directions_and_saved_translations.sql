-- ==============================================================================
-- Polyglot C1 Daily — Migration 005: Language Directions, Inactive Account
-- Tracking, and Minimal Saved Translations (Bookmarks)
-- ==============================================================================

-- 1. Extend user_profiles with language learning directions & activity timestamps
ALTER TABLE public.user_profiles
    ADD COLUMN IF NOT EXISTS native_language VARCHAR(10) DEFAULT 'pt',
    ADD COLUMN IF NOT EXISTS primary_target_language VARCHAR(10) DEFAULT 'es',
    ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- 2. Create minimal saved_translations table (Only persisted on explicit bookmark click)
CREATE TABLE IF NOT EXISTS public.saved_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    source_text VARCHAR(1000) NOT NULL,
    translated_text VARCHAR(1000) NOT NULL,
    source_lang VARCHAR(10) NOT NULL,
    target_lang VARCHAR(10) NOT NULL,
    provider_used VARCHAR(40) NOT NULL DEFAULT 'dictionary',
    is_verified BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast user bookmark lookups
CREATE INDEX IF NOT EXISTS idx_saved_trans_user ON public.saved_translations(user_id, created_at DESC);

-- 3. Function & Trigger to enforce strict per-user cap of 500 saved translations
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

-- 4. Enable Row-Level Security (RLS)
ALTER TABLE public.saved_translations ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
DROP POLICY IF EXISTS "Users can view own saved translations" ON public.saved_translations;
CREATE POLICY "Users can view own saved translations"
    ON public.saved_translations
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own saved translations" ON public.saved_translations;
CREATE POLICY "Users can insert own saved translations"
    ON public.saved_translations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own saved translations" ON public.saved_translations;
CREATE POLICY "Users can delete own saved translations"
    ON public.saved_translations
    FOR DELETE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role has full access to saved translations" ON public.saved_translations;
CREATE POLICY "Service role has full access to saved translations"
    ON public.saved_translations
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');
