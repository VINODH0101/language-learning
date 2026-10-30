# Lexilume — Illuminate Your Words

[![License: CC-BY-4.0](https://img.shields.io/badge/License-CC_BY_4.0-blue.svg)](https://creativecommons.org/licenses/by/4.0/)
[![Tests: 100 Python passing](https://img.shields.io/badge/Python_Tests-100_passing-success.svg)](#testing)
[![Tests: 254 Vitest passing](https://img.shields.io/badge/Vitest_Tests-254_passing-success.svg)](#testing)
[![Zero-Paid AI Guarantee](https://img.shields.io/badge/Stack-Zero_Paid_APIs-emerald.svg)](#zero-paid-ai-invariants)
[![Production Domain](https://img.shields.io/badge/Production-lexi.monster-indigo.svg)](https://lexi.monster)

**Lexilume** is a high-caliber multilingual language learning platform designed for structured vocabulary mastery, daily pedagogical lessons, reading comprehension, contextual translation, grammar acquisition, spaced repetition (SM-2), and real-world interactive learning across 15 supported languages and regional varieties.

The application requires **zero paid runtime AI APIs**, operates seamlessly offline via local-first Dexie/IndexedDB persistence, and runs within perpetual free-tier infrastructure.

---

## Architecture Highlights

- **Multilingual Support Across 15 Languages**: Complete curriculum and capability configurations for English (`en`), Portuguese (`pt`, `pt-BR`, `pt-PT`), Spanish (`es`, `es-ES`, `es-419`, `es-MX`, `es-AR`), French (`fr`, `fr-FR`, `fr-CA`), German (`de`, `de-DE`, `de-AT`, `de-CH`), Italian (`it`, `it-IT`), Japanese (`ja`, `ja-JP`), Korean (`ko`, `ko-KR`), Russian (`ru`, `ru-RU`), Dutch (`nl`, `nl-NL`, `nl-BE`), Mandarin Chinese (`zh`, `zh-Hans`, `zh-CN`), Turkish (`tr`, `tr-TR`), and Tamil (`ta`, `ta-IN`, `ta-LK`). *(Hindi is explicitly excluded platform-wide).*
- **Strict 4-Way Linguistic Decoupling**: Independent dimensions for `interface_language`, `learning_language`, `explanation_language`, and `regional_variety`. Changing interface language never alters study tracks or resets learner progress.
- **Complete Local UI Internationalization (i18n)**: 15 interface locales across 9 functional namespaces (135 local JSON bundles) bundled directly into the application with zero paid translation runtime overhead.
- **Deterministic 12-Section Daily Lessons**: Each lesson includes learning objectives, active vocabulary, grammar rules with structural formulas, reading comprehension, pragmatic conversation scripts, speaking prompts, writing guidelines, listening comprehension, contextual exercises with distractor feedback, spaced repetition reviews, and open resources.
- **SuperMemo-2 (SM-2) Spaced Repetition**: Distinguishes `presented` vocabulary from `mastered` items ($\ge 5$ consecutive successful reviews and $\ge 21$-day interval).
- **Lexilume World (Real-World Learning Layer)**: Contextual learning powered by free open APIs: Open-Meteo (Weather & AQI), Nager.Date (Global Cultural Calendar), Frankfurter (ECB currency exchange math drills), and REST Countries.
- **Dual-Tier Offline Persistence**: Authoritative Supabase PostgreSQL cloud sync for authenticated users paired with Dexie / IndexedDB for offline learning, local mistake notebooks, and mutation queue replay (`SyncEngine`).
- **Zero-Paid AI Invariant**: All core learning runs offline with curated open educational datasets (Wiktionary, Tatoeba, Openverse). Optional Google Gemini integration operates strictly with full deterministic rule-based fallbacks across all error states.

---

## Release Documentation

Detailed technical audits and operational verifications are documented in `docs/release/`:
- [Final QA & Production Readiness Report](docs/release/FINAL_QA_REPORT.md)
- [Security & Privacy Audit Report](docs/release/SECURITY_REPORT.md)
- [Performance & Bundle Optimization Report](docs/release/PERFORMANCE_REPORT.md)
- [External Free API Verification Report](docs/release/API_VERIFICATION_REPORT.md)
- [Multilingual Language Coverage Report](docs/release/LANGUAGE_COVERAGE_REPORT.md)
- [Database Persistence & Schema Report](docs/release/DATABASE_VERIFICATION_REPORT.md)
- [Known Limitations & Considerations](docs/release/KNOWN_LIMITATIONS.md)

---

## Repository Structure

```
├── .github/workflows/          # GitHub Actions daily cron automation
│   └── daily_polyglot.yml      # Daily runner (04:00 UTC = 09:30 IST)
├── engine/                     # Python 3.12 Core Learning Engine
│   ├── curriculum/             # Syllabus graphs, manager & recency buffers
│   ├── diagnostic/             # Placement assessment engine
│   ├── email/                  # Adapters (Resend, SMTP, Mock) & HTML/Text composer
│   ├── exercises/              # Normalizer, answer checker & cloze generator
│   ├── generators/             # Deterministic lesson generator & false friends
│   ├── models/                 # Pydantic v2 schemas for all content & progress
│   ├── security/               # Logging scrubber, input sanitizer & email validator
│   ├── sources/                # Wiktionary, Tatoeba, Wikimedia, Wikipedia adapters & fixtures
│   ├── storage/                # Repository interface & Supabase REST repository
│   └── translation/            # Modular translation providers, LRU cache & quota guard
├── frontend/                   # React 19 + TypeScript + Vite + Tailwind CSS v4
│   ├── src/                    # Components, pages, services, types & tests
│   │   ├── config/             # Language registries, capabilities & CEFR bounds
│   │   ├── features/           # Dashboard, CourseView (4 stages), Vocabulary
│   │   ├── i18n/               # i18next config, 15-locale dropdown & 135 resource bundles
│   │   ├── integrations/       # External free API adapters (MyMemory, Tatoeba, etc.)
│   │   └── services/           # Dexie localDb, SyncEngine, SRS, Speech
│   └── public/                 # Static assets, 200.html SPA routing
├── scripts/                    # Operational automation CLI scripts
│   ├── run_daily_batch.py      # Daily batch lesson generation & email delivery
│   ├── retention_cleanup.py    # Storage retention & account lifecycle pruning
│   └── backup_restore.py       # Essential progress export and restoration
├── supabase/migrations/        # Relational schema DDL & Row-Level Security (001 to 010)
│   ├── 001_initial_schema.sql  # Core tables & foreign key constraints
│   ├── 002_rls_policies.sql    # Row-Level Security isolation policies
│   ├── 007_multiple_courses_and_progress_isolation.sql # Course isolation
│   ├── 010_database_persistence_and_sync_repair.sql   # Reconciled sync & RLS
│   └── rollback/               # Reversible migration rollback scripts
├── tests/                      # Python pytest automated test suite (101 tests)
└── docs/                       # Architectural guides & release reports
    └── release/                # Production release certification reports
```

---

## Quickstart & Verification

### Prerequisites
- Python 3.12+
- Node.js v20+ / v24+ and npm

### 1. Python Engine Verification
```bash
# Clone the repository
git clone https://github.com/VINODH0101/language-learning.git
cd language-learning

# Install dependencies
pip install -r requirements.txt

# Run Python verification tests (100 passed, 1 skipped)
python -m pytest tests/ -v
```

### 2. Frontend Verification & Build
```bash
# Run all frontend unit and integration tests (254 passed)
npm --prefix frontend test -- --run

# Run linter verification (0 errors)
npm --prefix frontend run lint

# Compile production bundle (TypeScript & Vite)
npm --prefix frontend run build

# Start local development server
npm --prefix frontend run dev
```

---

## Verification Test Summary

| Test Suite | Scope | Total Tests | Verified Result | Execution Time |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend Vitest** | 4-way decoupling, 15-locale i18n, Dexie localDb, SyncEngine, SM-2, UX redesign, Lexilume World, API adapters | 254 | **254 Passed / 0 Failed (100%)** | ~24.2s |
| **Python Pytest** | Curriculum syllabi, SM-2 engine, source adapters, SQL migrations 001-010, input sanitization, PII scrubbing | 101 | **100 Passed, 1 Skipped / 0 Failed** | ~8.1s |
| **Production Build** | TypeScript strict checks & Vite production compilation (`tsc -b && vite build`) | 2,707 modules | **Exit code 0 (Gzip: ~778 kB)** | ~31.1s |
| **Linter (Oxlint)** | Syntax, hook ordering, unused imports, React rules | 264 files | **0 Errors, 342 Warnings** | ~170ms |

---

## Free-Tier Operational Guarantees

Lexilume operates indefinitely within perpetual free tiers:
1. **Supabase PostgreSQL**: 500 MB database allowance with 10 migrations and strict RLS. Daily batch jobs prevent inactivity pauses.
2. **Cloudflare Pages**: Static SPA deployment with unlimited bandwidth and edge delivery (`lexi.monster`).
3. **GitHub Actions**: Consumes ~60 minutes/month out of 2,000 free minutes/month (3% usage).
4. **Free Open APIs**: MyMemory, Tatoeba, Wiktionary, Open-Meteo, Nager.Date, Frankfurter, and Cloudflare Turnstile operate without paid credit card requirements.
