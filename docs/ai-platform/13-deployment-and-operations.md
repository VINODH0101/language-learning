# 13 — Deployment & Operations

> Entrypoints: `scripts/run_content_generation.py`, `engine/api/http_server.py`, and `.github/workflows/daily_polyglot.yml`.

## 1. Database Setup

Apply forward-only migrations in order:

1. `supabase/migrations/015_content_centred_architecture.sql`
2. `supabase/migrations/016_ai_platform_content_taxonomy.sql`
3. `supabase/migrations/017_ai_platform_persistence.sql`

## 2. Running the Generation Batch

- **Offline / Dry-Run** (no credentials required):
  ```bash
  python scripts/run_content_generation.py
  ```
  Outputs a JSON summary (`persistence: "in_memory"`) using `DeterministicContentFallback`.
- **Production / CI** (`.github/workflows/daily_polyglot.yml`):
  Configure `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and optional `GEMINI_API_KEY` / `GROQ_API_KEY` / `DEEPSEEK_API_KEY` as GitHub Secrets. Drafts are written to `content_review_items` (`status='pending'`) and never auto-published.

## 3. Running the HTTP Content & Admin API

```bash
python -m engine.api.http_server --host 127.0.0.1 --port 8080
```

Set `ADMIN_API_TOKEN` for `/api/admin/*` routes and point the frontend at the API via `VITE_CONTENT_API_BASE` (optional; frontend defaults to local-first mode when unset).
