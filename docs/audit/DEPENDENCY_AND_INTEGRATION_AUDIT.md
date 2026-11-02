# Lexilume — Dependency, Third-Party Service & Integration Audit

> **Target Standard:** Rule 1 & Rule 9 — *Zero-Paid AI Mandate. Never introduce mandatory paid LLM APIs, recurring translation subscriptions, or proprietary external AI services. The application must function reliably using open educational datasets and deterministic synthesis engines. Optional Gemini API integration must always have full deterministic fallbacks.*

---

## 1. External API Integration Registry

All external integrations are routed through `frontend/src/integrations/external-apis/` with rate limiting, circuit breakers, offline fallbacks, and in-memory/Dexie caching:

| Provider / API Name | Purpose | Network Endpoint | Cost / Quota | Offline / Failure Behavior | Security & Privacy Scrubber |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Wiktionary Adapter** | Monolingual definitions & etymology | `https://en.wiktionary.org/api/rest_v1/` | Free / Open (CC-BY-SA 3.0) | Falls back to local curated dictionary in `seedData.ts` | Strips URLs & session tokens |
| **Tatoeba Adapter** | Authentic bilingual example sentences & audio | `https://tatoeba.org/en/api_v0/` | Free / Open (CC-BY 2.0 FR) | Cascades to `sentencesData.ts` offline corpus | No PII transmitted |
| **Wikipedia Adapter** | Real-world reading passages & culture | `https://*.wikipedia.org/api/rest_v1/` | Free / Open (CC-BY-SA 4.0) | Falls back to curated reading passages in `curatedMaterials` | Excludes dynamic user identifiers |
| **MyMemory Adapter** | Machine translation cascade | `https://api.mymemory.translated.net/get` | Free tier (1,000 words/day) | Auto-falls back to trilingual offline dictionary (`translationData.ts`) | Scrubbed of learner email & names |
| **Google Gemini (Optional)** | Contextual dialogue & grammar synthesis | `https://generativelanguage.googleapis.com/v1beta/` | Optional (User API key) | **100% deterministic offline fallback** generates complete valid lesson structures | Client-side only; keys kept in localStorage |
| **Open-Meteo** | Real-world weather & European AQI | `https://api.open-meteo.com/v1/forecast` | Free / Non-commercial | Falls back to static seasonal weather fixtures | Coordinates truncated to 1 decimal place |
| **REST Countries** | Cultural & geopolitical metadata | `https://restcountries.com/v3.1/` | Free / Public Domain | Returns offline fixture with 12 multilingual capitals | No user data sent |
| **Frankfurter** | Currency reference rates (ECB data) | `https://api.frankfurter.app/` | Free / Open | Falls back to reference ECB rate matrix | None |
| **Umami Analytics** | Privacy-first self-hosted analytics | Local proxy / script tag | Zero tracking cookies | No-op when offline or unconfigured; logs in DEV mode | Zero PII; anonymized event tokens |

---

## 2. Frontend Dependency Analysis (`frontend/package.json`)

```
================================================================================
PACKAGE                       VERSION     SIZE (kB)   PURPOSE             EVALUATION
================================================================================
react / react-dom             ^19.3.1         148.0   Core Component UI   Essential
@supabase/supabase-js         ^2.118.0        151.4   Auth & Database     Essential
dexie                         ^4.4.7           89.2   Local IndexedDB     Essential (Local-first)
i18next / react-i18next       ^26.5.12         76.4   Multilingual i18n   Essential
lucide-react                  ^1.64.0          84.0   Tree-shaken icons   Essential
sonner                        ^2.0.8           18.5   Toasts / Alerts     Essential
tailwindcss / @tailwindcss/vite ^4.3.3         106.9   Vite CSS engine     Essential
minisearch                    ^7.2.0           28.0   Lexical search      Essential
tesseract.js                  ^7.0.0          210.0   Client-side OCR     Essential (Content Studio)
jspdf                         ^4.2.1          180.0   Study Pack Export   Essential
leaflet / @types/leaflet      ^1.9.4          148.6   Geographic Maps     Heavyweight (Candidate for lazy loading)
zod                           ^4.6.7           54.0   Schema validation   Essential
--------------------------------------------------------------------------------
TOTAL FRONTEND BUNDLE (GZIPPED)               714.7 kB (Builds in 9.44s)
================================================================================
```

---

## 3. Python Engine Dependency Analysis (`requirements.txt`)

```
pydantic>=2.0.0      # Canonical schema validation and Pydantic v2 serialization
supabase>=2.0.0      # Supabase Python client for batch migrations and repository writes
pytest>=7.0.0        # Pytest engine test framework
pytest-asyncio       # Asynchronous fixture execution
httpx>=0.24.0        # Non-blocking async client for Gemini discovery and external sources
requests>=2.28.0     # Synchronous HTTP fallback
python-dotenv>=1.0.0 # Secure environment variable loading without hardcoded credentials
```

---

## 4. Rate Limiting, Privacy & Circuit Breaker Architecture

Implemented in `frontend/src/integrations/external-apis/core/`:
- **`ApiRateLimiter.ts`**: Token-bucket algorithm enforcing provider-specific queries-per-minute limits.
- **`CircuitBreaker.ts`**: Fails fast after 3 consecutive network failures, switching automatically to local offline fixtures for 60 seconds before probing again.
- **`PrivacyScrubber.ts`**: Strips email addresses, auth tokens, machine paths, and IP addresses prior to dispatching queries to external providers.
- **`CacheManager.ts`**: Stores successful API responses in Dexie (`apiCache` table) with TTL expiration (24h for dictionary/weather; 7 days for Wikipedia articles).
