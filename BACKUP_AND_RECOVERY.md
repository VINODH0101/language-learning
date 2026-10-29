# Polyglot C1 Daily — Backup, Disaster Recovery & Storage Resilience

This document outlines the backup policies, disaster recovery procedures, and edge-case handling for **Polyglot C1 Daily**, guaranteeing zero data loss of essential learner progress within perpetual free-tier constraints.

---

## 1. Data Classification: Essential vs. Regenerable

To operate permanently within Supabase's 500 MB free storage tier, the application partitions data into two strict categories:

| Data Type | Tables / Assets | Retention Policy | Disaster Recovery Strategy |
| :--- | :--- | :--- | :--- |
| **Essential Learner Progress** (CANNOT BE LOST) | `users`, `user_learning_tracks`, `srs_items`, `exercise_attempts`, `diagnostic_assessments`, `email_deliveries` | **Permanent**. Never deleted during storage cleanup. | Exported to versioned, compressed JSON backups via `scripts/backup_restore.py`. |
| **Regenerable Content** (CAN BE RECONSTRUCTED) | Full daily lesson payloads (`daily_lessons.payload`) | **90 days**. Older payloads pruned by `scripts/retention_cleanup.py`. | Regenerated on-demand from deterministic curriculum rules, vocabulary pools, and content fingerprints. |
| **Canonical Static Curriculum** | `engine/data/*.json` | **Permanent** in Git version control. | Version-controlled source code repository. |

---

## 2. Backup & Restoration Procedures

### 2.1 Generating a Backup
Essential learner progress is exported using [`scripts/backup_restore.py`](file:///C:/Users/vinod/OneDrive/Desktop/language-learning/scripts/backup_restore.py):

```bash
# Export all learner progress and SRS history to the backups/ directory
python scripts/backup_restore.py backup --output-dir backups
```
**Output File**: `backups/polyglot_backup_YYYYMMDD_HHMMSS.json` containing:
- Schema version: `"1.0.0"`
- Learning tracks with completed objective IDs and streak counts
- SM-2 spaced repetition items, intervals, ease factors, and lapses
- Exercise attempts and diagnostic placement history

### 2.2 Restoring from a Backup
To restore data to a new or recovered Supabase project:

```bash
# Step 1: Perform a dry-run validation to verify schema compatibility
python scripts/backup_restore.py restore --file backups/polyglot_backup_20261029_075617.json --dry-run

# Step 2: Execute idempotent restoration
python scripts/backup_restore.py restore --file backups/polyglot_backup_20261029_075617.json
```

---

## 3. Disaster Recovery & Edge Case Runbook

### Scenario A: Supabase Free Tier Inactivity Pause (7-Day Pause)
- **Symptom**: Scheduled daily runner fails with connection timeout to `<project>.supabase.co`.
- **Root Cause**: Supabase pauses free-tier projects if no SQL queries are executed for 7 consecutive days (e.g. during an extended learner vacation).
- **Resolution Procedure**:
  1. Log into [supabase.com/dashboard](https://supabase.com/dashboard).
  2. Click **Restore Project** on the paused project banner.
  3. Restoration completes in ~2 minutes.
  4. Manually trigger the daily automation workflow via GitHub Actions `workflow_dispatch` to deliver any missed digests.
  5. *Prevention*: The daily GitHub Actions cron runs at 04:00 UTC every day, automatically querying the database and keeping it active as long as the repository workflow is enabled.

### Scenario B: Database Storage Limit Approaching (500 MB Limit)
- **Symptom**: Database warning on storage usage exceeding 80% (400 MB).
- **Resolution Procedure**:
  1. Run the storage retention cleanup utility in dry-run mode:
     ```bash
     python scripts/retention_cleanup.py --retention-days 60 --dry-run
     ```
  2. Execute cleanup to prune daily lesson JSON payloads older than 60 days:
     ```bash
     python scripts/retention_cleanup.py --retention-days 60
     ```
  3. Re-check database size. All learner tracks, SRS intervals, and streaks remain completely intact.

### Scenario C: External Educational API Outage or Rate Limit (HTTP 429/500)
- **Symptom**: Tatoeba or Wiktionary fails to respond or returns 429 / 500.
- **Handling**: The source adapters in `engine/sources/` detect the error, apply exponential backoff, and transparently fall back to curated offline test fixtures in `engine/sources/fixtures/`. The lesson generator proceeds without crashing or emitting fabricated content.

### Scenario D: Scheduled Job Starts Twice or Overlaps
- **Symptom**: Concurrency trigger or manual workflow dispatch while scheduled run is in progress.
- **Handling**:
  1. GitHub Actions `concurrency: group: daily-polyglot-execution, cancel-in-progress: false` ensures subsequent runs queue sequentially rather than executing concurrently.
  2. `scripts/run_daily_batch.py` checks `email_deliveries` using the unique composite constraint `(user_id, delivery_date, delivery_purpose)`. If already marked `"sent"`, the second job logs a message and exits with code 0 immediately without sending a duplicate email.

### Scenario E: Deleting a Lesson After Completion
- **Symptom**: Storage maintenance or user action deletes a generated `daily_lessons` record.
- **Handling**: The engine never computes curriculum progression by counting stored lessons. Progression is strictly determined by `completed_curriculum_node_ids` in `user_learning_tracks`. The learner will cleanly advance to their next uncompleted objective without resetting progress.

### Scenario F: Interrupted Dataset Import
- **Symptom**: Network disconnection during bulk vocabulary import.
- **Handling**: Imports use stable source identifiers (`source_id: wik-pt-<lemma>`, `tat-<id>`). Re-running the import performs an upsert, safely skipping already-imported records and avoiding duplicate entries.
