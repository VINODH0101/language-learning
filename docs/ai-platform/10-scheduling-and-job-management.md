# 10 — Scheduling & Job Management

> Implemented in `engine/ai/scheduling.py`; entrypoint `scripts/run_content_generation.py`; trigger wired into `.github/workflows/daily_polyglot.yml`.

## 1. Models

| Model | Purpose |
| :--- | :--- |
| `ContentSchedule` | per (content_type, target_language, explanation_language, cefr) frequency + daily limit |
| `GenerationJob` | a unit of generation with idempotency key, status, attempts, stored draft |
| `JobAttempt` | per-attempt provider/failure record |
| `SchedulerRunReport` | jobs planned/created/completed/failed/duplicate + fallback/budget counters |

## 2. Coverage planner

`CoveragePlanner.plan(schedules, existing_coverage)`:

1. Skip disabled schedules and non-due frequencies (`ordinal % frequency_days == 0`).
2. Skip combinations already covered (`content_type:target:cefr`).
3. Enforce per-schedule `daily_limit`.
4. Emit idempotent `GenerationJob`s keyed `schedule:date:combo`.

Never generates every language/CEFR/type combination indiscriminately.

## 3. Job lifecycle

`pending → running → completed | failed | cancelled(duplicate)`.

- `GenerationScheduler.run()` reads coverage, plans, creates jobs, runs them through `ContentGenerationEngine`.
- Idempotency: the job store and daily coverage key prevent duplicate generation on re-runs.
- Bounded retries with exponential backoff (`sleep_fn` injectable for tests).
- Duplicate output is marked `cancelled`/`jobs_duplicate`, not `failed`.
- `on_review(draft)` callback represents "notify Admin / update review queue" (wired in the Admin phase).

## 4. Daily budgets

Per-schedule `daily_limit` is enforced by the planner; provider daily token budgets are enforced by the router.

## 5. Trigger

The existing GitHub Actions workflow (`daily_polyglot.yml`) now runs `scripts/run_content_generation.py` after the daily batch. The script is offline-safe (deterministic fallback when provider keys are absent) and prints a JSON `SchedulerRunReport`.

## 6. Persistence note

`JobStore` is an interface with an `InMemoryJobStore` implementation. The database-backed store (writing `content_generation_schedules`/`jobs`/`attempts` + `ai_provider_usage`) is implemented in the persistence/Admin phases (Phase 2 migration 016 groundwork + Phase 8 Admin).
