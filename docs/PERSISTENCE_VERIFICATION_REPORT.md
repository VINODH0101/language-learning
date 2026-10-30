# Lexilume — Database Persistence & Synchronization Verification Report

> **Project:** Lexilume (Illuminate Your Words)  
> **Repository:** `VINODH0101/language-learning`  
> **Status:** Step 3 Completed & Formally Verified  
> **Date:** October 30, 2026  
> **Test Suite Status:** 100% Green (Vitest 148/148, Pytest 100/100, Vite Build Clean)

---

## 1. Executive Summary

During Step 3, a deep architectural and schema audit was performed to resolve root causes that prevented data insertion into Supabase PostgreSQL and caused silent degradations in local persistence.

All identified root causes have been resolved through:
1. Database Migration `010_database_persistence_and_sync_repair.sql` (and safe rollback migration).
2. Elimination of foreign key vs. RLS policy contradictions between `auth.users(id)` and `public.user_profiles(id)`.
3. Standardized UUID v4 generation across all course mutations, resolving PostgreSQL 22P02 type mismatch errors.
4. Correct client-side identifier resolution ensuring `auth.uid()` (`profile.auth_user_id`) is used for all RLS-enforced queries and storage partitioning.
5. End-to-end integration of the local-first `syncEngine`, wiring UI mutations (`courses`, `bookmarks`, `vocabulary`, `srs`) into an idempotent retry queue with exponential backoff and strict multi-tenant isolation.
6. Elimination of silent error swallowing that formerly masked production database failures by dumping users into in-memory mock states.

---

## 2. Root Cause Discovery & Architectural Fixes

### 2.1 Missing `INSERT` Policy on `public.user_profiles`
- **Symptom:** Client registration calls to Supabase failed silently or threw `new row violates row-level security policy for table "user_profiles"`.
- **Cause:** Migration `002_rls_policies.sql` configured `SELECT` and `UPDATE` policies for authenticated users on `user_profiles`, but never created an `INSERT` policy.
- **Fix in Migration 010:**
  ```sql
  CREATE POLICY "Users can create their own profile"
    ON public.user_profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = auth_user_id);
  ```
  Additionally, added a `SECURITY DEFINER` trigger `handle_new_user()` on `auth.users` to automatically initialize user profiles and assign the default `'user'` role upon signup.

### 2.2 Foreign Key vs. RLS Policy Contradiction in Bookmarks & Saved Vocabulary
- **Symptom:** Inserts into `cultural_bookmarks` and `saved_translations` failed with either foreign key constraint violations or RLS policy rejections.
- **Cause:** Migrations `008_cultural_bookmarks_and_sync.sql` and `005_language_directions_and_saved_translations.sql` defined:
  ```sql
  user_id UUID NOT NULL REFERENCES public.user_profiles(id)
  ```
  However, their RLS policies enforced:
  ```sql
  WITH CHECK (auth.uid() = user_id)
  ```
  Because `public.user_profiles.id` is a synthetic random UUID (`gen_random_uuid()`) separate from `auth.users.id`, inserting `auth.uid()` caused a foreign key violation, while inserting `user_profiles.id` caused an RLS policy rejection.
- **Fix in Migration 010:** Reconciled foreign keys to reference `auth.users(id) ON DELETE CASCADE`, aligning the database constraint with PostgreSQL RLS `auth.uid()`.

### 2.3 UUID Column Type Mismatch on `user_courses.id`
- **Symptom:** Course insertions rejected with PostgreSQL error `22P02: invalid input syntax for type uuid: "course_usr_..."`.
- **Cause:** `courseService.createCourse` generated string IDs such as `course_${uid}_${target_language}_${Date.now()}` and passed them directly to `user_courses.id`, which is a PostgreSQL `UUID PRIMARY KEY`.
- **Fix:** Implemented `generateUUID()` in `frontend/src/services/courseService.ts` utilizing `crypto.randomUUID()` (with RFC 4122 v4 fallback) for all created, migrated, and default courses.

### 2.4 Client Identifier Mismatch in Authentication & Storage Scoping
- **Symptom:** UI services passed `profile.id` (synthetic profile UUID) instead of `profile.auth_user_id` (`auth.uid()`) to `courseService.setUserId` and `StorageService.setCurrentUser`.
- **Fix:** Standardized on `const effectiveId = profile.auth_user_id || profile.id;` across `authService.signUp`, `signIn`, session refresh, and token listeners.

### 2.5 Silent Error Swallowing Replaced with Explicit State Handling
- **Symptom:** In production mode, failed Supabase signups or logins were caught and silently redirected into `mockUsersDb`, confusing users and causing all subsequent progress to remain trapped in volatile mock state.
- **Fix:** In `authService.signUp` and `signIn`, when `isSupabaseConfigured` is `true`, failures return explicit, actionable error messages directly to the UI without falling back to mock storage.

### 2.6 Circular Module Initialization Deadlock
- **Symptom:** Unhandled rejections during test execution: `TypeError: Cannot read properties of undefined (reading 'setUserId')` originating from `auth.ts` -> `courseService.ts` -> `syncEngine.ts` -> `auth.ts`.
- **Fix:** Deferred `authService.initAuth()` inside `AuthService` constructor via `setTimeout(..., 0)` and added defensive guards `if (courseService?.setUserId)`. This allows ES module dependency cycles to resolve completely before initial auth state resolution runs.

---

## 3. Three-Tier Persistence Architecture

```mermaid
flowchart TD
    UI[User Interface / React Components] --> Svc[Domain Services: courseService, cultureService, localDb, storage]
    
    subgraph Tier 1: Authoritative Cloud Storage
        Svc -->|Online Auth Mutations| Supa[(Supabase PostgreSQL + RLS)]
    end
    
    subgraph Tier 2: Offline-First Local Database
        Svc -->|Local Learning & Queue| Dexie[(Dexie / IndexedDB: PolyglotLocalDatabase)]
        Dexie -->|Pending Action Queue| Sync[SyncEngine / Exponential Backoff]
        Sync -->|Replay On Reconnection| Supa
    end
    
    subgraph Tier 3: Scoped Partitioned Preferences
        Svc -->|User-Scoped Cache| LS[localStorage: Scoped by auth_user_id]
    end
```

### 3.1 Tier 1: Supabase PostgreSQL (Cloud Authority)
- Authoritative datastore for authenticated users.
- Tables enforced:
  - `public.user_profiles` (`auth_user_id` mapped to `auth.users(id)`)
  - `public.user_roles` (admin / user RBAC)
  - `public.user_courses` (Multi-course configuration, UUID PK, foreign key to `auth.users(id)`)
  - `public.user_learning_tracks` (Curriculum nodes completed, CEFR levels)
  - `public.saved_translations` (Offline/online phrasebook entries)
  - `public.cultural_bookmarks` (Offline/online cultural articles)
  - `public.srs_items` (Spaced Repetition SM-2 reviews)
  - `public.admin_audit_logs` (Admin security audit logging)

### 3.2 Tier 2: Dexie / IndexedDB (`PolyglotLocalDatabase`)
- Primary offline database supporting instant offline reads and writes.
- Tables:
  - `cachedLessons`: Pre-fetched daily lesson payloads with TTL.
  - `activeLessonProgress`: Active in-progress lesson state.
  - `savedVocabulary`: Up to 500 saved words with LRU pruning.
  - `culturalBookmarks`: Saved cultural articles for offline reading.
  - `mistakeNotebook`: Categorized user errors for consolidation.
  - `syncQueue`: Offline mutation log (`user_id`, `action`, `payload`, `status`, `retry_count`, `created_at`).
  - `apiCache`: External API response caching with strict TTL.

### 3.3 Tier 3: Scoped Preferences (`StorageService`)
- Manages lightweight settings, track summaries, and session caches in `localStorage`.
- Storage keys are strictly partitioned with suffix `_${user_id}` (e.g. `polyglot_courses_auth_12345`).
- Cross-user data leakage is prevented on shared devices.

---

## 4. Synchronization Lifecycle & Tenant Isolation

```mermaid
stateDiagram-v2
    [*] --> Pending: Enqueued via queueAction()
    Pending --> Syncing: Online Reconnection / syncNow()
    Syncing --> Synced: HTTP 200 / Upsert Success
    Synced --> [*]: Removed from syncQueue
    Syncing --> Failed: Network Timeout / Server Error
    Failed --> Pending: Exponential Backoff (1s -> 2s -> 4s -> max 30s)
    Pending --> [*]: Purged on User Account Deletion
```

### 4.1 Strict Multi-Tenant Isolation Guard
The sync engine enforces that queued mutations belonging to User A are never processed or uploaded into an active session belonging to User B:
```typescript
if (item.user_id && item.user_id !== 'guest' && item.user_id !== effectiveUserId) {
  continue; // Skip foreign tenant mutations
}
```

---

## 5. End-to-End Persistence Verification Results

A dedicated end-to-end persistence suite (`frontend/src/tests/persistenceE2E.test.ts`) was executed via Vitest, verifying all 12 core scenarios:

| # | Test Scenario | Verified Behavior | Status |
| :- | :--- | :--- | :---: |
| 1 | **New User Registration** | Creates `auth_user_id`, default preferences, role `'user'`, and account status `'active'` | **PASSED** |
| 2 | **Login with Credentials** | Establishes authenticated session and binds effective user ID to all services | **PASSED** |
| 3 | **Profile Preferences** | Updates theme, daily goal minutes, and explanation language; state propagates immediately | **PASSED** |
| 4 | **Course Creation** | Generates standard RFC 4122 UUID v4 and enqueues `SYNC_COURSE` with isolated `user_id` | **PASSED** |
| 5 | **Lesson Progress** | Persists active progress in Dexie `activeLessonProgress` and marks track node completion | **PASSED** |
| 6 | **Vocabulary Persistence** | Writes phrasebook entry to `savedVocabulary` and queues `SYNC_SAVED_VOCABULARY` | **PASSED** |
| 7 | **SRS SM-2 Scheduling** | Computes ease-factor and interval progression; enqueues `SYNC_SRS_REVIEW` | **PASSED** |
| 8 | **Browser Refresh Recovery** | Re-instantiating services restores active course, tracks, and learning progress | **PASSED** |
| 9 | **Multi-User Partitioning** | Signing in as User A, signing out, and signing in as User B guarantees User B never sees User A's custom courses | **PASSED** |
| 10 | **Offline Mutation Handling** | Offline operations record cleanly in `syncQueue` as `'pending'` with zero unhandled exceptions | **PASSED** |
| 11 | **Cross-Tenant Guard** | Sync engine strictly skips actions queued under a different user's identifier | **PASSED** |
| 12 | **Admin Protection & Audit** | Non-admins cannot alter roles or statuses; admin user can disable accounts and log audit entries | **PASSED** |

---

## 6. Verification Commands & Execution Matrix

### 6.1 Frontend Vitest Suite
```bash
npm --prefix frontend test -- --run
```
- **Result:**
  ```
  Test Files  20 passed (20)
       Tests  148 passed (148)
    Duration  34.53s
  Exit Code: 0
  ```

### 6.2 Frontend Production Build
```bash
npm --prefix frontend run build
```
- **Result:**
  ```
  vite v8.3.5 building client environment for production...
  ✓ 2373 modules transformed.
  ✓ built in 8.07s
  Exit Code: 0
  ```

### 6.3 Python Engine Test Suite
```bash
python -m pytest tests/ -v
```
- **Result:**
  ```
  ======================= 100 passed, 1 skipped in 7.24s ========================
  Exit Code: 0
  ```

---

## 7. Migration Verification & Safety

| Migration | Purpose | Rollback File | Pytest Verified |
| :--- | :--- | :--- | :---: |
| `010_database_persistence_and_sync_repair.sql` | Profile insert RLS, handle_new_user trigger, foreign key reconciliation, bi-directional track trigger | `010_database_persistence_and_sync_repair_rollback.sql` | `tests/test_migration_010.py` (PASSED) |

The migration is non-destructive, idempotently adds missing triggers and RLS policies, alters foreign keys using `ON DELETE CASCADE`, and does not alter or truncate existing production data.
