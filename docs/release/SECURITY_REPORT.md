# Lexilume — Security & Privacy Audit Report

> **Target Version:** Lexilume 2.0.0  
> **Repository:** `VINODH0101/language-learning`  
> **Status:** **VERIFIED SECURE** (Zero High/Critical Findings)

---

## 1. Threat Model & Security Principles

Lexilume operates under a local-first, zero-trust cloud architecture designed to safeguard student privacy and prevent unauthorized data tampering:
1. **Zero-Knowledge Architecture for Guests**: Unauthenticated guests operate 100% locally in IndexedDB/localStorage with zero cloud tracking.
2. **Strict RLS Isolation for Authenticated Learners**: Database queries are mediated by Supabase PostgreSQL Row Level Security (RLS) bound to `auth.uid()`.
3. **No Service-Role Key in Frontend**: Only public anon keys are shipped to client bundles; administrative operations require verified admin JWT claims.
4. **Zero-Paid AI Credential Exposure**: No proprietary paid API secrets exist in the client.

---

## 2. Row Level Security (RLS) Audit

Every database table across migrations `001_initial_schema.sql` through `010_database_persistence_and_sync_repair.sql` enforces active Row-Level Security:

| PostgreSQL Table | RLS Status | Read Policy | Write/Mutation Policy |
| :--- | :--- | :--- | :--- |
| `public.profiles` | ENABLED | `auth.uid() = id` | `auth.uid() = id` (or admin) |
| `public.courses` | ENABLED | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `public.user_progress` | ENABLED | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `public.saved_vocabulary` | ENABLED | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `public.srs_records` | ENABLED | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `public.exercise_submissions` | ENABLED | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `public.cultural_bookmarks` | ENABLED | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `public.diagnostic_results` | ENABLED | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `public.audit_logs` | ENABLED | Admin only (`role = 'admin'`) | System insert only |

Verification in `tests/test_auth_and_admin_migrations.py` and `tests/test_migration_010.py` proves that all tenant isolation constraints and policy syntax pass cleanly.

---

## 3. Secret & Credential Scanning

A full scan of frontend source code, production build output (`frontend/dist/`), and git tracking confirmed:
- **No `SUPABASE_SERVICE_ROLE_KEY`** is bundled or referenced in `frontend/src`.
- **No Hardcoded Paid LLM API Keys**: All AI provider integrations (`frontend/src/services/providers/geminiProvider.ts`) read strictly from runtime environment variables (`VITE_GEMINI_API_KEY`) or user settings, with mandatory deterministic pedagogical fallbacks when absent.
- **Git Tracking Cleanliness**: No `.env` or secret configuration files are tracked in version control.

---

## 4. Privacy & PII Scrubbing

### A. Telemetry & Analytics PII Scrubbing (`UmamiProvider`)
To adhere to strict educational privacy standards (GDPR / FERPA):
- Learner free-text inputs, writing submissions, and dictionary search queries are excluded from analytics events.
- Sensitive keys (`password`, `token`, `email`, `auth`, `authorization`, `source_text`, `essay`) are redacted before event dispatch.
- Tested and verified in `frontend/src/tests/lexilumeWorld/worldFeatures.test.tsx` (Suite 9: Umami Privacy Analytics & Sentry PII Scrubbing).

### B. Health Tracker Secret Sanitization (`ProviderHealthTracker`)
All network errors logged through `frontend/src/services/monitoring/providerHealth.ts` run through regex scrubbing:
- `api_key`, `token`, `secret`, and `Bearer` headers are replaced with `[REDACTED_SECRET]` and `[REDACTED_TOKEN]`.

---

## 5. Bot Defense & Turnstile Integration

- Cloudflare Turnstile bot detection widget (`frontend/src/components/common/TurnstileWidget.tsx`) protects registration, login, and writing evaluation endpoints.
- If network filtering or adblockers obstruct Turnstile script loading, the widget falls back gracefully to local test mode without crashing the UI.

---

## 6. Input Sanitization & Content Security

- **DOMPurify (`frontend/dist/assets/purify.es-*.js`)**: All rich reading passages (Wikipedia, Gutendex) are sanitized before rendering to eliminate XSS vectors.
- **Zod Schema Validation**: All external API payloads (MyMemory, Tatoeba, Open-Meteo, Nager.Date, Frankfurter) are validated against strict Zod schemas in `frontend/src/services/validation/schemas.ts` before ingestion.
