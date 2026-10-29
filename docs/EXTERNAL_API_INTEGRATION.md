# Polyglot C1 Daily — External API Integration & Reorganized Learning Architecture

**Audit & Delivery Date:** 2026-10-30  
**Status:** Complete, Verified, and Tested  
**Test Pass Rate:** Vitest 132/132 tests (100%), Pytest 82/82 tests (100%), Production Build Clean  

---

## 1. Overview & Core Philosophy

Polyglot C1 Daily is a local-first, offline-capable language learning platform covering Portuguese, Spanish, and English across CEFR levels A1 through C1.

This implementation introduces a **Central External API Integration Layer** that decouples learning features from third-party provider implementations. The system adheres to strict architectural principles:
1. **Zero Runtime Paid AI Dependencies for Learners:** All client-side endpoints are open and public. No secret API keys or credit cards are required from learners.
2. **Server-Side Secret Isolation:** The Google Gemini API key (`GEMINI_API_KEY`) is exclusively utilized in server-side/pipeline environments (e.g. GitHub Actions, background generation scripts). It is never bundled, exposed, or transmitted to the browser.
3. **Local-First Resilience & Graceful Fallbacks:** Every external API adapter has an offline fallback mechanism (Dexie/IndexedDB persistent caching, in-memory caching, and curated seed corpora). If an external provider experiences downtime or the learner is disconnected, the app continues to operate without unhandled exceptions.
4. **Pedagogical Strictness & Decoupling:** Interface language (`en`, `pt`, `es`), target learning language, explanation language, and regional language varieties (`pt-BR`, `pt-PT`, `es-ES`, `es-419`, `en-US`, `en-GB`) remain strictly isolated.

---

## 2. Integrated APIs Specifications

| Provider / API | Endpoint | Rate Limit | Domain / Purpose | Local Fallback Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **1. Google Gemini API** | `generativelanguage.googleapis.com` (pipeline/server) | Server quota | Structured dialogue generation, reading passages, and lesson synthesis. | Deterministic pedagogical templates and local curriculum library. Zero client key required. |
| **2. MyMemory Translation API** | `https://api.mymemory.translated.net/get` | 10 req/sec, ephemeral quota tokens | Multi-pair translation fallback between Portuguese, Spanish, and English. | Verified educational trilingual dictionary (`trilingualDictionary`) and high-frequency seed vocab. |
| **3. Jikan Anime & Culture API** | `https://api.jikan.moe/v4` | Strict 3 req/sec (token bucket) | Cultural character profiles, biographical reading passages, and pedagogical glossaries. | Curated offline cultural narrative profiles and seed reading passages. |
| **4. Wikimedia REST API** | `https://{lang}.wikipedia.org/api/rest_v1` | 20 req/sec | Authentic daily reading comprehension (`onthisday` feed & article summaries in PT, ES, EN). | Curated cultural catalog (`CULTURAL_CATALOG` in `cultureData.ts`) with CEFR level tagging. |
| **5. Free Dictionary API** | `https://api.dictionaryapi.dev/api/v2/entries/en/{word}` | 10 req/sec | English lexical definitions, IPA phonetics, and native audio pronunciation. | Curated English vocabulary (`enVocabulary` in `seedData.ts`) + Web Speech synthesis. |
| **6. Dicionário Aberto API** | `https://api.dicionario-aberto.net/word/{word}` | 10 req/sec | Authentic Portuguese definitions, grammatical categorizations, and classical etymology. | Curated Portuguese vocabulary (`ptVocabulary` in `seedData.ts`) and trilingual dictionary. |
| **7. LanguageTool HTTP API** | `https://api.languagetool.org/v2/check` | 5 req/sec | Interactive writing proofreading, grammar corrections, spelling check, character offsets. | Local heuristic rules (false friend detection, consecutive duplicate words, capitalization). |

---

## 3. Central Integration Architecture

The integration layer resides under `frontend/src/integrations/external-apis/`:

```text
frontend/src/integrations/external-apis/
├── core/
│   ├── types.ts              # Domain interfaces, normalized models, metrics types
│   ├── ApiError.ts           # Hierarchical errors: NetworkError, RateLimitError, QuotaExceededError, etc.
│   ├── RateLimitManager.ts   # Token bucket & delayed throttle manager (supports Jikan 3 req/s)
│   ├── RetryPolicy.ts        # Exponential backoff with jitter and non-retryable status filtering
│   ├── ApiCache.ts           # IndexedDB / Dexie v3 persistent cache with memory fallback
│   ├── ApiProvider.ts        # Abstract BaseApiProvider<TInput, TOutput> with full execution lifecycle
│   ├── ApiRegistry.ts        # Central singleton provider registry and health tracker
│   └── index.ts
├── adapters/
│   ├── mymemory/MyMemoryAdapter.ts
│   ├── free-dictionary/FreeDictionaryAdapter.ts
│   ├── dicionario-aberto/DicionarioAbertoAdapter.ts
│   ├── wikipedia/WikipediaAdapter.ts
│   ├── jikan/JikanAdapter.ts
│   ├── languagetool/LanguageToolAdapter.ts
│   ├── gemini/GeminiAdapter.ts
│   └── index.ts              # Central registration bootstrap
└── index.ts
```

### Execution Lifecycle in `BaseApiProvider`
Each API request flows through a standardized 7-step pipeline:
1. **Input Validation:** Enforces parameter types, character limits, and language pair constraints.
2. **Persistent Cache Lookup:** Checks Dexie/IndexedDB (`apiCache` table) and in-memory caches before making network requests.
3. **Rate Limiting:** Managed via `RateLimitManager` using token-bucket and queue scheduling to prevent 429 upstream rate limit rejections.
4. **Retry with Exponential Backoff:** Transient network errors and 503/429 responses trigger jittered exponential retries via `RetryPolicy`. Fatal 400/404 errors fail immediately.
5. **Response Normalization:** Transforms vendor-specific JSON/XML into normalized domain models (`NormalizedTranslationResult`, `NormalizedDictionaryEntry`, `NormalizedReadingArticle`, `NormalizedProofreadResult`).
6. **Cache Storage:** Successful results are stored with provider-specific TTLs (e.g. 7 days for dictionaries, 24 hours for Wikipedia feeds).
7. **Graceful Fallback:** If remote calls fail, the provider invokes its local `getFallback` implementation to ensure seamless learner continuity.

---

## 4. Reorganized UI Experience — Five Learning Pillars

The application UI experience has been restructured into five coherent learning pillars while preserving 100% of existing functionality:

### Pillar 1: Daily Learning (`/dashboard`, `/portuguese`, `/spanish`, `/english`)
- Daily lesson dashboard with personalized streak tracking.
- Immersive CEFR A1–C1 tracks for Portuguese (🇵🇹), Spanish (🇪🇸), and English (🇬🇧).
- Line-by-line translations: English translation for PT/ES courses, and dual PT & ES translations for English courses.

### Pillar 2: Explore & Read (`/explore`)
- **Catálogo Curado:** Multilingual cultural library with multi-dimensional filtering (Country, Region, Language, CEFR Level, Topic).
- **Wikipedia Autêntica:** Dynamic reading comprehension feed powered by Wikimedia REST API (PT, ES, EN) with CEFR level estimation and in-app reader modal.
- **Cultura & Narrativas:** Jikan/MyAnimeList cultural explorer with character biographies, Japanese titles, and pedagogical glossaries.
- **Favoritos Salvos:** IndexedDB-persisted article bookmarks.

### Pillar 3: Vocabulary & Dictionary (`/vocabulary`, `/translate`)
- **Dicionário Aberto & Free Dict:** Live lexical lookup bar integrating Free Dictionary API for English (with IPA and audio playback) and Dicionário Aberto for Portuguese (with grammatical categorizations and etymology).
- **Vocabulário Top 200 & Frases do Cotidiano:** Frequency-ranked vocabulary with audio and PDF study pack export.
- **Trilingual Dictionary & MyMemory:** Bilingual translator with verified cognate warnings and fallback translation memory.

### Pillar 4: Practice & Improve (`/practice`)
- **Estúdio de Revisão Gramatical:** Interactive writing studio powered by LanguageTool HTTP API with inline character offset detection, error classification, and one-click replacement suggestions.
- **Recordação Espaçada (SM-2):** Algorithmic flashcard review queue based on user performance.
- **Múltipla Escolha & Lacunas:** Deterministic grammar quizzes with targeted pedagogical distractor feedback.
- **Caderno de Erros & Falsos Cognatos:** Dedicated interference training to prevent cross-language transfer mistakes.

### Pillar 5: My Learning (`/progress`)
- Real computed statistics (zero fabricated metrics).
- CEFR diagnostic placement assessments.
- Algorithmic SM-2 retention curves and mastery states.
- **Painel de APIs Externas & Cache Offline:** Live transparency table displaying provider health status, request counts, average latency, and Dexie persistent cache item count with one-click cache clearing.

---

## 5. Automated Verification Results

All tests pass cleanly:
```bash
# Frontend Unit & Integration Tests (19 test suites, 132 tests)
npm --prefix frontend test -- --run
# Test Files  19 passed (19)
# Tests       132 passed (132)

# Backend Python Engine Tests (82 tests)
python -m pytest
# ============================= 82 passed in 0.92s ==============================

# Frontend Production Build (TypeScript & Vite)
npm --prefix frontend run build
# ✓ 2363 modules transformed.
# ✓ built in 7.71s with 0 errors
```
