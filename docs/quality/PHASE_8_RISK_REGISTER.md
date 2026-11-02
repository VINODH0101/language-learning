# Lexilume Phase 8 — Risk Register & Defect Inventory

> **Repository:** `VINODH0101/language-learning`  
> **Baseline Commit:** `d950f13eea816af8848c6c6f1f2a85dd9a310e10`  
> **Branch:** `phase-8-reliability-quality`  
> **Classification Framework:** Critical Security, Critical Data-Integrity, High Reliability, Performance, Accessibility, Maintainability.

---

## 1. Risk Register Summary Table

| ID | Severity | Category | Affected Component | Summary | Target Milestone | Status |
| :--- | :---: | :---: | :--- | :--- | :---: | :---: |
| **RISK-801** | Critical | Database Integrity | `supabase/migrations/015_...sql` | Non-idempotent RLS `CREATE POLICY` causes rerun errors | 8.1 | Verified Defect |
| **RISK-802** | Critical | Security / Auth | `ContentCentredService.ts` | Missing programmatic role check on admin publish methods | 8.2 | Verified Defect |
| **RISK-803** | High | Reliability / Sync | `syncEngine.ts` | Exponential backoff uses `created_at` instead of attempt timestamp; no max retry dead-letter | 8.3 | Verified Defect |
| **RISK-804** | High | Data Integrity | `ContentCentredService.ts` | Immutability check allows payload modification if `is_published` remains true | 8.1 / 8.4 | Verified Defect |
| **RISK-805** | Medium | Content Safety | `contentPipelineService.ts` | Pipeline accepts restricted rights content without blocking warnings | 8.4 | Verified Defect |
| **RISK-806** | High | Performance | `App.tsx` & Vite config | Monolithic 2.73 MB root bundle due to eager imports of admin and heavy tools | 8.5 | Verified Defect |
| **RISK-807** | Medium | Accessibility | `ReaderView.tsx`, `ContextualLookupModal` | Word tokens lack keyboard activation; modal lacks ARIA dialog role and Escape handler | 8.6 | Verified Defect |
| **RISK-808** | Medium | Error Handling | `LearnPage.tsx`, `ReaderView.tsx` | Missing error boundaries around reading and activity components | 8.7 | Verified Defect |
| **RISK-809** | High | Data Integrity | `contentCentredService.ts` / `syncEngine.ts` | Out-of-order offline SRS updates can overwrite newer review timestamps | 8.3 | Verified Risk |

---

## 2. Detailed Defect & Risk Descriptions

### RISK-801: Non-Idempotent RLS Policies in Migration 015
- **Severity:** Critical (Database Integrity / CI Reliability)
- **Affected File:** `supabase/migrations/015_content_centred_architecture.sql`
- **Reproduction:** Run migration 015 twice against PostgreSQL. The second execution fails with `ERROR: policy "Public read access on content_sources" already exists for table "content_sources"`.
- **Root Cause:** PostgreSQL `CREATE POLICY` does not support `IF NOT EXISTS`. Unlike tables and triggers, policies require explicit `DROP POLICY IF EXISTS "..." ON ...;` prior to creation.
- **User Impact:** Rollbacks, retries, and continuous integration pipeline reruns fail prematurely, risking inconsistent schema states.
- **Correction:** Prepend `DROP POLICY IF EXISTS "..." ON ...;` before all 16 policy definitions in `015_content_centred_architecture.sql`.
- **Test Needed:** Python/Postgres idempotency test verifying double execution of migration 015 exits with code 0.
- **Resolution Status:** Scheduled for Milestone 8.1.

---

### RISK-802: Missing Role Enforcement Guard on Content Publishing
- **Severity:** Critical (Security & Authorization)
- **Affected File:** `frontend/src/services/contentCentredService.ts`
- **Reproduction:** Call `contentCentredService.publishContentVersion(itemId, versionId)` from guest or learner session context. In offline or mock mode, the version is published without role verification.
- **Root Cause:** `publishContentVersion` only validates existence of item and version, assuming UI hiding in `AdminContentStudio` is sufficient.
- **User Impact:** A non-admin user or compromised client session could publish unreviewed drafts or alter catalog publication states.
- **Correction:** Inject active auth role check: verify `authService.getState().role === 'admin'` before allowing item creation, version updates, or publication.
- **Test Needed:** Unit test attempting `publishContentVersion` from a learner or guest session asserting rejection.
- **Resolution Status:** Scheduled for Milestone 8.2.

---

### RISK-803: Flawed Sync Queue Backoff Calculation and Indefinite Retries
- **Severity:** High (Offline Sync & Reliability)
- **Affected File:** `frontend/src/services/syncEngine.ts`
- **Reproduction:** Enqueue a failing mutation (e.g. invalid UUID). Trigger `syncNow()` multiple times. Observe that after 30 seconds from creation, backoff delay drops to 0 and the item retries on every single sync tick indefinitely.
- **Root Cause:** Line 155 computes `itemAgeMs = Date.now() - new Date(item.created_at).getTime()`. It compares the total item age against the backoff window rather than measuring time elapsed since the *last attempted sync*. Furthermore, no maximum retry limit is enforced.
- **User Impact:** Excessive network calls, battery drain, and unrecoverable queue blockage for learners with corrupted or rejected mutations.
- **Correction:** Record `last_attempted_at` timestamp on `SyncQueueRecord`; calculate backoff delay since `last_attempted_at`; enforce `MAX_RETRIES = 5`, transitioning permanently failing items to `'failed'` dead-letter status.
- **Test Needed:** Unit test simulating repeated failures verifying exponential backoff timing and transition to dead-letter after 5 attempts.
- **Resolution Status:** Scheduled for Milestone 8.3.

---

### RISK-804: Silent Mutation of Published Content Versions
- **Severity:** High (Data Integrity & Immutability)
- **Affected File:** `frontend/src/services/contentCentredService.ts`
- **Reproduction:** Call `saveContentVersion` with an existing published version ID and altered paragraphs while setting `is_published: true`. The version payload is overwritten in memory and Dexie.
- **Root Cause:** The check only verified `if (existing.is_published && !version.is_published)`, mistakenly assuming edits only occurred when unpublishing.
- **User Impact:** Existing learner attempt history, comprehension scores, and mistake bookmarks become detached or inconsistent with the modified text.
- **Correction:** Disallow any update to `structured_payload` when `existing.is_published` is true. Require creating a new edition with incremented `version_number`.
- **Test Needed:** Unit test verifying that updating a published version's payload throws an immutability exception.
- **Resolution Status:** Scheduled for Milestone 8.1.

---

### RISK-805: Unrestricted Content Pipeline Intake
- **Severity:** Medium (Content Rights Safety)
- **Affected File:** `frontend/src/services/contentPipelineService.ts`, `engine/content_pipeline/pipeline.py`
- **Reproduction:** Submit text with `rights_status: 'restricted'` to `executePipeline`. The pipeline processes and generates draft versions without warnings or validation barriers.
- **Root Cause:** Stage 0 validation checked word count and title presence, but did not assert rights compliance.
- **User Impact:** Inadvertent processing and publication of copyrighted third-party material.
- **Correction:** Enforce rights validation: require explicit rights status; reject `'restricted'` or `'unknown'` rights unless accompanied by educational fair-use declaration.
- **Test Needed:** Unit test verifying pipeline rejection of restricted material without fair-use declaration.
- **Resolution Status:** Scheduled for Milestone 8.4.

---

### RISK-806: Monolithic 2.73 MB Client Bundle
- **Severity:** High (Performance & Bundle Size)
- **Affected File:** `frontend/src/App.tsx`, `frontend/vite.config.ts`
- **Reproduction:** Run `npm --prefix frontend run build`. Observe output: `dist/assets/index-B1dT7QzP.js 2,729.01 kB (gzip: 740.30 kB)`.
- **Root Cause:** All routes and heavyweight dependencies (`jspdf`, `leaflet`, `tesseract.js`, `minisearch`, Admin Studio) are bundled into the primary entry point chunk.
- **User Impact:** Long initial load times (LCP > 3.5s on mobile 4G), high memory consumption on entry.
- **Correction:** Implement route-level code splitting using `React.lazy()` and `Suspense`; configure manual chunking in `vite.config.ts` for large third-party libraries.
- **Test Needed:** Production build size check verifying primary entry chunk is reduced below 500 kB.
- **Resolution Status:** Scheduled for Milestone 8.5.

---

### RISK-807: Keyboard and Screen-Reader Inaccessibility in Reader & Lookups
- **Severity:** Medium (Accessibility & UX)
- **Affected File:** `frontend/src/features/learn/ReaderView.tsx`, `frontend/src/features/learn/ContextualLookupModal.tsx`
- **Reproduction:** Navigate ReaderView using only the Tab key. Word tokens cannot be focused or activated via Space/Enter. Open the lookup modal: pressing Escape does not dismiss the modal, and focus is not trapped.
- **Root Cause:** Word tokens are plain `<span>` tags without `tabIndex`, `role="button"`, or keyboard listeners; lookup modal lacks `role="dialog"`, `aria-modal="true"`, and keydown handlers.
- **User Impact:** Learners with motor or visual disabilities cannot use the core reading and contextual lookup experience.
- **Correction:** Add `tabIndex={0}`, `role="button"`, and `onKeyDown` handlers to tokens; add dialog ARIA attributes and Escape key dismissal to the modal.
- **Test Needed:** Automated accessibility test verifying keyboard focus and activation on tokens and modal Escape dismissal.
- **Resolution Status:** Scheduled for Milestone 8.6.

---

### RISK-808: Unhandled Rendering Errors in Reader and Activities
- **Severity:** Medium (Error Handling & Observability)
- **Affected File:** `frontend/src/pages/LearnPage.tsx`, `frontend/src/features/learn/ReaderView.tsx`
- **Reproduction:** Pass a content version with malformed JSON payload (e.g. missing `tokens` array). The React component tree throws an unhandled TypeError, causing a blank white screen.
- **Root Cause:** Absence of React Error Boundaries around `ReaderView`, `ContentActivities`, and `AdminContentStudio`.
- **User Impact:** Whole-application crash with no recovery path for the user.
- **Correction:** Implement feature-level `ErrorBoundary` with informative fallback UI, error reporting, and a "Return to Catalog" recovery action.
- **Test Needed:** Unit test with deliberately malformed payload verifying error boundary fallback renders cleanly without crashing the page.
- **Resolution Status:** Scheduled for Milestone 8.7.

---

### RISK-809: Out-of-Order Offline SRS Schedule Clashing
- **Severity:** High (Data Integrity & Spaced Repetition)
- **Affected File:** `frontend/src/services/contentCentredService.ts`, `frontend/src/services/syncEngine.ts`
- **Reproduction:** Review word on Device A at 10:00 AM (offline). Review same word on Device B at 11:00 AM (online). Device A reconnects later and uploads its stale state snapshot.
- **Root Cause:** Synchronizing `user_saved_words` by full record replacement can overwrite newer `ease_factor`, `interval_days`, and `next_review` with an older snapshot.
- **User Impact:** Learner loses memory retention progress; card is improperly scheduled.
- **Correction:** Add conditional update guard on `SYNC_USER_SAVED_WORD` in `syncEngine.ts`: only update scheduling fields if `payload.last_reviewed_at >= existing.last_reviewed_at`.
- **Test Needed:** Concurrent review sync test simulating out-of-order review uploads.
- **Resolution Status:** Scheduled for Milestone 8.3.
