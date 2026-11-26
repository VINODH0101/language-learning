# Lexilume Phase 8 — Baseline & Repository Inspection Report

> **Repository:** `VINODH0101/language-learning`  
> **Production URL:** https://lexi.monster  
> **Baseline Branch:** `phase-7-core-implementation`  
> **Baseline Commit SHA:** `d950f13eea816af8848c6c6f1f2a85dd9a310e10`  
> **Active Implementation Branch:** `phase-8-reliability-quality`  
> **Date of Baseline Inspection:** 2026-11-02  
> **Objective:** Establish the verified baseline before implementing Phase 8 reliability, security, performance, and quality hardening.

---

## 1. Branch & Commit Baseline

- **Verified Starting Commit:** `d950f13eea816af8848c6c6f1f2a85dd9a310e10` (`feat(learn): implement learner experience, contextual lookup, persistence sync, and e2e verification (Milestones 7.5-7.9)`).
- **Working Tree State:** Completely clean prior to Phase 8 activities.
- **Git Branch Created:** `phase-8-reliability-quality`.

---

## 2. Baseline Verification Commands & Results

All three verification commands were executed directly via CLI from the working tree:

### 2.1 Frontend Unit & Integration Tests (Vitest)
```bash
npm --prefix frontend test
```
- **Exit Code:** `0`
- **Duration:** 22.44s
- **Test Files:** 41 passed / 41 total (100%)
- **Tests:** 324 passed / 324 total (100%)
- **Failures:** 0
- **Notable Observations:** Multiple React state updates inside tests without `act(...)` in legacy dashboard/practice tests; network offline warnings appropriately logged for resilient fallback providers (MyMemory, Open-Meteo, Frankfurter, Nager Date).

### 2.2 Frontend TypeScript & Vite Production Build
```bash
npm --prefix frontend run build
```
- **Exit Code:** `0`
- **Duration:** 6.59s
- **Modules Transformed:** 2,788
- **Bundle Metrics:**
  - `dist/index.html`: 1.18 kB (gzip: 0.59 kB)
  - `dist/assets/index-DDWqzy9X.css`: 106.83 kB (gzip: 14.90 kB)
  - `dist/assets/src-DaLNk5rh.js`: 17.24 kB (gzip: 7.29 kB)
  - `dist/assets/purify.es-Dqk5qvad.js`: 29.02 kB (gzip: 11.45 kB)
  - `dist/assets/leaflet-src-CBAn8bwY.js`: 148.60 kB (gzip: 43.32 kB)
  - `dist/assets/index.es-jMu_oDWe.js`: 151.37 kB (gzip: 48.88 kB)
  - `dist/assets/html2canvas-BFB5ezxW.js`: 199.39 kB (gzip: 46.73 kB)
  - `dist/assets/index-B1dT7QzP.js`: **2,729.01 kB** (gzip: **740.30 kB**)
- **Known Warning:** Single monolithic chunk exceeding 500 kB (`index-B1dT7QzP.js` is 2.73 MB). All routes (Admin Studio, Reader, Practice, Analytics, OCR, PDF generation) are bundled synchronously into the initial client bundle.

### 2.3 Python Engine Tests (Pytest)
```bash
python -m pytest tests/ -v
```
- **Exit Code:** `0`
- **Duration:** 4.42s
- **Tests Collected:** 111 items
- **Passed:** 110 tests
- **Skipped:** 1 test (`tests/test_rate_limiter.py::test_rate_limiter_blocks_excess_requests_integration` — intentional live network bypass)
- **Failures:** 0

---

## 3. Scope of Phase 7 Artifacts Inspected

The following newly introduced files and subsystems from Phase 7 form the primary subject of Phase 8 hardening:

1. **Database & Migrations:**
   - `supabase/migrations/015_content_centred_architecture.sql` (10 tables, 3 compatibility views with `WITH (security_invoker = true)`, indexes, constraints, and RLS policies).
   - `supabase/migrations/rollback/015_rollback.sql`.
2. **Domain Models & Local Database:**
   - `frontend/src/types/contentCentred.ts`
   - `engine/models/content_centred.py`
   - `frontend/src/services/localDb.ts` (Dexie Version 5 stores: `cachedContentItems`, `learnerContentProgress`, `userSavedWords`, `userMistakes`, `contentProcessingJobs`).
3. **Services & Pipelines:**
   - `frontend/src/services/contentPipelineService.ts` (8-stage deterministic pedagogical pipeline).
   - `frontend/src/services/contentCentredService.ts` (Cache-aside catalog, SM-2 spaced repetition scheduler, mistake notebook).
   - `frontend/src/services/syncEngine.ts` (Offline mutation queue, exponential backoff, `client_mutation_id`).
   - `frontend/src/services/auth.ts` (`migrateGuestContentData`, tenant isolation).
   - `engine/content_pipeline/pipeline.py` (Python 8-stage pipeline).
4. **User Interfaces:**
   - `frontend/src/features/admin/content-studio/` (`ContentImportForm`, `PipelineJobMonitor`, `ContentReviewEditor`, `AdminContentStudio`).
   - `frontend/src/features/learn/` (`LearnCatalog`, `ReaderView`, `ContextualLookupModal`, `ContentActivities`).
   - `frontend/src/pages/` (`LearnPage.tsx`, `MyWordsPage.tsx`, `MyMistakesPage.tsx`).

---

## 4. Key Areas Requiring Hardening in Phase 8

Based on static inspection and baseline runs, the following areas require targeted verification and remediation:
1. **Migration & Constraint Repeatability:** Verify that `015_content_centred_architecture.sql` is strictly idempotent when run repeatedly or rollbacks are tested, checking policy recreation, trigger idempotent definitions, and check constraint syntax.
2. **PostgreSQL RLS Privilege Separation:** Test database role-based access control against simulated unauthenticated/authenticated/admin roles to ensure cross-tenant queries are blocked at the engine layer.
3. **Queue Idempotency & Backoff Timing:** Verify that `syncEngine.ts` retry scheduling uses `last_attempted_at` rather than creation time to avoid premature re-execution, and implements maximum retry caps and permanent failure logging.
4. **Content Pipeline Durability:** Ensure that in-flight jobs handle interruptions, and rights declarations enforce non-public domain blocking by default.
5. **Bundle Size & Route Splitting:** Split the monolithic 2.73 MB bundle so that `AdminContentStudio`, heavy charting, and optional PDF/OCR tools are dynamically imported only when navigated to.
6. **Accessibility & Keyboard Usability:** Ensure reader token clicks, lookup popovers, and comprehension activities have robust ARIA attributes and full keyboard accessibility.
