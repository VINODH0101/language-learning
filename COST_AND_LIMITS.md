# Polyglot C1 Daily — Free-Tier Cost & Limits Audit

**Audit Date**: October 2026  
**Stack**: Supabase PostgreSQL + Cloudflare Pages + GitHub Actions + Resend / SMTP  
**Overall Cost**: **$0.00 / month (100% Free-Tier Architecture)**

---

## 1. Provider Free-Tier Limits & Verified Constraints

| Provider | Service / Resource | Published Free Tier Allowance | Polyglot C1 Daily Consumption (1–10 Learners) | Utilization % | Critical Policy & Mitigation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Supabase** | PostgreSQL Database | 500 MB database storage, 50k MAUs, 2 active projects. | ~15 MB initial; ~0.2 MB/month growth with retention pruning. | **~3%** | **7-Day Inactivity Pause**: Pauses after 7 days without SQL queries. *Mitigation*: Daily automated GitHub Actions job queries the database daily. Documented manual unpause in [`BACKUP_AND_RECOVERY.md`](file:///C:/Users/vinod/OneDrive/Desktop/language-learning/BACKUP_AND_RECOVERY.md). |
| **GitHub Actions** | Automation & Runner | 2,000 Linux runner minutes/month (Private repos); Unlimited on Public. | ~1.5 min/day $\times$ 30 days = ~45 minutes/month. | **~2.2%** | **60-Day Workflow Pause**: Suspends cron jobs if no repository commits occur for 60 days. *Mitigation*: 1-click re-enable banner in Actions tab. |
| **Cloudflare Pages** | Static SPA Hosting | Unlimited bandwidth, 500 builds/month, free SSL. | ~5–10 builds/month during updates. | **~1%** | Single concurrent build limit. Fully adequate for static SPA deployment. |
| **Resend** | Transactional Email | 100 emails/day, 3,000 emails/month. | 1 email/day (personal learner) or up to 10/day (small group). | **~1–10%** | **Domain Restriction**: Default `onboarding@resend.dev` only delivers to the Resend account owner's email address. To deliver to arbitrary addresses, verify a custom domain OR use the included `SmtpAdapter` (e.g. Gmail App Password). |
| **Web Speech API** | Spoken Audio & TTS | Unlimited (runs natively in user's web browser). | 0 server requests / 0 bandwidth cost. | **0%** | Device voice availability depends on user browser/OS. Native Tatoeba MP3 clips provided as deterministic fallbacks. |
| **Tatoeba / Wiktionary** | Linguistic Data | Open educational access (CC-BY). | Cached locally after initial import. | **0%** | Polite crawling limits (1 req/s). Local fixtures eliminate runtime dependency. |

---

## 2. Monthly Usage & Growth Projections

### Estimated Data Volume per Learner (1 Year):
- **User Track & Profile State**: ~2 KB
- **Completed Objectives Log**: ~10 KB
- **Spaced Repetition (SRS) Items (~1,500 words)**: ~180 KB
- **Exercise Attempt Records**: ~400 KB
- **Email Delivery Ledger (365 records)**: ~90 KB
- **Total Essential Storage per Learner/Year**: **< 1.0 MB**

With 500 MB of free storage on Supabase, a personal or small-group deployment can operate for **decades** before reaching storage boundaries.

---

## 3. Policy Changes & Risk Disclosure

1. **No Perpetual Guarantee**: External providers may modify their free-tier policies in the future.
2. **Mitigation**: The system is designed with zero proprietary vendor lock-in:
   - Database is standard PostgreSQL (can be migrated to any VPS, Docker, or SQLite in minutes).
   - Email uses pluggable adapters (`ResendAdapter`, `SmtpAdapter`, `MockEmailAdapter`).
   - Learning engine runs on standard, open-source Python 3.12 without paid AI APIs.
