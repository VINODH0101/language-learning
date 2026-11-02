# Lexilume — Database Implementation: Content-Centred Schema

> **Repository:** `VINODH0101/language-learning` (Lexilume — Illuminate Your Words)  
> **Production URL:** `https://lexi.monster`  
> **Migration Reference:** `supabase/migrations/015_content_centred_architecture.sql`  
> **Rollback Reference:** `supabase/migrations/rollback/015_rollback.sql`  
> **Phase:** Phase 7 — Core Implementation  
> **Milestone:** Milestone 7.1 — Final Database Schema & Migration  

---

## 1. Schema Architecture Overview

Migration `015` implements the unified content-centred database architecture designed in Phase 4 and Phase 5, incorporating the critical fixes established in the Phase 5 Risk Register (`docs/cleanup/PHASE_5_RISK_REGISTER.md`).

The schema establishes clear relational boundaries between:
- **Shared, Universal Content:** `content_sources`, `content_items`, `content_versions`, `learning_activities`.
- **Private, Tenant-Owned Learner Data:** `learner_content_progress`, `user_saved_words`, `user_word_review_events`, `user_mistakes`.
- **Durable Pipeline Telemetry:** `content_processing_jobs`.
- **Migration & Audit:** `migration_exception_logs`.

---

## 2. Table Specifications & Architectural Rationales

### 2.1 `content_sources`
Stores provenance, open educational licenses (e.g. Creative Commons CC-BY-SA, Public Domain, Tatoeba), and attribution notices. Ensures legal compliance for all imported texts.

### 2.2 `content_items`
The primary catalog table for all authentic learning texts across English, Portuguese, and Spanish:
- `target_language`: Learning language being acquired (`en`, `pt`, `es`).
- `explanation_language`: Language used for contextual notes and glosses (`en`, `pt`, `es`).
- `rights_status`: Enforces copyright clearance (`original`, `public_domain`, `licensed`, `permitted`, `restricted`, `unknown`). Publication is blocked unless rights are verified.
- `current_version_id`: Circular foreign key to the active immutable version in `content_versions`.

### 2.3 `content_versions`
Snapshots of analyzed content:
- Published versions (`is_published = true`) are strictly immutable. Any editorial corrections spawn a new record with incremented `version_number`.
- `structured_payload` (JSONB) holds the full annotated document tree (paragraphs, sentences, tokens, lexical definitions, and grammar points).
- GIN indexed for rapid querying of vocabulary and grammar patterns without multiple table joins.

### 2.4 `learning_activities`
Structured exercises generated from an immutable content version:
- Supported types: `reading_comprehension`, `vocabulary_cloze`, `grammar_transformation`, `listening_dictation`, `sentence_scramble`, `spoken_shadowing`, `free_writing`, `true_false`, `short_answer`.
- Uniquely ordered per content version via `(content_version_id, activity_order)`.

### 2.5 `learner_content_progress`
Tracks each learner's journey through specific content items and versions:
- `user_id`: Foreign key to `auth.users(id)`.
- `completed_activity_ids`: Array of activity UUIDs completed.
- `client_mutation_id`: Guarantees idempotency during offline mutation sync and guest-to-account upgrades.

### 2.6 `user_saved_words`
Consolidates personal vocabulary bookmarks and the complete SuperMemo SM-2 spaced repetition engine:
- **Risk 1 Resolution:** Compound unique constraint `(user_id, target_language, lemma, pos, explanation_language)` prevents cross-language collisions (e.g., saving *"radio"* in Spanish does not collide with *"radio"* in English or Portuguese).
- **Risk 2 Resolution:** Preserves all 8 scheduling columns (`ease_factor`, `interval_days`, `repetitions`, `lapses`, `last_reviewed_at`, `next_review`, `legacy_srs_item_id`, `context_sentence`).
- Indexed on `(user_id, target_language, next_review ASC)` for high-performance retrieval of daily due review queues.

### 2.7 `user_word_review_events`
Stores historical SM-2 review logs separately from the current calculated schedule. Provides an auditable telemetry trail for learner progress analysis and disaster recovery.

### 2.8 `user_mistakes`
The Mistake Notebook repository:
- Captures error incidents from reading activities, cloze drills, or grammar tests.
- Categorized by `error_category` (`vocabulary_choice`, `verb_tense`, `preposition`, `spelling`, `word_order`, etc.).
- Indexed for instant retrieval of unresolved mistakes during targeted practice sessions.

### 2.9 `content_processing_jobs`
Durable tracking table for the asynchronous 8-stage content pipeline:
- Records stage-by-stage status, timings, error messages, and intermediate outputs (`stage_outputs`).
- Supports idempotent stage-level retries without rerunning successful upstream stages.

### 2.10 `migration_exception_logs`
Audit table recording any malformed or unmappable historical records encountered during migration operations.

---

## 3. Backward-Compatibility Views

To prevent regressions in legacy client components during incremental migration, three compatibility views are provided with `WITH (security_invoker = true)` (resolving Risk 6):

1. **`english_content_items`:** Filters `content_items` where `target_language = 'en'`.
2. **`v_legacy_srs_items`:** Maps `user_saved_words` to legacy `srs_items` columns.
3. **`v_legacy_daily_content`:** Maps published `content_items` and `content_versions` to legacy `daily_published_content` structure.

---

## 4. Row-Level Security (RLS) Policy Matrix

| Table | Anonymous (Public) | Authenticated Learner | Authenticated Administrator | Service Role |
| :--- | :--- | :--- | :--- | :--- |
| `content_sources` | SELECT | SELECT | ALL | ALL |
| `content_items` | SELECT (`status = 'published'`) | SELECT (`status = 'published'`) | ALL | ALL |
| `content_versions` | SELECT (`is_published = true`) | SELECT (`is_published = true`) | ALL | ALL |
| `learning_activities` | SELECT (published versions) | SELECT (published versions) | ALL | ALL |
| `learner_content_progress` | NONE | ALL (`user_id = auth.uid()`) | ALL (`user_id = auth.uid()`) | ALL |
| `user_saved_words` | NONE | ALL (`user_id = auth.uid()`) | ALL (`user_id = auth.uid()`) | ALL |
| `user_word_review_events` | NONE | ALL (`user_id = auth.uid()`) | ALL (`user_id = auth.uid()`) | ALL |
| `user_mistakes` | NONE | ALL (`user_id = auth.uid()`) | ALL (`user_id = auth.uid()`) | ALL |
| `content_processing_jobs` | NONE | NONE | ALL | ALL |
| `migration_exception_logs` | NONE | NONE | ALL | ALL |
