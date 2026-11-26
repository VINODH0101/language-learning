# Lexilume Phase 8 — Database Query Performance & Indexing Report

> **Repository:** `VINODH0101/language-learning`  
> **Branch:** `phase-8-reliability-quality`  
> **Milestone:** Milestone 8.1 — Database Integrity and Migration Reliability

---

## 1. Indexing Strategy & High-Frequency Query Coverage

Phase 7 introduced 10 core tables. In Milestone 8.1, index coverage was evaluated against high-frequency query paths in the learner and administrator experiences:

| High-Frequency Query | Target Table | Supporting Index | Index Type |
| :--- | :--- | :--- | :--- |
| **Catalog Filtering** (`target_language`, `status`, `primary_cefr`, `genre`) | `content_items` | `idx_content_items_catalog` | Multi-column B-tree |
| **Active Version Lookup** | `content_versions` | `idx_content_versions_item` | `(content_item_id, version_number)` |
| **Sequential Activity Flow** | `learning_activities` | `idx_learning_activities_version` | `(content_version_id, activity_order ASC)` |
| **Learner Dashboard Progress** | `learner_content_progress` | `idx_learner_progress_user` | `(user_id, status, last_studied_at DESC)` |
| **Due SM-2 Review Queue** | `user_saved_words` | `idx_user_saved_words_review_queue` | Partial B-tree `WHERE state IN ('learning', 'reviewing')` |
| **Offline Mutation Replay Deduplication** | `user_saved_words` | `idx_user_saved_words_mutation` | Partial B-tree `WHERE client_mutation_id IS NOT NULL` |
| **Mistake Notebook Categorization** | `user_mistakes` | `idx_user_mistakes_queue` | `(user_id, status, error_category)` |
| **Pipeline Worker Queue Polling** | `content_processing_jobs` | `idx_content_jobs_worker` | `(status, created_at ASC)` |

---

## 2. Partial Index Optimization

Two critical queries use PostgreSQL partial indexes to minimize index bloat and maximize cache hit ratios:

### 2.1 Spaced Repetition Review Queue
```sql
CREATE INDEX idx_user_saved_words_review_queue 
ON public.user_saved_words(user_id, target_language, next_review ASC) 
WHERE state IN ('learning', 'reviewing');
```
- **Rationale:** Excludes words marked `'mastered'` or `'ignored'` (which can represent > 80% of a seasoned polyglot's lexicon).
- **Benefit:** Review queue lookups scan only active learning cards, keeping index pages compact in memory.

### 2.2 Client Mutation Deduplication
```sql
CREATE INDEX idx_user_saved_words_mutation 
ON public.user_saved_words(user_id, client_mutation_id) 
WHERE client_mutation_id IS NOT NULL;
```
- **Rationale:** Only mutations originated on client devices carry `client_mutation_id`. Server-originated records have null values. Partial indexing keeps this index minimal while accelerating sync reconciliation.

---

## 3. Query Plan Verification Summary

1. **Zero Table Scans on Primary Learner Views:** All catalog, reader, flashcard, and mistake notebook queries resolve via index scans or primary key seeks.
2. **Deterministic Sorts:** Orderings on `activity_order ASC`, `next_review ASC`, and `last_studied_at DESC` match index sort orders, eliminating in-memory `Sort` nodes.
