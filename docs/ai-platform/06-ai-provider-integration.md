# 06 — AI Provider Integration

> Contracts in `engine/ai/provider.py`. Implemented adapters in `engine/ai/providers/`, registry in `engine/ai/registry.py`, router in `engine/ai/router.py`.

## 0. Implementation status (Phase 3)

| Provider | Status | Model(s) |
| :--- | :--- | :--- |
| Gemini | Implemented | `gemini-1.5-flash`, `gemini-1.5-pro` |
| Groq | Implemented | `llama-3.3-70b-versatile` |
| DeepSeek | Implemented | `deepseek-chat` |
| Cerebras | Deferred | — |
| Cloudflare Workers AI | Deferred | — |
| Hugging Face Inference | Deferred (experimental) | — |

Shared HTTP client (`engine/ai/providers/http.py`) classifies failures; `DefaultProviderRouter` provides priority/health/budget selection and fallback; usage is accounted in-memory (DB persistence lands in Phase 5).

## 1. Interface

`AIProvider` (ABC) — `provider_id`, `capability(model_id)`, `generate(request)`, `generate_structured(request, schema)`, `health_check()`, `get_usage(result)`.

Request/result models: `GenerationRequest`, `GenerationResult`, `ProviderUsage`, `CapabilityRecord`, `FailureCategory`.

## 2. Providers (target)

| Provider | Model (example) | Structured output | Notes |
| :--- | :--- | :--- | :--- |
| Gemini | `gemini-1.5-flash` / `gemini-1.5-pro` | `response_schema` | existing Python adapter dormant; activate behind fallback |
| Groq | Llama/Mixtral models | JSON mode (subset) | fast inference |
| DeepSeek | `deepseek-chat` | JSON mode | general fallback |
| Cerebras | Llama models | JSON (subset) | high throughput |
| Cloudflare Workers AI | Llama/Mistral | JSON (subset) | edge |
| Hugging Face Inference | varied | provider-dependent | experimental |

> Capabilities must be verified against current provider docs. If a model lacks strict schema support, use plain generation + local JSON-schema validation.

## 3. Router policy (configurable, not hardcoded)

- Primary generation: Gemini.
- Secondary: Groq.
- Additional fallback: DeepSeek.
- Alternative inference: Cerebras / Cloudflare Workers AI.
- Experimental: Hugging Face.

Routing inputs: task type, content type, required schema support, model availability, provider health, rate limits, remaining daily budget, configured priority, retry eligibility, capability match. Providers are never chosen randomly and never used if they cannot meet output requirements.

## 4. Fallback rules

- Request timeout.
- Exponential backoff retry.
- Rate-limit detection (429/`Retry-After`).
- Circuit breaker per provider.
- Health tracking.
- Max attempts per job.
- Per-provider daily token budget.
- Idempotency keys.
- Failure classification (`FailureCategory`).

If all providers fail: preserve the job, record reason, surface in Admin, allow manual retry, and **never** publish placeholder/fabricated content.

## 5. Configuration & secrets

Server-side environment variables only (`.env.example` placeholders):

```env
GEMINI_API_KEY=
GROQ_API_KEY=
DEEPSEEK_API_KEY=
CEREBRAS_API_KEY=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
HUGGINGFACE_API_KEY=
```

Never in: React source, `VITE_*`, localStorage, IndexedDB, DB config tables, logs, or generated docs.

## 6. Usage & audit

`ProviderUsage` records `provider_id`, `model_id`, `prompt_version`, `request_id`, prompt/completion tokens, `duration_ms`, `status`, `failure_category`. No chain-of-thought or hidden reasoning is stored.
