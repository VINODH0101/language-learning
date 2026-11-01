# Lexilume — Comprehensive Security, Database Persistence & Synchronization Audit

> **Target Version:** Lexilume 2.0.0  
> **Repository:** `VINODH0101/language-learning`  
> **Audit Date:** October 30, 2026  
> **Status:** Initial Pre-Modification Audit Completed

---

## 1. Executive Summary

A comprehensive security, persistence, and synchronization audit of the Lexilume codebase was performed across frontend services, Dexie/IndexedDB schemas, Supabase client configurations, SQL migrations (`001` through `010`), Python PostgREST repositories, and bot protection integrations.

### Key Audit Metrics
- **Critical Findings:** 3
- **High Findings:** 5
- **Medium Findings:** 4
- **Low Findings:** 1
- **Informational Findings:** 1

No code modifications were made prior to the completion and documentation of this audit.

---

## 2. Classification of Findings

| ID | Title | Severity | Relevant File | Domain |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | Bot Challenge Bypass via Blocked Turnstile Script | **CRITICAL** | `frontend/src/components/common/TurnstileWidget.tsx` | Bot Defense |
| **SEC-02** | Missing Server-Side Verification for Bot Challenges | **CRITICAL** | `frontend/src/components/auth/AuthModal.tsx` | Authentication |
| **SEC-03** | Hardcoded Plaintext Admin Credentials in Frontend Bundle | **CRITICAL** | `frontend/src/services/auth.ts` | Authentication / RBAC |
| **AUTH-01**| Client-Side Role Spoofing in LocalStorage | **HIGH** | `frontend/src/services/auth.ts` | Authorization |
| **PERS-01**| Lesson Completion Progress Is Never Synchronized to Cloud | **HIGH** | `frontend/src/features/course/useCourse.ts` | Cloud Persistence |
| **PERS-02**| Exercise Attempts Silently Dropped by SyncEngine | **HIGH** | `frontend/src/services/syncEngine.ts` | Data Persistence |
| **SYNC-01**| Failed Offline Queue Items Never Retried (Dead-End Queue) | **HIGH** | `frontend/src/services/localDb.ts` | Offline Sync |
| **SYNC-02**| Non-Idempotent Vocabulary Insertion in SyncEngine | **HIGH** | `frontend/src/services/syncEngine.ts` | Sync Reliability |
| **SYNC-03**| Offline Profile Updates Not Enqueued for Synchronization | **MEDIUM** | `frontend/src/services/auth.ts` | Profile Persistence |
| **SYNC-04**| Vocabulary Deletion Lacks Target Language Scoping | **MEDIUM** | `frontend/src/services/syncEngine.ts` | Data Isolation |
| **SCH-01** | Python Supabase Repository Schema Mismatches on Daily Lessons | **MEDIUM** | `engine/storage/supabase_repository.py` | Schema Integrity |
| **UI-01**   | Missing Live User Interface Synchronization Status | **MEDIUM** | `frontend/src/components/common/Navigation.tsx` | Transparency / UX |
| **AUTH-02**| Client-Side Unauthorized Insert on `user_roles` Table | **LOW** | `frontend/src/services/auth.ts` | RLS Compliance |
| **INFO-01**| Fallback Supabase Client Uses Placeholder Credentials | **INFORMATIONAL** | `frontend/src/services/supabaseClient.ts` | Configuration |

---

## 3. In-Depth Vulnerability Analysis & Recommended Repairs

---

### SEC-01: Bot Challenge Bypass via Blocked Turnstile Script
- **Severity:** **CRITICAL**
- **Relevant File:** `frontend/src/components/common/TurnstileWidget.tsx` (Lines 86–90)
- **Evidence:**
  ```tsx
  script.onerror = () => {
    // Graceful fallback to test mode if network fails or adblocker blocks Turnstile
    setIsTestMode(true);
    onVerify('TEST_PASS_TOKEN');
  };
  ```
- **Impact:** Any automated bot, scraper, or attacker that deliberately blocks requests to `challenges.cloudflare.com` causes `script.onerror` to fire. The widget immediately triggers `onVerify('TEST_PASS_TOKEN')`, automatically bypassing bot protection without human verification.
- **Recommended Fix:** 
  1. Eliminate the automatic `onVerify('TEST_PASS_TOKEN')` invocation inside `script.onerror`.
  2. In production (`!import.meta.env.DEV`), fail closed: render an accessible error message with a manual "Retry Verification" button.
  3. Restrict mock/test tokens strictly to environments where `import.meta.env.DEV` or `MODE === 'test'` is true AND the site key is an official Cloudflare test site key.

---

### SEC-02: Missing Server-Side Verification for Bot Challenges
- **Severity:** **CRITICAL**
- **Relevant Files:** 
  - `frontend/src/components/auth/AuthModal.tsx` (Lines 74–84)
  - `frontend/src/services/auth.ts` (Lines 267–340)
- **Evidence:**
  In `AuthModal.tsx`:
  ```tsx
  if (!turnstileToken) {
    setErrorMsg(t('auth:error_bot_verification', 'Please complete the bot protection check'));
    return;
  }
  const res = await authService.signUp(email, password, fullName, { ... });
  ```
  The variable `turnstileToken` is checked solely in React local state. It is never transmitted to `authService.signUp()`, never forwarded to Supabase, and never validated against Cloudflare's `/siteverify` API endpoint.
- **Impact:** The client-side verification check is purely cosmetic. Attackers can call `supabase.auth.signUp()` or backend registration endpoints directly, completely bypassing bot defense.
- **Recommended Fix:**
  1. Pass the bot verification token into `authService.signUp()`.
  2. Implement an Edge Function or backend endpoint that validates the token with Cloudflare's `https://challenges.cloudflare.com/turnstile/v0/siteverify` using the server-side secret key before allowing account creation.
  3. Reject `'TEST_PASS_TOKEN'` in production.

---

### SEC-03: Hardcoded Plaintext Admin Credentials in Frontend Bundle
- **Severity:** **CRITICAL**
- **Relevant File:** `frontend/src/services/auth.ts` (Lines 20–85)
- **Evidence:**
  ```ts
  const mockUsersDb = new Map([
    ['admin@polyglot.dev', {
      user: { id: 'usr_admin_001', email: 'admin@polyglot.dev', role: 'admin', ... },
      passwordHash: 'AdminPass123!'
    }],
    ['learner@polyglot.dev', { ... }]
  ]);
  ```
- **Impact:** Hardcoded administrative credentials (`admin@polyglot.dev` / `AdminPass123!`) are compiled into client assets. If `isSupabaseConfigured` evaluates to false, any visitor typing these credentials receives administrative privileges.
- **Recommended Fix:**
  1. Remove hardcoded production mock credentials from client source code.
  2. Guard mock authentication entirely within `import.meta.env.DEV` or automated testing flags.
  3. Ensure that in production builds, authentication failures reject invalid credentials rather than dropping into mock databases.

---

### AUTH-01: Client-Side Role Spoofing in LocalStorage
- **Severity:** **HIGH**
- **Relevant File:** `frontend/src/services/auth.ts` (Lines 163–183)
- **Evidence:**
  ```ts
  const savedMock = localStorage.getItem(STORAGE_KEYS.MOCK_AUTH_USER);
  if (savedMock) {
    const parsed = JSON.parse(savedMock) as UserProfile;
    this.updateState({
      user: parsed,
      role: parsed.role,
      isGuest: false,
      isLoading: false,
    });
  }
  ```
- **Impact:** In mock/offline mode, any user can execute `localStorage.setItem('polyglot_mock_auth_user', JSON.stringify({ role: 'admin', ... }))` to grant themselves administrative UI access.
- **Recommended Fix:**
  1. Never trust user role fields stored in unverified localStorage objects.
  2. Enforce that administrative privileges (`role === 'admin'`) require live validation against `public.user_roles` via Supabase RLS and `public.is_admin()`.

---

### PERS-01: Lesson Completion Progress Is Never Synchronized to Cloud
- **Severity:** **HIGH**
- **Relevant Files:**
  - `frontend/src/features/course/useCourse.ts` (Lines 82–93)
  - `frontend/src/services/storage.ts` (Lines 146–159)
- **Evidence:**
  ```ts
  // useCourse.ts markComplete()
  const track = StorageService.getTrackState(language);
  track.completed_curriculum_node_ids.push(lesson.curriculum_node_id);
  track.total_lessons_completed += 1;
  track.streak_days += 1;
  StorageService.saveTrackState(track);
  ```
  `StorageService.saveTrackState()` writes only to `localStorage` (`polyglot_track_pt_<uid>`). It does not invoke `syncEngine.queueAction()` or communicate with `user_courses` or `user_learning_tracks`.
- **Impact:** When authenticated learners complete daily lessons, their curriculum progression, streak count, and completed node IDs exist only on that browser. Changing devices or logging in elsewhere shows 0 completed lessons.
- **Recommended Fix:**
  1. When a lesson is marked complete, invoke `courseService.updateCourse()` or queue a `SYNC_COURSE` / `SYNC_TRACK_STATE` mutation in `syncEngine`.
  2. Transmit `completed_curriculum_node_ids`, `streak_days`, and `total_lessons_completed` to `public.user_courses`. Migration 010's trigger `trg_sync_user_course_to_learning_track` will automatically synchronize it with `public.user_learning_tracks`.

---

### PERS-02: Exercise Attempts Silently Dropped by SyncEngine
- **Severity:** **HIGH**
- **Relevant Files:**
  - `frontend/src/services/storage.ts` (Lines 214–216)
  - `frontend/src/services/syncEngine.ts` (Lines 296–298)
- **Evidence:**
  `StorageService.saveExerciseAttempt()` queues `'SYNC_EXERCISE_ATTEMPT'`.
  In `syncEngine.ts`:
  ```ts
  // processSyncItem()
  if (item.action === 'SYNC_COURSE') { ... }
  // ...
  if (item.action === 'SYNC_SRS_REVIEW') { ... }

  // Unknown action: acknowledge and clear to avoid blocking queue
  return true;
  ```
- **Impact:** Exercise attempt records are received by `syncEngine`, match no case, and are immediately marked successful and deleted without writing to `public.exercise_attempts`.
- **Recommended Fix:**
  Implement the `'SYNC_EXERCISE_ATTEMPT'` handler in `processSyncItem` to upsert records into `public.exercise_attempts` matching schema columns (`id`, `user_id`, `exercise_id`, `submitted_answer`, `is_correct`, `feedback`, `attempt_count`, `created_at`).

---

### SYNC-01: Failed Offline Queue Items Never Retried (Dead-End Queue)
- **Severity:** **HIGH**
- **Relevant Files:**
  - `frontend/src/services/localDb.ts` (Lines 520–534, 548–567)
  - `frontend/src/services/syncEngine.ts` (Lines 148–154)
- **Evidence:**
  `markSyncActionFailed()` sets `item.status = 'failed'` and increments `retry_count`.
  `getPendingSyncActions()` executes:
  ```ts
  const all = await localDb.syncQueue.where('status').equals('pending').toArray();
  ```
- **Impact:** As soon as any sync item fails due to a network timeout, its status becomes `'failed'`. Subsequent sync runs query only `'pending'`, permanently stranding the item in IndexedDB. The exponential backoff code is never reached.
- **Recommended Fix:**
  Update `getPendingSyncActions` to retrieve actions where `status` is `'pending'` OR (`status === 'failed'` AND `retry_count < 5`).

---

### SYNC-02: Non-Idempotent Vocabulary Insertion in SyncEngine
- **Severity:** **HIGH**
- **Relevant File:** `frontend/src/services/syncEngine.ts` (Lines 251–264)
- **Evidence:**
  ```ts
  if (item.action === 'SYNC_SAVED_VOCABULARY') {
    const vocab = item.payload as any;
    const { error } = await supabase.from('saved_translations').insert({
      user_id: userId,
      source_text: vocab.source_text,
      translated_text: vocab.translated_text,
      // ...
    });
    return !error;
  }
  ```
- **Impact:** `.insert()` violates idempotency. If a retry occurs, or if the user saves a word that already exists, Supabase throws a unique constraint error (`uq_saved_translations_user_source_target`), failing the sync item.
- **Recommended Fix:**
  Change `.insert(...)` to `.upsert(payload, { onConflict: 'user_id, source_text, target_lang' })`.

---

### SYNC-03: Offline Profile Updates Not Enqueued for Synchronization
- **Severity:** **MEDIUM**
- **Relevant File:** `frontend/src/services/auth.ts` (Lines 509–536)
- **Evidence:**
  `updateProfile()` calls `supabase.from('user_profiles').update(...)`. If the user is offline, the exception is caught, logged to console, and no sync action is queued in Dexie.
- **Impact:** Preferences modified offline are lost from cloud sync.
- **Recommended Fix:**
  Enqueue a `'SYNC_USER_PROFILE'` action in `syncEngine` upon offline update.

---

### SYNC-04: Vocabulary Deletion Lacks Target Language Scoping
- **Severity:** **MEDIUM**
- **Relevant File:** `frontend/src/services/syncEngine.ts` (Lines 266–275)
- **Evidence:**
  ```ts
  if (item.action === 'DELETE_SAVED_VOCABULARY') {
    const vocab = item.payload as any;
    const { error } = await supabase
      .from('saved_translations')
      .delete()
      .eq('user_id', userId)
      .eq('source_text', vocab.source_text);
    return !error;
  }
  ```
- **Impact:** If a polyglot user saves the word "casa" in Italian and in Portuguese, deleting "casa" from the Italian notebook deletes all translations of "casa" across all languages.
- **Recommended Fix:**
  Add `.eq('target_lang', vocab.target_lang)` to the deletion query.

---

### SCH-01: Python Supabase Repository Schema Mismatches on Daily Lessons
- **Severity:** **MEDIUM**
- **Relevant File:** `engine/storage/supabase_repository.py` (Lines 254–266)
- **Evidence:**
  `save_daily_lesson()` builds payload with keys `"language"` and `"payload"`.
  However, `public.daily_lessons` in `supabase/migrations/001_initial_schema.sql` defines:
  - `language_track_id UUID REFERENCES public.language_tracks(id)`
  - `content_payload JSONB NOT NULL` (no column named `"payload"`)
- **Impact:** If the Python engine attempts to insert daily lessons via PostgREST against a live database with migration 001, PostgREST returns HTTP 400/404 column not found.
- **Recommended Fix:**
  Reconcile column names in `supabase_repository.py` to match `content_payload` or add migration 011 adding canonical columns `language` and `payload` with JSONB backward compatibility.

---

### UI-01: Missing Live User Interface Synchronization Status
- **Severity:** **MEDIUM**
- **Relevant Files:** `frontend/src/components/common/Navigation.tsx`, `frontend/src/features/dashboard/DashboardView.tsx`
- **Evidence:**
  `SyncEngine` manages state (`'synced' | 'syncing' | 'offline' | 'error'`), but no UI component renders it.
- **Impact:** The learner has zero visibility into pending mutations or offline state.
- **Recommended Fix:**
  Create an accessible `SyncStatusBadge` in the navigation header that truthfully displays:
  - "Local Only" (Guest)
  - "Syncing..." (with spinner)
  - "Waiting to Sync (X pending)" (Offline)
  - "Cloud Synced" (Confirmed by server)
  - "Sync Error" (with manual retry trigger)

---

### AUTH-02: Client-Side Unauthorized Insert on `user_roles` Table
- **Severity:** **LOW**
- **Relevant File:** `frontend/src/services/auth.ts` (Lines 314–321)
- **Evidence:**
  `authService.signUp` attempts to insert `{ user_id: data.user.id, role: 'user' }` into `public.user_roles`.
- **Impact:** Non-admin users cannot insert into `user_roles` under RLS. The call fails harmlessly, but produces a spurious error. Migration 010's trigger `handle_new_user()` already assigns the default role securely.
- **Recommended Fix:**
  Remove the redundant client-side mutation.

---

### INFO-01: Fallback Supabase Client Uses Placeholder Credentials
- **Severity:** **INFORMATIONAL**
- **Relevant File:** `frontend/src/services/supabaseClient.ts` (Lines 14–15)
- **Evidence:**
  Dummy URL `https://placeholder-project.supabase.co` is initialized when env vars are absent.
- **Impact:** Prevents fatal import crashes in offline test runners, but must be clearly distinguished from live production connectivity.
- **Recommended Fix:**
  Ensure `isSupabaseConfigured` is checked before every cloud operation and reported clearly in diagnostic interfaces.

---

## 4. Remediation Plan (Execution Order)

1. **Phase 2 — Auth & Bot Defense Hardening**:
   - Repair `TurnstileWidget.tsx` to fail closed on script error; eliminate automatic test token bypass in production.
   - Guard mock users and local storage role reading strictly behind `import.meta.env.DEV`.
   - Forward bot protection token and enforce validation.
2. **Phase 3 & 4 — Persistence & Sync Engine Repairs**:
   - Add `SYNC_EXERCISE_ATTEMPT` handler to `syncEngine.ts`.
   - Update `useCourse.ts` `markComplete()` to sync lesson completion and course tracks.
   - Fix `syncEngine.ts` `SYNC_SAVED_VOCABULARY` to use idempotent `.upsert()`.
   - Fix `DELETE_SAVED_VOCABULARY` to filter by both `source_text` and `target_lang`.
   - Fix `localDb.ts` `getPendingSyncActions()` to retrieve failed items for backoff retry.
   - Implement `SyncStatusBadge` in navigation header for live, truthful sync status.
3. **Phase 5 — Schema & Migration Reconciliation**:
   - Reconcile `engine/storage/supabase_repository.py` and add migration `011_daily_lessons_reconciliation.sql` if required.
4. **Phase 7 & 8 — Test Creation & Release Results**:
   - Create comprehensive unit & integration tests for all 15 audit requirements.
   - Run Vitest, Pytest, Lint, and Build.
   - Output `docs/audits/SECURITY_AND_PERSISTENCE_RESULTS.md`.
