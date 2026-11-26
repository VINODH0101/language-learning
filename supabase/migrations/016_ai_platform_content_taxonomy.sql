-- ==============================================================================
-- Lexilume — Migration 016: AI Platform content taxonomy (forward-only)
--
-- Purpose:
--   1. Add a nullable `content_type` column to `content_items` to distinguish the
--      eight generation types (story, conversation, poetry, grammar, vocabulary,
--      academic_essay, cultural_article, practice) from the legacy `genre`
--      classification.
--   2. Add a supporting index for content-type filtering.
--
-- Invariants:
--   - Additive only; does not drop or rename any existing column.
--   - Nullable so existing rows are not forced into a premature mapping; a
--     separate data backfill can populate it from `genre` later.
--   - Reconciliation of `daily_published_content` into the unified content model
--     is intentionally deferred to a dedicated, non-destructive data migration.
-- ==============================================================================

ALTER TABLE public.content_items
    ADD COLUMN IF NOT EXISTS content_type VARCHAR(30);

ALTER TABLE public.content_items
    ADD CONSTRAINT ck_content_items_content_type
    CHECK (
        content_type IS NULL OR
        content_type IN (
            'story',
            'conversation',
            'poetry',
            'grammar',
            'vocabulary',
            'academic_essay',
            'cultural_article',
            'practice'
        )
    );

CREATE INDEX IF NOT EXISTS idx_content_items_content_type
    ON public.content_items (content_type);
