# Lexilume — Database Persistence & Schema Verification Report

> **Target Version:** Lexilume 2.0.0  
> **Repository:** `VINODH0101/language-learning`  
> **Date:** October 30, 2026

---

## 1. Dual-Tier Persistence Architecture

Lexilume operates a resilient dual-tier persistence system:
1. **Authoritative Cloud Database (Supabase PostgreSQL)**:
   - Serves authenticated learners with multi-device synchronization.
   - Enforces PostgreSQL Row-Level Security (RLS) on every table.
   - Managed through numbered, repeatable SQL migrations (`001` through `010`).
2. **Authoritative Client-Side Database (Dexie / IndexedDB)**:
   - Full offline functionality for both guests and authenticated learners.
   - Stores active lesson progress, local mistake notebooks, cultural bookmarks, and the SM-2 review deck.
   - Houses the offline mutation sync queue (`syncQueue`).
3. **Restricted Storage (localStorage)**:
   - Scoped strictly to small session tokens and immediate preferences (`polyglot_interface_lang`, `polyglot_active_course_id`).
   - Keys are scoped by user ID to prevent data leakage between different users on shared devices.

---

## 2. PostgreSQL Migrations & Schema Audit

Migrations 001 through 010 were reconciled, validated, and verified:

| Migration File | Responsibility | Tables Affected | Rollback Verified |
| :--- | :--- | :--- | :--- |
| `001_initial_schema.sql` | Core learner schema & progress | `profiles`, `user_progress`, `saved_vocabulary`, `srs_records` | Yes |
| `002_rls_policies.sql` | Row-Level Security policies | All core tables | Yes |
| `003_email_and_retention.sql`| Daily digest & GDPR retention | `profiles`, `email_delivery_logs` | Yes |
| `004_minimal_wikipedia_assignments.sql` | Reading assignments storage | `curriculum_assignments` | Yes |
| `005_language_directions_and_saved_translations.sql` | Directionality & translation history | `saved_translations` | Yes |
| `006_auth_roles_audit_and_onboarding.sql` | Role-based access control & audit | `audit_logs`, `profiles` | Yes (`test_migration_006`) |
| `007_multiple_courses_and_progress_isolation.sql` | Multi-course support & isolation | `courses`, `user_progress` | Yes (`test_migration_007`) |
| `008_cultural_bookmarks_and_sync.sql` | Cultural article bookmarks | `cultural_bookmarks` | Yes (`test_migration_008`) |
| `009_schema_reconciliation_and_sync.sql` | Column alignment & sync metadata | Core tables reconciliation | Yes (`test_migration_009`) |
| `010_database_persistence_and_sync_repair.sql` | Foreign key cascades & tenant sync | `courses`, `saved_vocabulary`, `srs_records` | Yes (`test_migration_010`) |

---

## 3. Offline Mutation Sync Queue (`SyncEngine`)

When a user performs learning mutations while disconnected:
1. Mutations (`save_vocab`, `rate_srs`, `complete_lesson`, `save_progress`) are recorded in Dexie `syncQueue`.
2. Each item explicitly captures:
   - `id`: Unique UUID.
   - `user_id`: Active learner ID (preventing writes under subsequent user sessions).
   - `action`: Specific mutation verb.
   - `payload`: Exact structured data.
   - `status`: `'pending'` | `'failed'`.
   - `retry_count`: Incremented on network retry.
3. Upon reconnection (`window.addEventListener('online')`), the `SyncEngine` drains the queue sequentially.

---

## 4. Verification Test Matrix

- `frontend/src/tests/persistenceE2E.test.ts`: 12/12 tests passed validating end-to-end guest-to-authenticated data migration, Dexie-to-Supabase synchronization, and RLS constraint handling.
- `frontend/src/tests/localDb.test.ts`: 4/4 tests passed verifying offline table initialization, query speed, and data exports.
- `frontend/src/tests/storage.test.ts`: 6/6 tests passed validating user-scoped localStorage keys and SM-2 state preservation.
- `frontend/src/tests/syncEngine.test.ts`: 4/4 tests passed validating retry limits, jittered backoff, and idempotent payloads.
- `tests/test_migration_010.py`: Verified migration syntax and rollback integrity with Python Pytest.

> [!NOTE]
> In local test execution where live Supabase cloud credentials are substituted with local test harnesses, all storage adapters verified non-blocking fallback mechanisms. Full cloud persistence will bind immediately upon setting `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the production environment.
