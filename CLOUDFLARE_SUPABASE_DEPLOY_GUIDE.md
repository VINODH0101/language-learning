# Lexilume — Step-by-Step Cloudflare Pages & Supabase Production Deployment Guide

> **Scope:** Fresh deployment starting from an **empty** Supabase project (zero tables, zero seeded rows) and Cloudflare Pages hosting, with zero-paid AI defaults and optional server-side LLM / email automation.

Because Lexilume intentionally ships **without static learning content fixtures**, an empty Supabase database starts cleanly with zero pre-loaded vocabulary, stories, or daily lessons. Following the steps below creates the full schema (`001`–`017`), configures security headers and API keys, boots your first admin account, and populates live AI/Open-API content safely.

---

## Architecture at a Glance

| Layer | Service | Purpose | Repo Source |
| :--- | :--- | :--- | :--- |
| **Frontend SPA** | Cloudflare Pages | React 19 + Vite + Dexie (IndexedDB offline store) | `frontend/` |
| **CSP & Permissions** | Cloudflare Pages Headers | HTTPS security headers, microphone (`SpeakingCoach`), Open API allowlist | `frontend/public/_headers` |
| **Database & Auth** | Supabase PostgreSQL + Auth | Schema, Row Level Security (RLS), signup triggers | `supabase/canonical/` & `supabase/migrations/` |
| **Automation & Batch** | GitHub Actions / CLI | Scheduled AI generation (`content_items` + review queue) & email digest | `.github/workflows/daily_polyglot.yml`, `scripts/` |
| **Optional HTTP API** | Python `http_server` (VPS/Render/Fly/Railway) | Optional REST endpoint (`VITE_CONTENT_API_BASE`) wrapping engine & discovery | `engine/api/http_server.py` |

---

## Step 1: Provision Supabase & Apply All Database Migrations

### 1.1 Create the Supabase Project
1. Sign in at **Supabase Dashboard** and click **New Project**.
2. Choose a project name (for example `lexilume-prod`), select the closest database region, and store your database password securely.
3. Wait until provisioning completes, then open **Project Settings → API** and record:
   - `Project URL` (`https://<your-project-ref>.supabase.co`)
   - `anon` `public` key (safe for browser / Cloudflare Pages `VITE_SUPABASE_ANON_KEY`)
   - `service_role` `secret` key (**server-side only** — never add to Cloudflare Pages or `frontend/.env`)

### 1.2 Execute Schema & Migrations in Exact Order (Empty Database)
Open **Supabase Dashboard → SQL Editor → New query** and run these **6 SQL files in exact order**:

1. **`supabase/canonical/001_canonical_baseline.sql`**
   Creates core tables (equivalent to migrations `001`–`012`): `licenses_and_sources`, `curriculum_nodes`, `vocabulary_items`, `grammar_rules`, `exercise_templates`, `curated_materials`, `user_profiles`, `user_roles`, `admin_audit_logs`, `user_courses`, `user_learning_tracks`, `srs_items`, `saved_translations`, `cultural_bookmarks`, `exercise_attempts`, `daily_lessons`, `lesson_assignments`, `email_deliveries`, `retention_cleanup_logs`, `daily_published_content`, RLS policies, quota functions, `public.is_admin()`, and the `auth.users` signup trigger `public.handle_new_user()`.
2. **`supabase/migrations/013_progress_and_activity_tracking.sql`**
   Adds `exercise_type` scoping to `exercise_attempts` and creates `learning_activity_events` with user-isolated RLS.
3. **`supabase/migrations/014_admin_operations_and_audit.sql`**
   Creates `content_review_items` and `admin_background_jobs` with admin/service-role RLS.
4. **`supabase/migrations/015_content_centred_architecture.sql`**
   Creates `content_sources`, `content_items`, `content_versions` (with immutability trigger), `learning_activities`, `learner_content_progress`, `user_saved_words`, `user_word_review_events`, `user_mistakes`, `content_processing_jobs`, `migration_exception_logs`, compatibility views, and `public.update_updated_at_column()`.
5. **`supabase/migrations/016_ai_platform_content_taxonomy.sql`**
   Adds the `content_type` column and index on `public.content_items`.
6. **`supabase/migrations/017_ai_platform_persistence.sql`**
   Extends `content_review_items` for unified AI drafts and creates `content_generation_schedules`, `content_generation_runs`, `content_generation_jobs`, `content_generation_attempts`, `content_prompt_templates`, `content_validation_reports`, `ai_provider_usage`, `discovery_sources`, `discovery_fetch_runs`, `discovery_items`, and `discovery_enrichments` (uses `public.update_updated_at_column()` from `015`).

*(Alternative if you prefer pure migration replay from zero: run every file in `supabase/migrations/001_*.sql` through `017_*.sql` sequentially without `001_canonical_baseline.sql`.)*

### 1.3 Verify Database Tables
Run this quick query in the Supabase SQL Editor to verify all tables exist:
```sql
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```
Confirm key tables appear: `user_profiles`, `user_roles`, `user_courses`, `user_learning_tracks`, `srs_items`, `daily_lessons`, `daily_published_content`, `learning_activity_events`, `content_review_items`, `content_items`, `content_versions`, `user_saved_words`, `user_mistakes`, `content_generation_jobs`, and `discovery_items`.

---

## Step 2: Configure Supabase Auth URLs

In **Supabase Dashboard → Authentication → URL Configuration**:
1. Set **Site URL** to your Cloudflare Pages URL, e.g.:
   `https://lexilume.pages.dev` (or your custom domain `https://your-domain.com`)
2. Under **Redirect URLs**, add:
   - `https://lexilume.pages.dev/**`
   - `https://*.lexilume.pages.dev/**` (for Cloudflare preview deployments, replacing with your Pages project slug)
   - Your custom domain (`https://your-domain.com/**`) if applicable
   - `http://localhost:5173/**` (for local testing)
3. Under **Authentication → Providers → Email**, decide whether email confirmation is enabled during initial setup (optional transactional SMTP can also be configured in **Project Settings → Authentication → SMTP Settings**).

---

## Step 3: API Keys & Environment Variables Matrix

> [!CAUTION]
> **Security Invariant:** Only `VITE_*` variables are bundled into browser JavaScript. **Never** put `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`, `ADMIN_API_TOKEN`, `SMTP_PASSWORD`, or `RESEND_API_KEY` into Cloudflare Pages client variables or `frontend/.env`.

### 3.1 Cloudflare Pages Environment Variables (Public Client Only)
Set these in **Cloudflare Dashboard → Workers & Pages → `<project>` → Settings → Environment variables** (Production & Preview):

| Variable | Required | Value | Purpose |
| :--- | :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Yes | `https://<project-ref>.supabase.co` | Connects frontend Auth, Postgres sync & published catalog reads |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase `anon` public key | Safe browser-side RLS-scoped database access |
| `VITE_CONTENT_API_BASE` | Optional | `https://<your-api-host>` | Only if hosting `engine/api/http_server.py` remotely; if set on another origin, also add that origin to `connect-src` in `frontend/public/_headers` |

### 3.2 Backend, CLI & GitHub Actions Secrets (Server-Side Only)
Add these in **GitHub → Repository → Settings → Secrets and variables → Actions** (and in your local root `.env` when running scripts locally — see `.env.example`):

| Variable | Required | Used By | Purpose |
| :--- | :--- | :--- | :--- |
| `SUPABASE_URL` | Yes | `scripts/*.py`, `http_server.py` | Server-side Supabase REST persistence |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | `scripts/*.py`, `http_server.py` | Bypasses RLS for admin bootstrap, draft queuing & batch runs |
| `GEMINI_API_KEY` | Optional | `run_content_generation.py`, `run_daily_batch.py`, `verify_connections.py` | Google Gemini AI generation; falls back cleanly to deterministic generator if omitted |
| `GEMINI_MODEL` | Optional | `run_daily_batch.py`, `verify_connections.py` | Default: `gemini-1.5-flash` |
| `GROQ_API_KEY` | Optional | `run_content_generation.py` | Groq provider (`llama-3.3-70b-versatile`) in `DefaultProviderRouter` |
| `DEEPSEEK_API_KEY` | Optional | `run_content_generation.py` | DeepSeek provider (`deepseek-chat`) in `DefaultProviderRouter` |
| `LIBRETRANSLATE_URL` / `LIBRETRANSLATE_API_KEY` | Optional | Translation provider | Optional self-hosted or hosted LibreTranslate endpoint |
| `EMAIL_PROVIDER` | Optional | `run_daily_batch.py` | `smtp`, `resend`, or `mock` (workflow defaults to `smtp`) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USERNAME` / `SMTP_PASSWORD` | If `smtp` | `run_daily_batch.py` | e.g., `smtp.gmail.com`, `587`, Gmail address, 16-char App Password |
| `RESEND_API_KEY` | If `resend` | `run_daily_batch.py` | Resend API key (`re_...`) |
| `EMAIL_FROM_ADDRESS` / `RECIPIENT_EMAIL` | Optional | `run_daily_batch.py` | Sender header and fallback recipient address |
| `ADMIN_API_TOKEN` / `CONTENT_API_CORS_ORIGIN` | Optional | `engine/api/http_server.py` | Bearer token for `POST /admin/*` endpoints & CORS origin (set to your `https://<project>.pages.dev` origin in production) |
| `GEN_SCHEDULES_JSON` | Optional | `run_content_generation.py` | Path to custom JSON schedule list |

### 3.3 No-Key Open APIs (Zero Credentials Needed)
These work automatically out of the box from browser/server without keys:
- **Lexicon & Definitions:** Wikipedia REST (`*.wikipedia.org`), Wiktionary REST & Kaikki (`*.wiktionary.org`, `kaikki.org`), Free Dictionary API (`api.dictionaryapi.dev`), Dicionário Aberto (`api.dicionario-aberto.net` / `dicionario-aberto.net`).
- **Examples & Proofreading:** Tatoeba (`tatoeba.org`, `audio.tatoeba.org`), LanguageTool public API (`api.languagetool.org` / `api.languagetoolplus.com`).
- **Translation Memory & Books:** MyMemory (`api.mymemory.translated.net`), Gutendex (`gutendex.com`), Open Library (`openlibrary.org`), Openverse (`api.openverse.engineering`).
- **Real-World Culture & Geography:** REST Countries (`restcountries.com`), Open-Meteo & Air Quality (`api.open-meteo.com`, `air-quality-api.open-meteo.com`), Nager.Date Holidays (`date.nager.at`), Frankfurter Exchange Rates (`api.frankfurter.app`), Jikan (`api.jikan.moe`).

> Note: `frontend/public/_headers` already allowlists these origins in `Content-Security-Policy` `connect-src` and enables `Permissions-Policy: microphone=(self)` for **Speaking Coach** voice practice.

---

## Step 4: Deploy Frontend to Cloudflare Pages

### Option A: Git Integration (Recommended)
1. Push your updated repository to GitHub.
2. Open **Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git**.
3. Select your repository and configure:
   - **Production branch:** `main` (or your active branch)
   - **Framework preset:** `Vite`
   - **Root directory:** `frontend`
   - **Build command:** `npm run build`
     *(Executes `tsc -b && vite build`, creates `dist/200.html` for SPA fallback routing, and removes legacy `_redirects`.)*
   - **Build output directory:** `dist`
4. Add `NODE_VERSION` = `20` (or `22`), plus `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Environment Variables.
5. Click **Save and Deploy**.

### Option B: Direct CLI Deploy (Wrangler)
```bash
npm --prefix frontend install
npm --prefix frontend run build
npx wrangler pages deploy frontend/dist --project-name=lexilume
```

---

## Step 5: Bootstrap First Admin & Populate Initial Content

Because your Supabase tables are completely empty right after schema setup, perform this one-time bootstrap:

### 5.1 Sign Up & Promote Your Admin User
1. Open your deployed Cloudflare Pages URL and **create an account** with your admin email (confirm the email if required by Supabase Auth). Signing up automatically invokes `handle_new_user()` to populate `public.user_profiles` and `public.user_roles` (`role = 'user'`).
2. From a terminal with Python dependencies installed (`pip install -r requirements.txt`) and root `.env` (or exported `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`), preview then promote the admin:
   ```bash
   python scripts/bootstrap_admin.py --email your-admin@example.com --dry-run
   python scripts/bootstrap_admin.py --email your-admin@example.com
   ```
3. Sign out and sign back in on the deployed site so your JWT/session loads the `admin` role for **Admin Workbench**.

### 5.2 Generate & Approve Initial AI Content
1. Populate AI Content Engine drafts into `content_items`, `content_versions` (unpublished drafts), and `content_review_items`:
   ```bash
   python scripts/run_content_generation.py
   ```
   - With `GEMINI_API_KEY`, `GROQ_API_KEY`, or `DEEPSEEK_API_KEY` set in `.env`, this uses the live LLM router; otherwise it uses the deterministic educational fallback cleanly.
   - Check stdout JSON: `persistence` must report `"supabase"` (when `SUPABASE_URL` & `SUPABASE_SERVICE_ROLE_KEY` are set) and `jobs_failed` should be `0`.
2. **Publish reviewed content:** Generated items enter the moderation queue as unpublished drafts by design.
   - If using **Admin Workbench** in the browser (or HTTP Admin API `POST /admin/reviews/<id>/approve`), review and approve drafts so `content_items.status` becomes `'published'` and `content_versions.is_published = true` (visible immediately across **Home**, **Learn**, **Vocabulary**, and **Practice**).
   - Also publish an initial Portuguese / Spanish / English poem and conversation from **Admin Workbench → Daily Studio** if you want featured items on **Home → Today's Edition**.

---

## Step 6: Verify & Run Automated Daily Workflows (GitHub Actions)

1. Verify every external API and credential from local terminal before scheduling:
   ```bash
   python scripts/verify_connections.py
   ```
   Confirm **Supabase** reports `[CONNECTED]`, external open APIs return HTTP `200`, and optional **Gemini** / **SMTP** keys report valid.
2. In **GitHub → Actions → Daily Lexilume Automation**, click **Run workflow** with `dry_run: true` first to verify pytest + connections + batch + content generation end-to-end without sending emails.
3. Once clean, daily automation runs automatically via `.github/workflows/daily_polyglot.yml` at `04:00 UTC` (`09:30 IST`).

---

## Step 7: Optional Remote HTTP API Server (`engine/api/http_server.py`)

Only needed if you want your Cloudflare Pages UI to call `POST /admin/generation/run` or `/content/*` + `/discovery/*` through `VITE_CONTENT_API_BASE` instead of reading directly via Supabase PostgREST + browser open API adapters:
1. Run on your Python host (Render, Railway, Fly.io, Cloud Run, etc.):
   ```bash
   python -m engine.api.http_server --host 0.0.0.0 --port 8080
   ```
2. Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_API_TOKEN`, `CONTENT_API_CORS_ORIGIN=https://<your-site>.pages.dev`, and any LLM keys (`GEMINI_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`) on that host.
3. Set `VITE_CONTENT_API_BASE=https://<your-api-host>` in Cloudflare Pages and add `https://<your-api-host>` to `connect-src` inside `frontend/public/_headers`, then rebuild and redeploy Cloudflare Pages.

---

## Troubleshooting Quick Checks

| Symptom | Likely Cause | Fix |
| :--- | :--- | :--- |
| App opens on Cloudflare Pages with empty content everywhere | Database is newly migrated or drafts not yet approved/published | Run `scripts/run_content_generation.py`, approve drafts in Admin Workbench / API, or verify `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` in Cloudflare Pages |
| Browser console shows `Refused to connect to ... Content Security Policy` | External host or custom `VITE_CONTENT_API_BASE` missing from `_headers` | Add the origin to `connect-src` in `frontend/public/_headers` and redeploy |
| `bootstrap_admin.py` says `No user found with email` | User hasn't signed up yet or `handle_new_user` trigger didn't run | Sign up once in the deployed app after running `001_canonical_baseline.sql`, then re-run `bootstrap_admin.py` |
| Supabase SQL Editor fails with `function update_updated_at_column() does not exist` on `017` | Skipped migration `015` | Run `013` → `014` → `015` → `016` → `017` sequentially |
| Auth redirect bounces to localhost after signup/login | Missing Cloudflare URL in Supabase Auth settings | Update **Site URL** and **Redirect URLs** under **Supabase → Authentication → URL Configuration** |
| Speaking Coach mic permission blocked on Cloudflare Pages | Old `Permissions-Policy: microphone=()` header | Ensure updated `frontend/public/_headers` (`microphone=(self)`) is deployed |
