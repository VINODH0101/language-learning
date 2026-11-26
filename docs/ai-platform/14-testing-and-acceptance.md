# 14 — Testing & Acceptance

## 1. Verification Commands

```bash
# Python Engine, Persistence, HTTP API & Migration Tests
python -m pytest tests/ -v

# Offline Batch Runner Smoke Check
python scripts/run_content_generation.py

# Frontend TypeScript & Vite Production Build
npm --prefix frontend run build

# Frontend Unit & Integration Tests (Vitest)
npm --prefix frontend test
```

## 2. Acceptance Criteria

1. **All 8 content types** (`story`, `conversation`, `poetry`, `grammar`, `vocabulary`, `academic_essay`, `cultural_article`, `practice`) generate schema-valid drafts offline and via provider mocks (`tests/test_content_generation.py`).
2. **Linguistic decoupling**: target language, explanation language, and CEFR level are injected by the engine and preserved end-to-end (`engine/ai/generation.py`, `frontend/src/services/contentAccess.ts`).
3. **Provider resilience**: rate limits and timeouts trigger cooldown/fallback across Gemini, Groq, DeepSeek, and deterministic fallback without fabricating content (`tests/test_ai_providers.py`).
4. **Draft-first publication gate**: generated drafts enter `content_review_items` and remain hidden from `/api/content*` until an admin approves them (`tests/test_ai_supabase_persistence.py`, `tests/test_http_api.py`, `tests/test_ai_e2e_flow.py`).
5. **No client secrets**: zero provider API keys appear in React code, `VITE_*`, or `localStorage`.
