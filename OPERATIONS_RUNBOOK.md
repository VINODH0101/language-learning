# Polyglot C1 Daily — Operations & Maintenance Runbook

This runbook guides operators through routine maintenance, daily monitoring, manual workflow dispatches, and troubleshooting for **Polyglot C1 Daily**.

---

## 1. Daily Health & Monitoring Checklist

Every morning or after scheduled execution (04:00 UTC / 09:30 AM IST):
1. **Check GitHub Actions Execution**:
   - Go to **Actions → Daily Polyglot C1 Automation**.
   - Confirm the scheduled run succeeded (green checkmark).
   - Expected run time: between 45 seconds and 1.5 minutes.
2. **Inspect Delivery Log**:
   - Click the workflow run to view step outputs.
   - Confirm: `Successfully delivered daily email! Provider ID: ...`
   - Confirm HTML payload size is logged under 75 KB.
3. **Verify Idempotency**:
   - If a duplicate run was triggered, confirm: `Idempotency Guard: Email already dispatched ... Exiting safely.`

---

## 2. Manual Dispatches & CLI Operations

### 2.1 Triggering a Manual Digest from GitHub Actions
1. Navigate to **Actions → Daily Polyglot C1 Automation**.
2. Click **Run workflow**.
3. Choose parameters:
   - `dry_run: true` to test without sending real emails.
   - `force: true` to bypass idempotency locks and re-send today's digest.

### 2.2 Running Batch from Command Line
```bash
# Test run with dry-run mode
python scripts/run_daily_batch.py --dry-run

# Run for a specific learner and recipient email
python scripts/run_daily_batch.py \
  --user-id "carlos_silva" \
  --recipient-email "carlos@example.com" \
  --provider resend

# Run backfill for a past missed date
python scripts/run_daily_batch.py \
  --date "2026-10-28" \
  --user-id "carlos_silva" \
  --force
```

---

## 3. Storage Maintenance (Quarterly Execution)

To maintain database storage within free-tier limits:
```bash
# Step 1: Export essential progress backup
python scripts/backup_restore.py backup --output-dir backups

# Step 2: Test retention cleanup in dry-run mode (90-day window)
python scripts/retention_cleanup.py --retention-days 90 --dry-run

# Step 3: Execute cleanup
python scripts/retention_cleanup.py --retention-days 90
```

---

## 4. Timezone Schedule Reference

The scheduler operates on UTC. Learner local time conversion is mapped as follows:

| Learner Location / Timezone | Target Delivery Time (Local) | GitHub Actions UTC Cron |
| :--- | :--- | :--- |
| **India (Asia/Kolkata - IST = UTC+05:30)** | **09:30 AM IST** | **`0 4 * * *` (04:00 UTC)** |
| Brazil (America/Sao_Paulo - BRT = UTC-03:00) | 07:00 AM BRT | `0 10 * * *` (10:00 UTC) |
| Portugal (Europe/Lisbon - WET = UTC+00:00) | 07:00 AM WET | `0 7 * * *` (07:00 UTC) |
| Spain (Europe/Madrid - CET = UTC+01:00) | 08:00 AM CET | `0 7 * * *` (07:00 UTC) |
| Mexico (America/Mexico_City - CST = UTC-06:00) | 07:00 AM CST | `0 13 * * *` (13:00 UTC) |

---

## 5. Troubleshooting Common Failures

### 1. Resend Returns HTTP 422: "Unverified Sender / Domain"
- **Cause**: Using an arbitrary sender address on the free tier without domain verification.
- **Fix**: In GitHub Repository Secrets, update `EMAIL_FROM_ADDRESS` to `onboarding@resend.dev` and ensure `RECIPIENT_EMAIL` matches the email address registered on the Resend account. Alternatively, switch `EMAIL_PROVIDER` to `smtp`.

### 2. GitHub Actions Scheduled Jobs Stopped Running
- **Cause**: GitHub automatically suspends scheduled workflows if no Git commits occur in a repository for 60 consecutive days.
- **Fix**: Open the repository in GitHub, click the **Actions** tab, and click **Enable workflow** on the banner. Push a periodic commit or update.

### 3. Supabase Returns HTTP 503 / Service Unavailable
- **Cause**: Inactivity pause triggered after 7 days without queries.
- **Fix**: Log into the Supabase dashboard and click **Restore Project**. Follow the steps in [`BACKUP_AND_RECOVERY.md`](file:///C:/Users/vinod/OneDrive/Desktop/language-learning/BACKUP_AND_RECOVERY.md).
