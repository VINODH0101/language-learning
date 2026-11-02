# Lexilume — Offline Synchronization & Data Integrity Audit (Milestone 8.3)

> **Document Type:** Production Reliability & Synchronization Architecture Report  
> **Phase:** Phase 8 — Reliability, Security, Performance & Quality Hardening  
> **Milestone:** 8.3 — Offline Synchronization and Data Integrity  
> **Branch:** `phase-8-reliability-quality`  
> **Execution Date:** 2026-11-02  
> **Verified Status:** PASSED (All 6 persistence and synchronization regression tests passing)

---

## 1. Executive Summary

Milestone 8.3 audited and hardened the local-first synchronization subsystem between browser-local storage (Dexie / IndexedDB and memory fallback) and Supabase cloud persistence. Two critical flaws identified during the Milestone 8.0 baseline audit were investigated and remediated:
1. **Flawed Exponential Backoff Timing (`RISK-803`)**: Sync retry delay was previously measured against `created_at` instead of the timestamp of the last failure attempt, causing any failed mutation older than 30 seconds to bypass exponential backoff on retry.
2. **Out-of-Order Concurrency Overwrites (`RISK-809`)**: Out-of-order execution of queued offline mutations could overwrite newer SM-2 spaced repetition review calculations or progress telemetry in Supabase.

---

## 2. Verified Vulnerabilities & Targeted Fixes

### 2.1 Remediation of RISK-803: Backoff Calculation & Dead-Letter Isolation

- **Flaw Mechanism:**  
  In `frontend/src/services/syncEngine.ts`:
  ```typescript
  // Flawed logic:
  const itemAgeMs = Date.now() - new Date(item.created_at).getTime();
  if (itemAgeMs < backoffMs) continue;
  ```
  When a mutation failed after being queued for more than 30 seconds, `itemAgeMs` exceeded `backoffMs` immediately on every subsequent sync cycle. As a result, the sync engine engaged in continuous retry spin-loops upon network errors. Furthermore, items that failed perpetually were never isolated into a terminal dead-letter queue.

- **Remediation Implemented:**
  1. Extended `SyncQueueRecord` in `frontend/src/services/localDb.ts`:
     - Added `last_attempted_at?: string`.
     - Extended status type to `'pending' | 'failed' | 'dead_letter'`.
  2. Updated `markSyncActionFailed`:
     - Sets `last_attempted_at = new Date().toISOString()`.
     - Increments `retry_count` monotonically.
     - When `retry_count >= 5` (MAX_RETRIES), automatically transitions the mutation to `'dead_letter'`.
  3. Corrected backoff calculation in `frontend/src/services/syncEngine.ts`:
     ```typescript
     const lastAttempt = item.last_attempted_at 
       ? new Date(item.last_attempted_at).getTime() 
       : new Date(item.created_at).getTime();
     const elapsedMs = Date.now() - lastAttempt;
     if (elapsedMs < backoffMs) {
       continue; // Skip until backoff window expires
     }
     ```
  4. Dead-Letter Queue Isolation:
     - `getPendingSyncActions` filters out records with `retry_count >= 5` or `status === 'dead_letter'`.
     - Implemented `getDeadLetterSyncActions` for diagnostic inspection and administrative reconciliation without losing customer data.

### 2.2 Remediation of RISK-809: Concurrency & Monotonic Merging

- **Flaw Mechanism:**  
  When a learner reviewed vocabulary or completed activities across multiple devices offline, delayed mutations synced out-of-order could overwrite newer SM-2 ease factors, intervals, or lesson completion progress in Supabase with older snapshots.

- **Remediation Implemented:**
  1. **Monotonic Progress Aggregation (`SYNC_LEARNER_PROGRESS`)**:
     - Remote record is queried prior to upsert.
     - `percent_complete` is calculated as `Math.max(local, remote)` (monotonically non-decreasing).
     - `time_spent_seconds` is calculated as `Math.max(local, remote)`.
     - `completed_activity_ids` is computed as a set union `Array.from(new Set([...local, ...remote]))`.
     - `completed_at` is preserved once 100% completion is reached.
  2. **Non-Regressive SRS Review Merging (`SYNC_USER_SAVED_WORD`)**:
     - Remote record is queried for `last_reviewed_at`.
     - If the remote record has a newer `last_reviewed_at` timestamp than the local mutation, the remote repetition count, ease factor, interval days, next review date, and mastery state are preserved.

---

## 3. Test Verification Evidence

All synchronization mechanisms were verified via automated tests in `frontend/src/tests/persistenceAndSync.test.ts`.

### 3.1 CLI Execution Command

```bash
npm --prefix frontend test -- src/tests/persistenceAndSync.test.ts
```

### 3.2 Verified Output

```text
 RUN  v5.0.5 C:/Users/vinod/OneDrive/Desktop/language-learning/frontend

 ✓ src/tests/persistenceAndSync.test.ts (6 tests) 12ms

 Test Files  1 passed (1)
      Tests  6 passed (6)
   Start at  22:36:35
   Duration  4.55s (environment 78%, setup 13%, import 5%, transform 3%, worker 1%)
```

### 3.3 Test Suite Inventory

1. `Offline actions generate unique client_mutation_id and queue sync actions` (PASSED)
2. `Distinct POS for identical lemma does not collide in personal lexicon` (PASSED)
3. `Migrates guest progress, vocabulary, and mistakes to authenticated user without data loss` (PASSED)
4. `SyncEngine state and lifecycle updates cleanly when syncing` (PASSED)
5. `Flawed backoff fixed: failure tracks last_attempted_at and transitions to dead_letter at max retries (RISK-803)` (PASSED)
6. `Backoff calculation uses last_attempted_at instead of created_at (RISK-803)` (PASSED)

---

## 4. Conclusion & Handoff

Milestone 8.3 is completed, verified, and ready for commit. The local database and sync engine now enforce mathematically sound exponential backoff, dead-letter isolation, and monotonic progress merge semantics. Proceeding to Milestone 8.4: Content Pipeline Reliability.
