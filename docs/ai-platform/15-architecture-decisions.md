# 15 — Architecture Decisions (ADRs)

> Decisions are dated and record rejected alternatives.

## ADR-001 — Single content catalogue
**Status:** Accepted.
Extend `content_items`/`content_versions` for all eight content types rather than creating per-type tables. Rejected per-type stores to avoid duplicate catalogues and divergent versioning.

## ADR-002 — Provider abstraction in Python
**Status:** Accepted.
`AIProvider` ABC + router in `engine/ai/provider.py`. Rejected frontend SDK calls because secrets must remain server-side and all learners must share one contract.

## ADR-003 — Deterministic fallback is mandatory
**Status:** Accepted.
Every provider path falls back to the deterministic engine; content is never auto-published when AI is unavailable or fails validation. Rejected "AI-only" to preserve offline usability.

## ADR-004 — DB-backed queue; GitHub Actions as trigger only
**Status:** Accepted.
Database is the source of truth for schedules/jobs. Rejected Redis/Kafka (no measured workload justifies new infra) and rejected CRON-only (not admin-configurable/auditable).

## ADR-005 — Discovery reuses `engine.sources` adapters
**Status:** Accepted.
Rejected a parallel source layer to reuse existing rate-limit/retry/cache/provenance machinery.

## ADR-006 — Facts vs. explanation separation
**Status:** Accepted.
`DiscoveryResource` keeps `facts` (provenance) separate from `explanation` (generated). Rejected merging them, which would risk presenting AI text as verified source content.

## ADR-007 — UUIDs everywhere
**Status:** Accepted.
`gen_random_uuid()`/`crypto.randomUUID()` for all new rows; backfill existing string IDs. Rejected string prefixes in UUID columns.

## ADR-008 — A1–C2 content range
**Status:** Accepted (Phase 2 follow-up).
The existing `CEFRLevel` enum ends at C1; the centralized engine targets A1–C2. The enum must be extended, and DB CHECK constraints already include C2.

## ADR-009 — No Redis initially; no new infra
**Status:** Accepted.
Caching uses existing IndexedDB/localStorage + in-memory/server cache. Rejected Redis until measured need.

## ADR-010 — Configurable generation, no indiscriminate combinations
**Status:** Accepted.
A coverage planner computes only missing, budgeted combinations. Rejected "generate everything every day".

## ADR-011 — Gemini dormant by default
**Status:** Accepted (pending review).
Existing `GeminiLessonGenerator` is not wired to production. Activation is optional with deterministic fallback.
