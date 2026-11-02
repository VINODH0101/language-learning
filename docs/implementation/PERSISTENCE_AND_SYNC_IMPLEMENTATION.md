# Lexilume Phase 7 — Persistence & Synchronization Implementation Report

> **Repository:** `VINODH0101/language-learning`  
> **Implementation Branch:** `phase-7-core-implementation`  
> **Milestones Addressed:** Milestone 7.8 (Guest/Authenticated Persistence & Synchronization)  
> **Status:** Implemented & Verified

---

## 1. Executive Summary

Milestone 7.8 establishes a resilient, offline-first data layer ensuring that learners can read authentic texts, look up vocabulary, complete comprehension checks, and review spaced repetition flashcards entirely offline. All mutations are stored locally first in Dexie v5 IndexedDB, queued in `syncQueue` with idempotent `client_mutation_id` tracking, and synchronized seamlessly to Supabase PostgreSQL when network connectivity is established.

---

## 2. Dexie IndexedDB Schema (Version 5)

The local browser database in `frontend/src/services/localDb.ts` was upgraded to Version 5 with dedicated stores matching the PostgreSQL architecture:

```typescript
this.version(5).stores({
  // Legacy stores preserved for backward compatibility
  userCourses: 'id, [user_id+target_language+regional_variant+cefr_level], updated_at',
  savedVocabulary: 'id, [user_id+source_text+target_lang], user_id, target_lang',
  exerciseAttempts: 'id, exercise_id, timestamp',
  culturalBookmarks: 'id, user_id, article_id',
  syncQueue: '++id, user_id, action, status, created_at',
  phrasebookWords: 'id, user_id, target_lang, next_review, mastery_status',
  srsItems: 'id, [user_id+vocabulary_item_id], user_id, language, next_review_date',

  // Phase 7 Content-Centred Stores
  cachedContentItems: 'id, slug, target_language, primary_cefr, status, created_at',
  learnerContentProgress: 'id, [user_id+content_item_id], user_id, status, last_studied_at',
  userSavedWords: 'id, [user_id+target_language+lemma+pos+explanation_language], user_id, target_language, next_review, state',
  userMistakes: 'id, user_id, status, error_category, last_occurred_at',
  contentProcessingJobs: 'id, content_item_id, status, created_at',
});
```

### In-Memory Fallback
For environments where IndexedDB is unavailable or restricted (SSR, restricted browser tabs, headless Vitest/Node runners), `localDb.ts` maintains an in-memory map mirroring each store. Database operations gracefully cascade to memory fallback without throwing unhandled exceptions.

---

## 3. Offline-First Cache-Aside Strategy

In `frontend/src/services/contentCentredService.ts`, all read operations follow a disciplined cache-aside hierarchy:
1. **Memory Registry:** Instant lookup in memory cache.
2. **Local Database (Dexie):** IndexedDB query for cached published items, learner progress, or saved words.
3. **Remote Supabase:** If connected and online, queries Supabase PostgREST under Row Level Security (RLS). Results are asynchronously written back to Dexie for subsequent offline access.
4. **Offline Resilience:** If offline or if Supabase is unconfigured, seed content items (`SEED_CONTENT_ITEMS`) and local records return immediately with zero latency and zero errors.

---

## 4. Synchronization Engine (`SyncEngine`)

Located in `frontend/src/services/syncEngine.ts`, the sync engine coordinates bidirectional data transfer between local storage and Supabase:

### 4.1 Supported Content-Centred Actions
- `SYNC_LEARNER_PROGRESS`: Upserts progress record into `learner_content_progress` on conflict `(user_id, content_item_id)`.
- `SYNC_USER_SAVED_WORD`: Upserts saved word into `user_saved_words` on conflict `(user_id, target_language, lemma, pos, explanation_language)`.
- `SYNC_USER_MISTAKE`: Upserts mistake notebook entry into `user_mistakes` on conflict `(id)`.
- `SYNC_WORD_REVIEW_EVENT`: Appends discrete review event to `user_word_review_events`.

### 4.2 Retry Policy & Exponential Backoff
- Each queued sync item tracks `retry_count`.
- When an attempt fails, backoff is computed with jitter:
  $$\text{backoffMs} = \min(30000, 1000 \times 2^{\text{retry\_count}} + \text{jitter})$$
- Actions are skipped until the backoff window expires to prevent network thrashing.

### 4.3 Resolution of Risk 5: `client_mutation_id` Reconciliation
Every mutation generated on the client includes a globally unique `client_mutation_id` (format: `mut_<timestamp>_<random>`). Both client Dexie tables and Supabase PostgreSQL schema index `client_mutation_id`, enabling idempotent deduplication during network reconnections.

---

## 5. Guest to Authenticated Account Migration

When an unauthenticated guest creates an account or signs in, `migrateGuestContentData(userId)` in `localDb.ts` migrates all guest telemetry in an atomic transaction:
1. **Learner Progress:** Reassigns `user_id = authUserId` for all records where `user_id IN ('guest', 'guest_user')`.
2. **Personal Lexicon:** Migrates all saved vocabulary words to the authenticated user partition.
3. **Mistake Notebook:** Migrates all unresolved and mastered mistakes.
4. **Sync Queue:** Reassigns all pending mutation queue items to `authUserId` and triggers `syncEngine.syncNow()`.
5. **Conflict Avoidance:** No existing cloud data is overwritten; mutations merge cleanly using PostgreSQL `ON CONFLICT` clauses.
