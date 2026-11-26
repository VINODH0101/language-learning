# 11 — Storage, Cache & Retention

> Implemented across `engine/ai/supabase_store.py`, `engine/api/supabase_repository.py`, `supabase/migrations/015`–`017`, and `frontend/src/services/localDb.ts`.

## 1. Storage Architecture

| Layer | Purpose | Implementation |
| :--- | :--- | :--- |
| Server Database | Authoritative catalogue, drafts, review queue, schedules, jobs, usage | Supabase PostgreSQL (`015`, `016`, `017`) via `SupabaseRestClient` |
| Offline / Local Server Fallback | Zero-config testing & offline CI runs | `InMemoryJobStore`, `InMemoryContentRepository` |
| Client Cache & Progress | Offline learning, SM-2, sync queue, cached published content | IndexedDB via Dexie (`frontend/src/services/localDb.ts`) + `StorageService` |

## 2. Idempotency & Immutability

- **Generation jobs**: keyed by `idempotency_key` (`schedule_id:date:combo`) with `on_conflict=idempotency_key` upsert in `SupabaseJobStore`.
- **Review queue**: `content_review_items.idempotency_key` prevents duplicate review entries per draft.
- **Published versions**: `content_versions` enforces immutability via `trg_prevent_published_version_mutation` (migration `015`).

## 3. Retention Policy (Defaults)

- Published `content_items` / `content_versions`: retained while active in catalogue.
- Unapproved drafts, generation jobs/attempts, validation reports, and `ai_provider_usage`: retained in admin-only tables per `04-database-design.md` §6 and cleaned by retention jobs without touching learner progress.
