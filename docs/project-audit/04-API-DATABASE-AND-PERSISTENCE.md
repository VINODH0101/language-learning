# 04. API, Database and Persistence Architecture

> **Audit Date:** 2026-10-29  
> **Repository:** `language-learning`  
> **Scope:** Relational schema, PostgreSQL migrations 001–008, Row-Level Security, Dexie IndexedDB schemas, and REST endpoints.

---

## 1. Relational Database Schema & PostgreSQL Migrations

The database layer is managed through 8 incremental, reversible migrations located in [`supabase/migrations/`](../../supabase/migrations/):

```
supabase/migrations/
├── 001_initial_schema.sql                       # Core tables, constraints, and indexes
├── 002_rls_policies.sql                         # Learner data isolation via auth.uid()
├── 003_email_and_retention.sql                  # Delivery ledger, cleanup logs, and retention
├── 004_minimal_wikipedia_assignments.sql        # Minimal seed reading assignments
├── 005_language_directions_and_saved_translations.sql # Saved translations and directionality
├── 006_auth_roles_audit_and_onboarding.sql      # User roles, admin RLS, and security audit log
├── 007_multiple_courses_and_progress_isolation.sql # Multi-course tracks and progress isolation
├── 008_cultural_bookmarks_and_sync.sql          # Cultural articles bookmarks and sync table
└── rollback/                                    # Reversible down-migration scripts
```

---

## 2. Table Catalog & Constraint Specifications

### 2.1 Core Learner Tables
- **`user_courses`**: Tracks multiple courses per user.
  - Columns: `id (UUID PK)`, `user_id (UUID)`, `target_lang (TEXT)`, `regional_variant (TEXT)`, `explanation_lang (TEXT)`, `cefr_level (TEXT)`, `is_active (BOOLEAN)`, `created_at`, `updated_at`.
  - Constraint: `UNIQUE (user_id, target_lang)`.
- **`daily_lessons`**: Generated 12-section daily lesson records.
  - Columns: `id (UUID PK)`, `course_id (UUID FK)`, `user_id (UUID)`, `delivery_date (DATE)`, `cefr_level (TEXT)`, `content_json (JSONB)`, `completed (BOOLEAN)`.
  - Index: `CREATE INDEX idx_daily_lessons_user_date ON daily_lessons(user_id, delivery_date)`.
- **`srs_items`**: Spaced repetition tracking for lexis and phrases.
  - Columns: `id (UUID PK)`, `user_id (UUID)`, `course_id (UUID FK)`, `lemma (TEXT)`, `interval_days (INT)`, `ease_factor (FLOAT)`, `repetition_count (INT)`, `next_review_utc (TIMESTAMPTZ)`.
- **`exercise_attempts`**: Individual exercise answers for accuracy metrics.
  - Columns: `id (UUID PK)`, `user_id (UUID)`, `exercise_id (TEXT)`, `submitted_answer (TEXT)`, `is_correct (BOOLEAN)`, `attempt_count (INT)`, `timestamp (TIMESTAMPTZ)`.

### 2.2 System & Administrative Tables
- **`user_roles`**: Administrative role management.
  - Columns: `user_id (UUID PK FK auth.users)`, `role (TEXT CHECK IN ('admin', 'learner'))`, `created_at`.
- **`admin_audit_logs`**: Immutable security log for admin operations.
  - Columns: `id (UUID PK)`, `admin_user_id (UUID)`, `action (TEXT)`, `target_user_id (UUID)`, `details (JSONB)`, `timestamp (TIMESTAMPTZ)`.
- **`email_deliveries`**: Delivery ledger preventing duplicate daily emails.
  - Constraint: Composite primary key `(user_id, delivery_date)`.

---

## 3. Row-Level Security (RLS) Policy Architecture

All tables in the public schema have Row-Level Security enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).

### 3.1 Learner Private Data Policies
```sql
-- Standard learner policy for user-scoped tables
CREATE POLICY "Learners can only manage their own data"
  ON user_courses
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### 3.2 Administrative Access Policies
Admin operations are verified via a secure database function:
```sql
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = user_uuid AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;
```

Administrative tables (`admin_audit_logs`, `email_deliveries`) enforce:
```sql
CREATE POLICY "Admins can view and create audit logs"
  ON admin_audit_logs
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));
```

---

## 4. Free-Tier Database Retention & Cleanup (`retention_cleanup.py`)

To prevent exceeding Supabase's 500 MB free storage allowance, `scripts/retention_cleanup.py` runs periodically via GitHub Actions:
- **`email_deliveries`**: Prunes successful records older than 90 days.
- **`exercise_attempts`**: Aggregates individual historical attempts into monthly summary statistics, retaining granular logs for 60 days.
- **`admin_audit_logs`**: Retains security logs for 180 days.
