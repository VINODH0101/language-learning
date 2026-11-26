# Lexilume — Phase 6 Cleanup Audit & Baseline Report

> **Repository:** `VINODH0101/language-learning` (Lexilume — Illuminate Your Words)  
> **Production Application:** `https://lexi.monster`  
> **Branch:** `phase-6-safe-cleanup`  
> **Baseline Commit:** `954edca` (docs(architecture): complete Phase 5 database design, data mapping, and safe migration plan)  
> **Current Phase:** Phase 6 — Safe Cleanup, Refactoring & Legacy Code Control  
> **Primary Objective:** Reduce unnecessary complexity, remove verified dead code, consolidate duplicate implementations where safe, and improve maintainability without breaking the existing application or losing user data.

---

## 1. Initial Repository Baseline

### 1.1 Baseline System State

Before initiating code cleanup, the active repository was inspected and verified against the standard verification suite:

| Area | Project Command | Exit Code | Verified CLI Result | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend Unit Tests** | `npm --prefix frontend test` | `0` | **37 test files passed, 310 tests passed (60.23s)** | Vitest v5.0.5; all unit & integration suites green. |
| **Frontend Production Build** | `npm --prefix frontend run build` | `0` | **2,775 modules transformed (18.16s)** | `tsc -b` typecheck clean; Vite v8.3.5 bundle emitted. |
| **Python Engine Tests** | `python -m pytest tests/ -v` | `0` | **106 passed, 1 skipped (3.25s)** | Live Gemini test skipped safely (offline invariant). |
| **Type Checking** | `tsc -b` (via `npm run build`) | `0` | **Pass (0 TypeScript errors)** | Strict compiler validation passing. |
| **Frontend Linting** | `npm --prefix frontend run lint` | `0` | **Pass (426 warnings, 0 errors in 442ms)** | Oxlint v1.89.0 static scan. |

---

## 2. Exhaustive Baseline Architecture Mapping (14 Points)

### 2.1 Current Git Branch & Commit
- **Branch:** `phase-6-safe-cleanup` (dedicated branch branched directly from `main`).
- **Baseline Commit:** `954edca463e236ce22588c8f0dbcfc457d383925`.
- **Working Tree:** Pristine before cleanup commencement.

### 2.2 Working Tree Status
- Zero unstaged modifications.
- Local tracking branch aligned with upstream state.

### 2.3 Repository Directory Structure
```
language-learning/
├── .github/
│   └── workflows/
│       └── daily_polyglot.yml         # GitHub Actions daily batch automation (04:00 UTC)
├── artifacts/                         # Generated repository inventories & audit matrices
├── docs/
│   ├── architecture/                  # Phases 3, 4, 5 architecture & database designs
│   ├── audit/                         # Phases 1 & 2 comprehensive dependency & usage reports
│   └── cleanup/                       # Phase 6 safe cleanup deliverables (this directory)
├── engine/                            # Python pedagogical lesson generator & SRS engine
│   ├── curriculum/                    # CEFR syllabus & taxonomy nodes
│   ├── diagnostic/                    # CEFR placement test logic
│   ├── email/                         # Resend & SMTP delivery adapters
│   ├── exercises/                     # Exercise checkers, normalizers, distractors
│   ├── generators/                    # Deterministic templates, Gemini fallback, validators
│   ├── models/                        # Pydantic v2 schemas and enums
│   ├── security/                      # Log sanitization and PII scrubbing
│   ├── sources/                       # Open data adapters (Wiktionary, Tatoeba, Wikipedia)
│   ├── srs/                           # SM-2 algorithmic scheduler
│   ├── storage/                       # Supabase client repository & seed loaders
│   └── translation/                   # Offline dictionary, LibreTranslate, MyMemory
├── frontend/                          # React 19 + TypeScript + Vite SPA
│   ├── public/                        # Static web assets (`favicon.svg`, `icons.svg`, `_headers`)
│   ├── src/
│   │   ├── app/router/                # Zero-dependency hash router (`useAppRouter.ts`)
│   │   ├── components/                # Reusable UI presentation components
│   │   ├── config/                    # Branding, language configuration, capabilities
│   │   ├── data/                      # Local seed dictionaries and corpora
│   │   ├── features/                  # Domain modules (admin, dashboard, practice, etc.)
│   │   ├── i18n/                      # Decoupled multilingual translations & detector
│   │   ├── integrations/              # External APIs, circuit breakers, rate limiters
│   │   ├── lib/languages/             # Decoupled language matrix & enums
│   │   ├── pages/                     # Top-level application view screens
│   │   ├── services/                  # Application services (auth, storage, localDb, etc.)
│   │   ├── tests/                     # Vitest component & service test suites
│   │   └── types/                     # TypeScript domain models and contracts
├── scripts/                           # Maintenance, admin bootstrapping, backup runners
├── supabase/
│   └── migrations/                    # Canonical database migrations (001 through 014)
├── tests/                             # Pytest test suite for engine and migrations
├── AGENTS.md                          # Ground truth system invariants & rules
├── API_CATALOG.md                     # Catalog of external API endpoints & fallbacks
├── ENVIRONMENT_VARIABLES.md           # Master audit of environment configurations
└── requirements.txt                   # Python runtime dependencies
```

### 2.4 Frontend Entry Points
- `frontend/index.html`: Main HTML template, viewport meta tags, preconnect hints.
- `frontend/src/main.tsx`: React 19 DOM root mounting, error boundary wrapping.
- `frontend/src/App.tsx`: Primary application orchestrator, navigation bar, modal dialogs, route switcher.

### 2.5 Frontend Routing
- Client-side zero-dependency hash-based routing orchestrated in `frontend/src/app/router/useAppRouter.ts`:
  - `#learn` / `#portuguese` / `#spanish` / `#english`: Active course study screens.
  - `#review`: Spaced repetition flashcard session.
  - `#vocabulary`: Lexical explorer, phrasebook, and PDF study pack export.
  - `#explore`: Cultural articles, real-world readings, country discovery, global holidays.
  - `#translate`: Trilingual dictionary, contextual translation, false-friend warnings.
  - `#practice`: Multi-modal practice studio (poetry, phrasebook, grammar, quizzes).
  - `#progress`: Scoped learning analytics, CEFR roadmap, mistake notebook.
  - `#settings`: Dialect selection, avatar customization, theme, study duration.
  - `#admin`: Role-guarded administrative workbench, content moderation, telemetry.

### 2.6 Backend / Python Entry Points
- `scripts/run_daily_batch.py`: Daily automated batch runner invoking Tatoeba/Wiktionary ingestion, template generation, and email dispatch.
- `scripts/verify_connections.py`: Health verification script run by GitHub Actions prior to batch execution.
- `scripts/bootstrap_admin.py`: Secure provisioning of initial administrator roles.
- `scripts/retention_cleanup.py`: Idempotent data retention and transient audit log pruning.
- `scripts/backup_restore.py`: Disaster recovery backup snapshot and restoration utility.

### 2.7 Authentication Flow
- Handled by `frontend/src/services/auth.ts`:
  - **Guest Mode (Default):** Anonymous learners operate completely offline with storage keys scoped to `'guest'`.
  - **Supabase Auth (Production):** Authenticates via email/password or magic link using `supabaseClient.ts`.
  - **Account Isolation:** `StorageService.setCurrentUser(userId)` isolates LocalStorage keys.
  - **Guest Data Migration:** `StorageService.migrateGuestData(userId)` non-destructively copies guest records to authenticated user keys.
  - **Role Guarding:** `hasRole('admin')` validates role membership via `user_roles` before granting access to `/admin`.
  - **Offline Mock DB:** In development/test mode, an in-memory mock map enables deterministic auth testing without cloud round-trips.

### 2.8 Database & Storage Access Points
- **Supabase PostgreSQL:** Singleton client in `frontend/src/services/supabaseClient.ts` configured with `persistSession: true` and dummy safe fallback keys for offline browsing.
- **Dexie IndexedDB v4:** `frontend/src/services/localDb.ts` (`PolyglotLocalDatabase`) containing 8 entity stores (`cachedLessons`, `activeLessonProgress`, `savedVocabulary`, `srsReviews`, `mistakeNotebook`, `syncQueue`, `culturalBookmarks`, `apiCache`).
- **User-Scoped LocalStorage:** Managed by `frontend/src/services/storage.ts` using `getKey(baseKey, userId)` to prevent shared-device tenant leakage.

### 2.9 Background Workflows & GitHub Actions
- `.github/workflows/daily_polyglot.yml`:
  - Scheduled daily at 04:00 UTC (09:30 AM IST).
  - Runs on `ubuntu-latest`, Python 3.12.
  - Executes `pytest tests/ -v`, `verify_connections.py`, and `run_daily_batch.py`.

### 2.10 Existing Test & Build Commands
- Frontend tests: `npm --prefix frontend test` (`vitest run`).
- Frontend production build: `npm --prefix frontend run build` (`tsc -b && vite build`).
- Frontend linting: `npm --prefix frontend run lint` (`oxlint`).
- Python tests: `python -m pytest tests/ -v`.

### 2.11 Environment Variable References
- **Frontend Client (`import.meta.env`):**
  - `VITE_SUPABASE_URL`: Public Supabase PostgREST endpoint.
  - `VITE_SUPABASE_ANON_KEY`: Public anonymous API key.
  - `VITE_UMAMI_WEBSITE_ID`: Optional privacy-friendly analytics ID.
  - `VITE_UMAMI_SRC`: Optional self-hosted Umami script URL.
- **Python Engine & CI (`os.environ`):**
  - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `SMTP_*`.

### 2.12 External API Integrations
- All external calls wrapped in `frontend/src/integrations/external-apis/` with token-bucket rate limiters (`ApiRateLimiter`), circuit breakers (`CircuitBreaker`), PII scrubbers (`PrivacyScrubber`), and Dexie caching (`CacheManager`):
  - Wiktionary, Tatoeba, Wikipedia, MyMemory, Google Gemini (optional), Open-Meteo, REST Countries, Frankfurter, Umami.

### 2.13 Existing Feature Flags & Configuration
- Dynamic capabilities mapped by language in `frontend/src/config/languages/capabilities.ts`.
- Dead static feature flag file discovered in `frontend/src/config/features/index.ts` (evaluated for safe deletion).

### 2.14 Existing Deployment Configuration
- Vite single-page application hosted on Cloudflare Pages / Vercel:
  - Build script copies `dist/index.html` to `dist/200.html` to support client-side fallback routing on static CDNs.
  - Public assets served from `frontend/public/`.

---

## 3. Unused Code & Asset Classification Matrix

Every potential deletion candidate was evaluated across repository AST references, string patterns, dynamic `import()`, route definitions, and test files:

| Candidate | Path | Category | Evidence | Decision |
| :--- | :--- | :--- | :--- | :--- |
| `hero.png` | `frontend/src/assets/hero.png` | Asset | 0 imports or references across all 818 repository files. Leftover starter image. | **Verified Unused — Deleted (Group B)** |
| `react.svg` | `frontend/src/assets/react.svg` | Asset | 0 imports; React boilerplate asset. | **Verified Unused — Deleted (Group B)** |
| `vite.svg` | `frontend/src/assets/vite.svg` | Asset | 0 imports; Vite boilerplate asset (favicon is `/favicon.svg`). | **Verified Unused — Deleted (Group B)** |
| `LanguageToolStudio.tsx` | `frontend/src/components/practice/LanguageToolStudio.tsx` | Component | 0 routes, 0 page imports, 0 test references. Superseded by `WritingCoach.tsx`. | **Verified Unused — Deleted (Group A)** |
| `useDashboard.ts` | `frontend/src/features/dashboard/useDashboard.ts` | Hook | 0 imports; `DashboardView.tsx` manages state internally. 0 test references. | **Verified Unused — Deleted (Group A)** |
| `features/progress/types.ts` | `frontend/src/features/progress/types.ts` | Types | 0 imports across codebase. Interfaces duplicated in `src/types/index.ts`. | **Verified Unused — Deleted (Group A)** |
| `styles/theme.ts` | `frontend/src/styles/theme.ts` | Config | `THEME_TOKENS` object has 0 imports; styling uses Tailwind CSS classes directly. | **Verified Unused — Deleted (Group A)** |
| `config/environment/env.ts` | `frontend/src/config/environment/env.ts` | Config | 0 imports; contained hazardous reference to `VITE_GEMINI_API_KEY`. | **Verified Unused — Deleted (Group A)** |
| `config/features/index.ts` | `frontend/src/config/features/index.ts` | Feature Flags | `FEATURES` object has 0 imports. Dead feature flags. | **Verified Unused — Deleted (Group A)** |
| `shared/hooks/index.ts` | `frontend/src/shared/hooks/index.ts` | Hook Barrel | `useDebounce` has 0 callers in application. | **Verified Unused — Deleted (Group A)** |
| `shared/types/index.ts` | `frontend/src/shared/types/index.ts` | Type Barrel | Re-export facade bypassed; callers import `src/types/` directly. | **Verified Unused — Deleted (Group A)** |
| `shared/components/index.ts` | `frontend/src/shared/components/index.ts` | UI Barrel | Re-export facade bypassed; callers import `components/common/` directly. | **Verified Unused — Deleted (Group A)** |
| `shared/utils/stringUtils.ts` | `frontend/src/shared/utils/stringUtils.ts` | Utility | 0 callers; string normalization handled by `practiceEngine.ts`. | **Verified Unused — Deleted (Group A)** |
| `shared/utils/errorHandler.ts` | `frontend/src/shared/utils/errorHandler.ts` | Utility | 0 callers; error handling handled by Sonner and inline try/catch. | **Verified Unused — Deleted (Group A)** |
| `features/language-selection/` | `frontend/src/features/language-selection/` (5 files) | Component Directory | Unrouted prototype directory with 0 external callers and 0 test references. | **Verified Unused — Deleted (Group A)** |
| Bypassed Barrel Re-exports | 19 subdirectories (`index.ts` files) | Barrel Files | Re-exports completely bypassed by direct file imports; 0 callers verified. | **Verified Unused — Deleted (Group A)** |
| `PortuguesePage.tsx` | `frontend/src/pages/PortuguesePage.tsx` | Page Wrapper | Active route `#portuguese` in `App.tsx` and tested by Vitest suite. | **Active — Retained & Preserved** |
| `SpanishPage.tsx` | `frontend/src/pages/SpanishPage.tsx` | Page Wrapper | Active route `#spanish` in `App.tsx` and tested by Vitest suite. | **Active — Retained & Preserved** |
| `EnglishPage.tsx` | `frontend/src/pages/EnglishPage.tsx` | Page Wrapper | Active route `#english` in `App.tsx` and tested by Vitest suite. | **Active — Retained & Preserved** |
| `shared/utils/localeFormatting.ts` | `frontend/src/shared/utils/localeFormatting.ts` | Utility | Imported and verified by `tests/languageRegistry.test.ts`. | **Active — Retained & Preserved** |
| `shared/utils/textProcessing.ts` | `frontend/src/shared/utils/textProcessing.ts` | Utility | Imported and verified by `tests/languageRegistry.test.ts`. | **Active — Retained & Preserved** |
| `services/contentEngine/` | `frontend/src/services/contentEngine/` | Service Directory | Imported and tested by `tests/contentEngine/contentPipeline.test.ts` (19 tests). | **Active — Retained & Preserved** |
| `services/auth/index.ts` | `frontend/src/services/auth/index.ts` | Barrel | 21 active callers across components and pages. | **Active — Retained & Preserved** |
| `services/storage/index.ts` | `frontend/src/services/storage/index.ts` | Barrel | 35 active callers across components and pages. | **Active — Retained & Preserved** |
| `types/index.ts` | `frontend/src/types/index.ts` | Root Types | 125 active callers across application. | **Active — Retained & Preserved** |

---

## 4. Evidence-Based Safety Determinations

1. **Zero Impact on Production Functionality:**
   None of the deleted 35 code files or 3 assets had reachable imports or routes from `App.tsx`, `main.tsx`, or any test file.
2. **Zero Impact on Persistence:**
   No Dexie entity stores, LocalStorage keys, or database tables were renamed, dropped, or modified.
3. **Zero Impact on Authentication:**
   `authService.ts` and `supabaseClient.ts` remain completely untouched in their public and private contracts.
4. **Zero Impact on Verification Gates:**
   Vitest (310/310), Vite build (2,775 modules), and Pytest (106/106) pass with 100% success.
