# 04 — Database Design

> Extends migration 015 content-centred schema. Forward-only migrations. Live schema still unverified (⚠️).

## 1. Reuse vs. new

| Concern | Decision |
| :--- | :--- |
| Content | Reuse `content_items` / `content_versions` / `learning_activities` |
| Progress | Reuse `learner_content_progress` |
| Lexicon/SM-2 | Reuse `user_saved_words` / `user_word_review_events` |
| Mistakes | Reuse `user_mistakes` |
| Processing stages | Reuse `content_processing_jobs` (extend) |
| Review | Reuse `content_review_items` |
| Daily poetry/dialogue | Reconcile `daily_published_content` into the unified model |

## 2. Reliability fixes (Phase 2, required before feature work)

1. **UUID generation** — use `gen_random_uuid()` / `crypto.randomUUID()`. Never `ci_*`/`cv_*`/`job_*`.
2. **Error-checked writes** — every `.upsert()`/`.insert()`/`.update()` must inspect `error`; wrap related writes in a transaction/db function.
3. **Correct conflict targets** — e.g. `learner_content_progress` on `(user_id, content_item_id)`; `user_saved_words` on `(user_id, target_language, lemma, pos, explanation_language)`.
4. **Idempotency** — `client_mutation_id` (or `idempotency_key`) unique per mutation; `ON CONFLICT DO NOTHING` where applicable.
5. **Backfill** — migrate any existing string-ID records to UUIDs without deleting learner progress.

## 3. Proposed tables (only if existing tables cannot represent them)

### 3.1 Generation & scheduling

| Table | Purpose | Key constraints |
| :--- | :--- | :--- |
| `content_generation_schedules` | per (content_type, language, cefr) frequency + limits | PK `id` UUID; UNIQUE `(content_type, target_language, cefr_level)`; enabled flag, `cron_expression`, `daily_limit` |
| `content_generation_runs` | one run per schedule execution | PK UUID; FK `schedule_id`; `status`, `started_at`, `finished_at` |
| `content_generation_jobs` | a unit of generation (creatable **before** content exists) | PK UUID; nullable FK `content_item_id`; `status`; `idempotency_key UNIQUE`; `content_type`, `target_language`, `explanation_language`, `cefr_level` |
| `content_generation_attempts` | per-provider attempt + failure | PK UUID; FK `job_id`; `provider_id`, `model_id`, `attempt_number`, `status`, `failure_category`, `latency_ms` |
| `content_prompt_templates` | versioned prompt templates | PK UUID; `content_type`, `version`, `body`, `active` |
| `content_validation_reports` | validation outcome per draft/version | PK UUID; FK `content_version_id`; `passed`, `errors JSONB`, timestamps |
| `ai_provider_usage` | operational usage accounting | PK UUID; `provider_id`, `model_id`, `prompt_version`, `request_id`, `prompt_tokens`, `completion_tokens`, `status`, `failure_category`, `created_at` |

> Reuse `content_processing_jobs` for the deterministic import pipeline; use `content_generation_jobs` for AI generation so a job can exist before an item.

### 3.2 Discovery

| Table | Purpose | Key constraints |
| :--- | :--- | :--- |
| `discovery_sources` | admin-managed source registry | PK UUID; `source_id UNIQUE`, `enabled`, `license`, `rate_limit`, `cache_ttl` |
| `discovery_items` | normalized, attributed resources | PK UUID; UNIQUE `(source_id, source_item_id)`; `target_language`, `category`, `facts JSONB`, `explanation`, `status` |
| `discovery_fetch_runs` | import batch tracking | PK UUID; FK `source_id`; `status`, timestamps |
| `discovery_enrichments` | enrichment provenance | PK UUID; FK `discovery_item_id`; `kind`, `payload JSONB`, timestamps |

## 4. Indexes (common filters)

- `content_items(target_language, status, primary_cefr, genre)` (exists), add `content_type` if adopted.
- `content_generation_jobs(status, created_at)` for worker polling.
- `ai_provider_usage(provider_id, created_at)` for usage dashboards.
- `discovery_items(target_language, category, status, created_at)`.
- `discovery_sources(enabled)` for scheduler.

## 5. RLS requirements

- Learner tables: `user_id = auth.uid()`.
- `content_items`/`content_versions`: read published only for learners; write admin-only.
- Generation/scheduling/provider-usage/discovery: admin-only.
- `ai_provider_usage` and validation reports: never exposed to learners.

## 6. Retention (configurable defaults)

| Record | Default retention |
| :--- | :--- |
| Published content/versions | keep while in catalogue |
| Drafts | 90 days |
| Rejected drafts | 30 days |
| Raw AI responses | 30 days (restricted) |
| Generation metadata | 90 days |
| Prompt templates/versions | indefinitely |
| Validation reports | with content version |
| Provider usage | 13 months |
| Discovery source cache | 7–30 days |
| Learner progress | while account active |

## 7. Migration impact

- Phase 2: additive reliability fixes + backfill (forward-only, non-destructive).
- Phase 5/6: create schedule/job/attempt/provider/discovery tables.
- No destructive reset scripts; no learner-data deletion.
