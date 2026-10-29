# Polyglot C1 Daily — Environment Variables Reference

This document catalogs all environment variables used by the backend learning engine, GitHub Actions scheduled runner, and React frontend.

---

## 1. Secrets Hierarchy & Security Rules

> [!CAUTION]
> **Privileged Credentials Rule**: `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, and `SMTP_PASSWORD` must NEVER be placed in client-side code, committed to Git, or exposed in public repositories. They are restricted exclusively to GitHub Actions Secrets and secure server environments.

> [!NOTE]
> Variables prefixed with `VITE_` are bundled into the public frontend single-page application and are readable by browser users. Only safe, public keys (such as `VITE_SUPABASE_ANON_KEY`) should carry this prefix.

---

## 2. Backend & Automation Variables (GitHub Actions / Server)

| Variable Name | Required | Default Value | Description | Sensitivity |
| :--- | :--- | :--- | :--- | :--- |
| `SUPABASE_URL` | Optional (falls back to memory) | `""` | Base URL of your Supabase project (e.g. `https://xyz.supabase.co`). | Low |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | `""` | Privileged service role secret key. Bypasses Row-Level Security for automated daily batch jobs. | **CRITICAL** |
| `RESEND_API_KEY` | Optional (if using Resend) | `""` | API key from Resend dashboard (`re_...`). | **HIGH** |
| `EMAIL_PROVIDER` | No | `"resend"` | Selected email delivery adapter: `"resend"`, `"smtp"`, or `"mock"`. | Low |
| `EMAIL_FROM_ADDRESS` | No | `"Polyglot C1 Daily <onboarding@resend.dev>"` | Verified sender email address header. | Low |
| `RECIPIENT_EMAIL` | No | `"learner@polyglot.dev"` | Default learner destination email address for daily digest emails. | Medium |
| `POLYGLOT_USER_ID` | No | `"default_learner"` | Learner ID identifier for batch operations. | Low |
| `POLYGLOT_SCHEDULE_TIMEZONE` | No | `"Asia/Kolkata"` | Learner's local timezone for date calculations. | Low |
| `SMTP_HOST` | If `EMAIL_PROVIDER=smtp` | `"smtp.gmail.com"` | Transactional SMTP server hostname. | Low |
| `SMTP_PORT` | If `EMAIL_PROVIDER=smtp` | `587` | Transactional SMTP port (usually 587 for STARTTLS). | Low |
| `SMTP_USERNAME` | If `EMAIL_PROVIDER=smtp` | `""` | SMTP authentication username / sender email. | Medium |
| `SMTP_PASSWORD` | If `EMAIL_PROVIDER=smtp` | `""` | SMTP app password or credential. | **HIGH** |

---

## 3. Frontend Variables (Cloudflare Pages / Vite)

| Variable Name | Required | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | No (runs offline if unset) | `""` | Public Supabase project URL for browser client connections. |
| `VITE_SUPABASE_ANON_KEY` | No (runs offline if unset) | `""` | Public anonymous key for querying public content and learner data under RLS. |

---

## 4. Local Development Template (`.env.example`)

To configure local testing, copy the following into a `.env` file (do NOT commit `.env` to version control):

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# Transactional Email (Resend)
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_1234567890abcdef
EMAIL_FROM_ADDRESS=Polyglot C1 Daily <onboarding@resend.dev>
RECIPIENT_EMAIL=your-email@example.com

# Schedule & Timezone
POLYGLOT_USER_ID=default_learner
POLYGLOT_SCHEDULE_TIMEZONE=Asia/Kolkata

# Frontend (Public)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```
