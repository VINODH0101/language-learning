# Lexilume — AI Content & Discovery Platform

> Documentation index for the centralized content engine, multi-provider AI layer, Discovery platform, scheduling, data model, and operations.

## Status

- **Phase 0 (Audit)** — complete (`01`, `02`).
- **Phase 1 (Architecture & contracts)** — complete (`03`–`07`, `09`, `15`; `engine/ai` contracts).
- **Phase 2 (Persistence reliability)** — complete. UUID generation, error-checked Supabase writes, forward-only migrations `016_ai_platform_content_taxonomy.sql` and `017_ai_platform_persistence.sql`, `SupabaseJobStore` (`engine/ai/supabase_store.py`), and `SupabaseContentRepository` (`engine/api/supabase_repository.py`).
- **Phase 3 (AI provider layer)** — complete. `engine/ai/providers/` (Gemini, Groq, DeepSeek), capability registry, `DefaultProviderRouter` with priority/health/cooldown/budget selection and fallback, failure classification, and `.env.example`.
- **Phase 4 (Content generation engine)** — complete. `engine/ai/generation.py` + `prompts.py`/`validation.py`/`enrichment.py`/`dedupe.py`/`fallback.py` produce validated (recursive JSON Schema), language-aware, deduplicated drafts for all eight types (no auto-publish).
- **Phase 5 (Scheduling & job management)** — complete. `engine/ai/scheduling.py`, `scripts/run_content_generation.py` (persisting via Supabase when configured or in-memory offline), and `.github/workflows/daily_polyglot.yml`.
- **Phase 6 (Discovery engine)** — complete. `engine/ai/discovery_manager.py` + `engine/ai/discovery_adapters.py` (per-source isolation, dedupe, attribution enforcement, offline fixture support).
- **Phase 7 (Shared content APIs)** — complete. `engine/api/` (`ContentAccessService`, `DiscoveryAccessService`, and zero-dependency `HttpApiRouter` / `http_server.py`).
- **Phase 8 (Admin Content Studio)** — complete. `engine/api/admin_service.py` + HTTP `/admin/*` endpoints + `frontend/src/services/adminService.ts` + `frontend/src/features/admin/AdminContentReview.tsx` (review queue, approve→publish, reject, AI generation trigger).
- **Phase 9 (Frontend integration)** — complete for core content access & security. `frontend/src/services/contentAccess.ts` (shared client with `explanationLanguage`, `vocabulary`, `grammar`, `search`, and HTTP transport) wired into `LearnCatalog.tsx`; browser-side Gemini secrets retired from `frontend/src/services/providers/ai/geminiProvider.ts`.
- **Phase 10 (QA & Operations)** — complete (`11`–`14`, E2E tests in `tests/test_ai_e2e_flow.py` and `tests/test_ai_supabase_persistence.py`).

## Documents

| # | Document | Purpose |
| :--- | :--- | :--- |
| 01 | [Existing System Audit](01-existing-system-audit.md) | Current architecture, modules, flows, defects, reusable assets, proposed changes |
| 02 | [Existing Database Inventory](02-existing-database-inventory.md) | Tables, columns, constraints, indexes, FKs, RLS |
| 03 | [Target System Architecture](03-target-system-architecture.md) | End-state component responsibilities and decisions |
| 04 | [Database Design](04-database-design.md) | Schema design, relationships, migration impact |
| 05 | [Content Schemas](05-content-schemas.md) | JSON schemas for all eight content types |
| 06 | [AI Provider Integration](06-ai-provider-integration.md) | Provider adapters, routing, fallback, env vars |
| 07 | [Discovery Platform](07-discovery-platform.md) | Source adapters, licensing, enrichment workflow |
| 08 | [Content Generation Workflow](08-content-generation-workflow.md) | Generation → validation → review → publish |
| 09 | [Module API Contracts](09-module-api-contracts.md) | Shared content/discovery API contracts |
| 10 | [Scheduling & Job Management](10-scheduling-and-job-management.md) | Schedules, coverage planner, retries, idempotency |
| 11 | [Storage, Cache & Retention](11-storage-cache-and-retention.md) | Persistence layers, offline fallback, retention rules |
| 12 | [Security & Privacy](12-security-and-privacy.md) | Secrets isolation, RLS, copyright, attribution |
| 13 | [Deployment & Operations](13-deployment-and-operations.md) | Env setup, migrations, CI batch runner, HTTP API server |
| 14 | [Testing & Acceptance](14-testing-and-acceptance.md) | Verification suites and acceptance criteria |
| 15 | [Architecture Decisions](15-architecture-decisions.md) | ADRs |
