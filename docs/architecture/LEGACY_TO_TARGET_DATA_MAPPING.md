# Lexilume — Legacy to Target Data Mapping Specification

> **Repository:** `VINODH0101/language-learning` (Lexilume — Illuminate Your Words)  
> **Production Application:** `https://lexi.monster`  
> **Phase:** Phase 5 — Database Design, Data Mapping & Safe Migration Plan  
> **Target Migration Number:** `015` (`015_content_centred_architecture.sql`)  
> **Document Type:** Comprehensive Field-Level Migration & Transformation Specification

---

## 1. Executive Summary & Mapping Philosophy

The transition from a multi-track curriculum catalog to a content-centred architecture requires a non-destructive, zero-loss transformation strategy. 

### Core Mapping Guarantees:
1. **Zero Data Loss:** No legacy table is dropped. No historical rows are deleted or truncated.
2. **Backward Compatibility:** All existing 26 tables remain accessible during and after the migration.
3. **Selective Backfill:** High-value learner data (saved translations, spaced repetition cards, exercise performance telemetry) is migrated into the consolidated target tables (`user_saved_words`, `learner_content_progress`, `user_mistakes`).
4. **Resilient Typing:** Explicit adapters reconcile type mismatches (e.g. `VARCHAR` IDs in migration 012/013 vs canonical `UUID` identifiers).
5. **Guest Data Preservation:** Guest state stored in Dexie/localStorage is preserved through browser-side schema migration without requiring Supabase backfill until authentication occurs.

---

## 2. Table-by-Table Disposition & Mapping Matrix

Every existing table identified in the Current-State Database Audit is mapped below:

| # | Existing Table Name | Target Disposition | Target Destination Table | Transformation Strategy & Rationale |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `user_profiles` | **Retain As-Is** | `user_profiles` | Unchanged. Remains central learner profile and preferences record. |
| 2 | `user_roles` | **Retain As-Is** | `user_roles` | Unchanged. Core RBAC mechanism for learner vs admin authorization. |
| 3 | `admin_audit_logs` | **Retain As-Is** | `admin_audit_logs` | Unchanged. Retained for system governance and moderation history. |
| 4 | `user_courses` | **Retain & Project** | `user_courses` & `learner_content_progress` | Continues to serve legacy polyglot courses; progress on English tracks projects into `learner_content_progress`. |
| 5 | `user_learning_tracks` | **Retain & Consolidate** | `user_courses` / Deprecated | Legacy track pointers are maintained for historical queries; new enrollments use `user_courses`. |
| 6 | `language_tracks` | **Retain As-Is** | `language_tracks` | Static catalog reference; English track remains primary seed. |
| 7 | `curriculum_nodes` | **Retain As-Is** | `curriculum_nodes` | Preserved for legacy CEFR structure; content items can link to node keys. |
| 8 | `vocabulary_items` | **Retain & Reference**| `vocabulary_items` | Lemmas seeded in `vocabulary_items` serve as canonical reference lemmas during text tokenization. |
| 9 | `grammar_rules` | **Retain & Reference**| `grammar_rules` | Explanations reused inside `content_versions.structured_payload`. |
| 10 | `exercise_templates` | **Retain As-Is** | `exercise_templates` | Historical templates preserved; new activities defined in `learning_activities`. |
| 11 | `curated_materials` | **Backfill & Transform**| `english_content_items` + `content_versions` | Curated reading articles backfilled into canonical content items and version 1 payloads. |
| 12 | `licenses_and_sources` | **Backfill & Map** | `content_sources` | Historical source attributions migrated to `content_sources`. |
| 13 | `daily_lessons` | **Retain & View** | `daily_lessons` | Legacy daily payloads preserved; queryable via compatibility view. |
| 14 | `lesson_exercises` | **Retain As-Is** | `lesson_exercises` | Historical link table; retained for legacy lesson replay. |
| 15 | `user_vocabulary_history`| **Consolidate** | `user_saved_words` | Historical vocabulary terms migrated to `user_saved_words` with fallback SM-2 state. |
| 16 | `saved_translations` | **Consolidate** | `user_saved_words` | Learner word bookmarks migrated into personal lexicon table. |
| 17 | `lesson_assignments` | **Retain As-Is** | `lesson_assignments` | Classroom assignments preserved without modification. |
| 18 | `email_deliveries` | **Retain As-Is** | `email_deliveries` | Operational transactional email logs preserved. |
| 19 | `retention_cleanup_logs`| **Retain As-Is** | `retention_cleanup_logs` | Maintenance logs preserved. |
| 20 | `cultural_bookmarks` | **Retain As-Is** | `cultural_bookmarks` | User bookmarks on cultural articles preserved. |
| 21 | `srs_items` | **Consolidate** | `user_saved_words` | Active spaced repetition cards migrated into `user_saved_words`. |
| 22 | `exercise_attempts` | **Consolidate & Mine** | `user_mistakes` & activity telemetry | Failed attempts mined to initialize user mistake notebook entries. |
| 23 | `daily_published_content`| **Backfill & Transform**| `english_content_items` + `content_versions` | Daily studio content backfilled into versioned content items. |
| 24 | `learning_activity_events`| **Retain As-Is** | `learning_activity_events` | Telemetry event log retained; provides input for streak and time tracking. |
| 25 | `content_review_items` | **Retain & Align** | `content_review_items` | Content moderation queue aligned with `english_content_items` workflow. |
| 26 | `admin_background_jobs`| **Retain & Expand**| `content_processing_jobs` | General admin jobs remain in `admin_background_jobs`; pipeline tasks use `content_processing_jobs`. |

---

## 3. Deep-Dive Consolidation Mappings

### 3.1 Vocabulary & SM-2 Consolidation (`user_saved_words`)
Historically, vocabulary was scattered across three separate tables:
- `saved_translations` (quick word lookup bookmarks)
- `srs_items` (SuperMemo SM-2 scheduling parameters)
- `user_vocabulary_history` (legacy encounter log)

In the target architecture, these coalesce into `user_saved_words`.

#### Field Transformation Rules:
```
Target: user_saved_words
├── id                     <-- gen_random_uuid() (or srs_items.id if available)
├── user_id                <-- source table user_id
├── term                   <-- coalesce(srs_items.vocabulary_item_id, saved_translations.source_text)
├── lemma                  <-- lower(trim(coalesce(srs_items.vocabulary_item_id, saved_translations.source_text)))
├── pos                    <-- NULL (inferred during first background dictionary enrichment)
├── cefr_level             <-- 'B1' (default fallback if unclassified)
├── explanation_language   <-- coalesce(saved_translations.target_lang, 'en')
├── definition             <-- coalesce(saved_translations.target_text, 'Saved lexical item')
├── context_sentence       <-- NULL (or extracted from source lesson if joinable)
├── context_translation    <-- NULL
├── source_content_id      <-- NULL (linked dynamically when encountered in new content)
├── next_review            <-- coalesce(srs_items.next_review_date::date, CURRENT_DATE)
├── interval_days          <-- coalesce(srs_items.interval, 0)
├── ease_factor            <-- coalesce(srs_items.ease_factor, 2.5)
├── repetitions            <-- coalesce(srs_items.repetitions, 0)
├── lapses                 <-- 0
├── last_reviewed_at       <-- srs_items.last_reviewed
└── state                  <-- CASE WHEN srs_items.repetitions > 5 THEN 'mastered' ELSE 'learning' END
```

#### Deduplication & Conflict Resolution Logic:
When a learner saved a word in `saved_translations` AND also has an active SM-2 card in `srs_items`, the two records must merge without creating duplicate entries:
1. `srs_items` takes priority for scheduling fields (`next_review`, `interval_days`, `ease_factor`, `repetitions`).
2. `saved_translations` provides human-readable translation definitions.
3. Uniqueness is enforced on `(user_id, lemma, explanation_language)`.
4. The migration script uses `ON CONFLICT (user_id, lemma, explanation_language) DO UPDATE` to enrich the existing record with the most complete scheduling and definition metadata.

---

### 3.2 Content Catalog Backfill (`english_content_items` & `content_versions`)
Existing curated texts in `curated_materials` and editorial dialogues in `daily_published_content` represent valuable learning assets that must be converted into the content-centred format.

#### Transformation Mapping from `curated_materials`:
```sql
-- Step 1: Create content item header
INSERT INTO public.english_content_items (
    id,
    title,
    slug,
    summary,
    genre,
    primary_cefr,
    estimated_read_minutes,
    status,
    created_at
)
SELECT 
    cm.id,
    cm.title,
    -- Generate URL-safe slug from title and content_key
    lower(regexp_replace(cm.title, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(cm.id::text, 1, 8),
    substring(cm.content_payload->>'excerpt' from 1 for 300),
    'short_story',
    coalesce(cm.cefr_level, 'B1'),
    coalesce((cm.content_payload->>'reading_time_minutes')::integer, 3),
    'published',
    cm.created_at
FROM public.curated_materials cm
ON CONFLICT (slug) DO NOTHING;

-- Step 2: Create immutable version 1 payload
INSERT INTO public.content_versions (
    content_item_id,
    version_number,
    cefr_level,
    structured_payload,
    word_count,
    is_published,
    published_at,
    created_at
)
SELECT 
    cm.id,
    1,
    coalesce(cm.cefr_level, 'B1'),
    jsonb_build_object(
        'title', cm.title,
        'raw_text', cm.content_payload->>'full_text',
        'source', 'legacy_curated_materials'
    ),
    coalesce((cm.content_payload->>'word_count')::integer, 0),
    true,
    cm.created_at,
    cm.created_at
FROM public.curated_materials cm
ON CONFLICT (content_item_id, version_number) DO NOTHING;

-- Step 3: Link current_version_id
UPDATE public.english_content_items c
SET current_version_id = v.id
FROM public.content_versions v
WHERE c.id = v.content_item_id AND v.version_number = 1
  AND c.current_version_id IS NULL;
```

---

### 3.3 Learner Progress Migration (`learner_content_progress`)
Learner completion is migrated by aggregating completed lesson events from `learning_activity_events` and course completions from `user_courses`.

#### Transformation Mapping:
```sql
INSERT INTO public.learner_content_progress (
    user_id,
    content_item_id,
    content_version_id,
    status,
    percent_complete,
    completed_activity_ids,
    time_spent_seconds,
    first_opened_at,
    last_studied_at,
    completed_at
)
SELECT 
    lae.user_id,
    ci.id AS content_item_id,
    ci.current_version_id AS content_version_id,
    'completed' AS status,
    100 AS percent_complete,
    '["reading", "comprehension"]'::jsonb AS completed_activity_ids,
    coalesce(sum(lae.duration_seconds), 300) AS time_spent_seconds,
    min(lae.created_at) AS first_opened_at,
    max(lae.created_at) AS last_studied_at,
    max(lae.created_at) AS completed_at
FROM public.learning_activity_events lae
JOIN public.english_content_items ci ON ci.title = lae.activity_type -- Or matched content identifier
WHERE lae.user_id IS NOT NULL AND ci.current_version_id IS NOT NULL
GROUP BY lae.user_id, ci.id, ci.current_version_id
ON CONFLICT (user_id, content_item_id) DO NOTHING;
```

---

### 3.4 Mistake Notebook Initialization (`user_mistakes`)
Failed attempts from `exercise_attempts` where `is_correct = false` are mined to bootstrap the learner's personal mistake notebook.

#### Mining Criteria:
```sql
INSERT INTO public.user_mistakes (
    user_id,
    activity_type,
    error_category,
    stimulus,
    user_response,
    correct_response,
    pedagogical_explanation,
    status,
    occurrences_count,
    first_occurred_at,
    last_occurred_at
)
SELECT 
    ea.user_id,
    'exercise_attempt' AS activity_type,
    'vocabulary_choice' AS error_category,
    coalesce(ea.exercise_payload->>'question', 'Exercise prompt') AS stimulus,
    coalesce(ea.user_answer, 'Incorrect answer') AS user_response,
    coalesce(ea.correct_answer, 'Standard answer') AS correct_response,
    coalesce(ea.exercise_payload->>'explanation', 'Review this grammatical or lexical form in context.') AS pedagogical_explanation,
    'unresolved' AS status,
    count(*) AS occurrences_count,
    min(ea.created_at) AS first_occurred_at,
    max(ea.created_at) AS last_occurred_at
FROM public.exercise_attempts ea
WHERE ea.is_correct = false AND ea.user_id IS NOT NULL
GROUP BY 
    ea.user_id, 
    ea.exercise_payload->>'question', 
    ea.user_answer, 
    ea.correct_answer, 
    ea.exercise_payload->>'explanation'
ON CONFLICT DO NOTHING;
```

---

## 4. Handling Unauthenticated & Guest Learner State

Lexilume permits visitors to complete reading activities, translation lookups, and placement assessments prior to account registration:
1. **Local-First Boundary:** Guest data exists solely within the browser IndexedDB (`localDb.ts`) and `localStorage`.
2. **No Orphaned Cloud Rows:** Supabase tables strictly require foreign keys to `auth.users(id)`. Unauthenticated guest data is **never** written to Supabase with dummy IDs.
3. **Account Linkage Lifecycle:**
   - When a guest signs up or logs in via Supabase Auth, `authService.ts` triggers `syncGuestDataToAccount()`.
   - The local Dexie stores (`user_saved_words`, `learner_content_progress`, `user_mistakes`) are stamped with the new `auth_user_id`.
   - The queued mutations are pushed via the existing `syncEngine.ts` queue.

---

## 5. Potential Data Anomalies & Discrepancy Prevention

| Risk / Discrepancy | Root Cause | Preventive Transformation Logic |
| :--- | :--- | :--- |
| **ID Type Mismatch** (`VARCHAR` vs `UUID`) | Migrations 012 and 013 used `VARCHAR` IDs for `daily_published_content` and `learning_activity_events`, whereas canonical tables use `UUID`. | During backfill, valid UUIDs are cast via `::uuid`; invalid strings are hashed deterministically into UUID space via `md5(legacy_id)::uuid`. |
| **Duplicate Vocabulary Lemmas** | User saved both `"Coffee"` and `"coffee"`, or saved the same word across multiple sessions. | Lowercasing and trimming: `lower(trim(term))` is enforced in all unique constraints and migration queries. |
| **Empty or Corrupt JSON Payloads** | Legacy `daily_lessons` or `curated_materials` containing malformed JSON strings. | Fallback coalesce logic: `coalesce(content_payload, '{}'::jsonb)` ensures JSONB operators (`->>`) never cause unhandled NULL reference crashes. |
| **Orphaned User Records** | Deleted auth users leaving historical rows in tables lacking foreign key cascade. | Strict `WHERE user_id IN (SELECT id FROM auth.users)` filter in all backfill migration queries. |

---

## 6. Migration Exception Reporting Strategy

To avoid silent data corruption or dropped learner records during backfill, an exception logging table is defined for the backfill phase:

```sql
CREATE TABLE IF NOT EXISTS public.migration_exception_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_table VARCHAR(60) NOT NULL,
    source_record_id TEXT NOT NULL,
    error_message TEXT NOT NULL,
    failed_payload JSONB,
    logged_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

Any record failing validation (e.g. invalid foreign keys, unparseable CEFR levels, malformed UTF-8) is written to `migration_exception_logs` with full diagnostic payloads, enabling immediate post-migration auditing without aborting batch transaction processing.
