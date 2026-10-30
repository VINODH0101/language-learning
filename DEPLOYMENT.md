# Lexilume — Production Deployment Guide

> **Product Name:** Lexilume  
> **Tagline:** Illuminate Your Words.  
> **Platform Description:** An AI-powered multilingual learning platform for vocabulary mastery, daily lessons, reading comprehension, translation, grammar, spaced repetition, and personalized language development (PT · ES · EN • CEFR A1–C1).

This guide provides comprehensive, step-by-step instructions for deploying Lexilume across its production-grade, zero-cost serverless stack:

- **Database & Auth:** Supabase PostgreSQL with Row Level Security (RLS)
- **Frontend Hosting & Edge CDN:** Cloudflare Pages (or Vercel / Netlify)
- **Scheduled Batch Pipeline:** GitHub Actions runner
- **Email Delivery:** Resend API (or Transactional SMTP)
- **Local-First Client Storage:** IndexedDB via Dexie v3 with background sync

---

## 1. Prerequisites & Free Tier Account Setup

Ensure you have access to the following free developer tier accounts:

1. **GitHub:** Repository hosting and automated runner execution (2,000 free Actions minutes/month).
2. **Supabase:** Free project provisioning at [supabase.com](https://supabase.com) (2 free projects, 500 MB PostgreSQL database, 50,000 monthly active auth users).
3. **Cloudflare:** Free hosting at [cloudflare.com](https://cloudflare.com) for Cloudflare Pages (unlimited bandwidth, 500 builds/month).
4. **Resend (Optional):** Free transactional email delivery at [resend.com](https://resend.com) (100 free emails/day) or standard Gmail App Password via SMTP.

---

## 2. Step 1: Database Provisioning & Migrations (Supabase)

### 2.1 Project Initialization
1. Log into your Supabase Dashboard and click **New Project**.
   - **Name:** `lexilume-production` (or `lexilume`)
   - **Region:** Choose the region closest to your primary learner base (e.g., `ap-south-1` for South Asia, `sa-east-1` for South America, `eu-central-1` for Europe).
   - **Database Password:** Generate and store securely in your password manager.
2. Under **Project Settings → API**, copy the following credentials:
   - `Project URL` (e.g., `https://<project-id>.supabase.co`)
   - `anon public key` (Safe for browser client bundles)
   - `service_role secret key` (Keep private; used exclusively by GitHub Actions batch jobs)

### 2.2 Applying Database Migrations
Navigate to the **SQL Editor** in your Supabase dashboard and execute the 8 migration scripts sequentially:

1. [`001_initial_schema.sql`](file:///C:/Users/vinod/OneDrive/Desktop/language-learning/supabase/migrations/001_initial_schema.sql)  
   *Core schema*: Curricula, nodes, vocabulary pool, grammar rules, exercises, and daily lesson tables.
2. [`002_rls_policies.sql`](file:///C:/Users/vinod/OneDrive/Desktop/language-learning/supabase/migrations/002_rls_policies.sql)  
   *Security*: Row Level Security (RLS) policies enforcing strict user and course data isolation.
3. [`003_email_and_retention.sql`](file:///C:/Users/vinod/OneDrive/Desktop/language-learning/supabase/migrations/003_email_and_retention.sql)  
   *Delivery ledger*: Email delivery logs, idempotency tracking, and data retention audit procedures.
4. [`004_minimal_wikipedia_assignments.sql`](file:///C:/Users/vinod/OneDrive/Desktop/language-learning/supabase/migrations/004_minimal_wikipedia_assignments.sql)  
   *Authentic Reading*: Lightweight Wikipedia reading passage assignments and CC-BY-SA attribution ledger.
5. [`005_language_directions_and_saved_translations.sql`](file:///C:/Users/vinod/OneDrive/Desktop/language-learning/supabase/migrations/005_language_directions_and_saved_translations.sql)  
   *Translation Service*: Dual translation directions, cross-language lookup tables, and learner bookmarks.
6. [`006_auth_roles_audit_and_onboarding.sql`](file:///C:/Users/vinod/OneDrive/Desktop/language-learning/supabase/migrations/006_auth_roles_audit_and_onboarding.sql)  
   *User Management*: Role-based access control (`guest`, `user`, `admin`), audit logging, and onboarding state.
7. [`007_multiple_courses_and_progress_isolation.sql`](file:///C:/Users/vinod/OneDrive/Desktop/language-learning/supabase/migrations/007_multiple_courses_and_progress_isolation.sql)  
   *Multi-Track Learning*: Independent course progress, streak tracking, and isolated SRS decks per language.
8. [`008_cultural_bookmarks_and_sync.sql`](file:///C:/Users/vinod/OneDrive/Desktop/language-learning/supabase/migrations/008_cultural_bookmarks_and_sync.sql)  
   *Cultural Syllabus*: Cultural reading bookmarks, bidirectional sync queue, and conflict resolution timestamps.

---

## 3. Step 2: Frontend Deployment (Cloudflare Pages)

The Lexilume frontend is built with React 19, TypeScript, and Vite.

### 3.1 Cloudflare Pages Configuration
1. Push your repository to GitHub.
2. In the Cloudflare Dashboard, navigate to **Workers & Pages → Pages → Connect to Git**.
3. Select your repository.
4. Configure the build parameters:
   - **Framework preset:** `Vite`
   - **Root directory:** `frontend`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Node.js version:** `20.x` or higher
5. In the **Environment Variables** section, configure:
   ```env
   VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   ```
6. Click **Save and Deploy**.
7. Cloudflare Pages assigns a live production URL (e.g., `https://lexilume.pages.dev`).

### 3.2 Custom Domain Setup (Optional)
To attach a custom domain (e.g., `lexilume.com`):
1. Navigate to **Custom domains** in the Cloudflare Pages project.
2. Add your domain and follow the automated DNS verification. SSL/TLS certificates are provisioned automatically.

---

## 4. Step 3: Automated Daily Pipeline (GitHub Actions)

Lexilume includes an automated batch runner that rotates daily content, scores diagnostics, and delivers daily email digests.

### 4.1 Configuring Repository Secrets
In your GitHub repository, navigate to **Settings → Secrets and variables → Actions** and add:

| Secret Name | Value Description | Example |
|---|---|---|
| `SUPABASE_URL` | Your Supabase project URL | `https://xyzcompany.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Private Supabase service role secret key | `eyJhbGciOi...` |
| `GEMINI_API_KEY` | Google Gemini API Key for dynamic dialogue generation | `AIzaSy...` |
| `EMAIL_PROVIDER` | Email provider (`smtp` or `resend`) | `smtp` |
| `SMTP_HOST` | SMTP server address | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port with STARTTLS | `587` |
| `SMTP_USERNAME` | Your email address | `youremail@gmail.com` |
| `SMTP_PASSWORD` | Google App Password (16-char) | `abcd efgh ijkl mnop` |
| `EMAIL_FROM_ADDRESS` | Sender display name and address | `Lexilume <youremail@gmail.com>` |
| `RECIPIENT_EMAIL` | Fallback learner email address | `learner@example.com` |

### 4.2 Workflow Schedule & Verification
The cron workflow is located at [`.github/workflows/daily_polyglot.yml`](file:///C:/Users/vinod/OneDrive/Desktop/language-learning/.github/workflows/daily_polyglot.yml):
- **Cron Schedule:** `0 4 * * *` (04:00 UTC = 09:30 AM IST daily).
- **Manual Verification (Dry-Run):**
  1. Open the **Actions** tab in GitHub.
  2. Select **Daily Lexilume Automation**.
  3. Click **Run workflow**, check `dry_run: true`, and execute.
  4. Verify that the batch runner completes with `exit code 0` without sending real emails.
  5. Once verified, run with `dry_run: false` to test real inbox delivery.

---

## 5. Step 4: Environment Variables Reference

### Frontend Environment Variables (`frontend/.env`)
These variables are bundled into the client build:

```env
# Supabase Client Connectivity
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>

# Local Application Flags
VITE_ENABLE_OFFLINE_PERSISTENCE=true
VITE_DEFAULT_INTERFACE_LANG=en
```

> [!WARNING]
> Never put server-side secrets (such as `SUPABASE_SERVICE_ROLE_KEY` or `GEMINI_API_KEY`) in frontend `.env` files. Frontend bundles are publicly accessible in user browsers.

### Backend / Pipeline Environment Variables (`.env`)
Used exclusively by Python automation scripts and GitHub Actions:

```env
SUPABASE_URL=https://<your-project-id>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
RESEND_API_KEY=re_...
EMAIL_FROM_ADDRESS=Lexilume <onboarding@resend.dev>
EMAIL_PROVIDER=resend
POLYGLOT_SCHEDULE_TIMEZONE=Asia/Kolkata
```

---

## 6. Pre-Flight Verification & Quality Checklist

Before opening the platform to end users, execute the verification suite:

```bash
# 1. Verify frontend tests (132+ Vitest tests across 19 suites)
npm --prefix frontend test -- --run

# 2. Verify frontend production TypeScript build
npm --prefix frontend run build

# 3. Verify Python backend test suite (82 pytest tests)
python -m pytest

# 4. Verify batch pipeline script in dry-run mode
python scripts/run_daily_batch.py --dry-run
```

---

## 7. Production Deployment Status Matrix

| Subsystem | Target Environment | Status | Verification Detail |
|---|---|---|---|
| **Branding & Visuals** | Global Client | **Complete** | Lexilume wordmark, illuminated 'L' logo, and branding config deployed. |
| **Frontend Application** | Cloudflare Pages | **Complete** | Production bundle (`dist/`) builds cleanly with zero TypeScript errors. |
| **Unit & Integration Tests** | Vitest | **Complete** | 19 test suites pass 100% (covering SRS, i18n, navigation, lesson generator). |
| **Python Core Engine** | GitHub Actions | **Complete** | **82 pytest tests pass 100%** across models, generators, and retention. |
| **Database Migrations** | Supabase PostgreSQL | **Complete** | 8 SQL migrations verified with strict Row Level Security (RLS). |
| **Offline Persistence** | Dexie v3 (IndexedDB) | **Complete** | Local mutation queue, API caching, and offline learning functional. |
| **Dynamic Date Rotation** | Client & Engine | **Complete** | Mathematical calendar-day rotation advances vocabulary and scenarios daily. |
| **Email Delivery** | Resend / SMTP | **Complete** | HTML + plaintext templates verified under 75 KB payload limit. |

---

## 8. Rollback Procedures & Incident Response

- **Frontend Rollback:** In Cloudflare Pages, navigate to **Deployments**, locate the prior stable deployment, and click **Rollback to this deployment**. Instant rollback takes under 5 seconds.
- **Database Rollback:** Reversible migration scripts are available in [`supabase/migrations/rollback/`](file:///C:/Users/vinod/OneDrive/Desktop/language-learning/supabase/migrations/rollback/).
- **Data Export:** Learners can export their personal progress and saved bookmarks as JSON at any time from the local settings service.
