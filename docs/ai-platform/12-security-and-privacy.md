# 12 — Security & Privacy

> Enforced across `engine/ai/`, `engine/api/http_server.py`, `supabase/migrations/017_ai_platform_persistence.sql`, and `frontend/src/services/providers/ai/geminiProvider.ts`.

## 1. Secret Management

- AI provider keys (`GEMINI_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`) and Supabase service credentials (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) are read **only** on the server from environment variables.
- Client-side `VITE_GEMINI_API_KEY` and `localStorage` key reads have been removed from `frontend/src/services/providers/ai/geminiProvider.ts`.
- HTTP admin endpoints (`/api/admin/*`) validate `Authorization: Bearer <ADMIN_API_TOKEN>` when `ADMIN_API_TOKEN` is configured.

## 2. Row-Level Security & Visibility

- All new tables in `017_ai_platform_persistence.sql` enable PostgreSQL RLS.
- Generation schedules, jobs, attempts, validation reports, and `ai_provider_usage` are restricted to `public.is_admin()` or `service_role`.
- Learners can read only `published` items (`content_items.status = 'published'`, `content_versions.is_published = true`, `discovery_items.status = 'published'`).

## 3. Copyright & Attribution

- `DiscoveryManager` (`engine/ai/discovery_manager.py`) rejects items missing license metadata, attribution text, or `source_url`, and keeps `facts` separated from generated `explanation`.
- `ContentValidator` (`engine/ai/validation.py`) emits provenance warnings when poetry lacks explicit copyright/public-domain status or cultural articles lack `source_references`.
