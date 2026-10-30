# Lexilume — Illuminate Your Words

[![License: CC-BY-4.0](https://img.shields.io/badge/License-CC_BY_4.0-blue.svg)](https://creativecommons.org/licenses/by/4.0/)
[![Tests: 98 Python passing](https://img.shields.io/badge/Python_Tests-98_passing-success.svg)](#testing)
[![Tests: 136 Vitest passing](https://img.shields.io/badge/Vitest_Tests-136_passing-success.svg)](#testing)
[![Zero-Cost Guarantee](https://img.shields.io/badge/Stack-100%25_Free_Tier-emerald.svg)](#free-tier-operational-guarantees)

**Lexilume** is an AI-powered multilingual learning platform for vocabulary mastery, daily lessons, reading comprehension, translation, grammar, spaced repetition, and personalized language development across Portuguese, Spanish, and English (CEFR A1–C1).

The application requires **zero paid runtime AI APIs**, operates seamlessly offline via local-first Dexie/IndexedDB persistence, and runs within perpetual free-tier infrastructure.

---

## Architecture Highlights

- **Multilingual Progression (A1 → C1)**: Structured progression graphs for Portuguese (BR/PT), Spanish (ES/419/MX/AR), and English (US/GB) with strict 4-way language decoupling (Interface, Learning, Explanation, Variety).
- **Date-Seeded Dynamic Rotation Engine**: Lessons advance deterministically with the calendar day, rotating vocabulary batches, authentic situational dialogues (Travel, Work, Executive Interview), and reading passages daily.
- **Deterministic 12-Section Daily Lessons**: Each lesson includes learning objectives, active vocabulary, grammar rules with structural formulas, reading comprehension, pragmatic conversation scripts, speaking prompts, writing guidelines, listening comprehension, contextual exercises with distractor feedback, spaced repetition reviews, and open resources.
- **SuperMemo-2 (SM-2) Spaced Repetition**: Distinguishes `presented` vocabulary from `mastered` items ($\ge 5$ consecutive successful reviews and $\ge 21$-day interval).
- **Interlinguistic False Friends Engine**: Detects and alerts learners to critical cross-language false cognates (*esquisito*, *polvo*, *presunto*, *borracha*, etc.).
- **Central External API Integration Layer**: Modular, rate-limited, and cached adapters for free dictionary and language tools, transparently enriched and cached in IndexedDB.
- **Automated Email Digest & Batch Pipeline**: Scheduled daily delivery via **GitHub Actions** and **Resend** or transactional **SMTP**.
- **Idempotency & Deduplication**: Database-backed delivery ledger and SHA-256 content fingerprints prevent duplicate sends or double-advancing curriculum state on job retries.
- **Accessible Responsive Web Client**: Single Page Application built with React 19, TypeScript, and Tailwind CSS v4, deployable statically to Cloudflare Pages.
- **Trilingual Translation & Lexicon**: Bidirectional dictionary search (PT ↔ EN, ES ↔ EN, EN ↔ PT/ES), native text-to-speech, contextual exercises, and personal bookmarking.

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
│   └── public/                 # Static assets, _redirects, _headers
├── scripts/                    # Operational automation CLI scripts
│   ├── run_daily_batch.py      # Daily batch lesson generation & email delivery
│   ├── retention_cleanup.py    # Storage retention & account lifecycle pruning
│   └── backup_restore.py       # Essential progress export and restoration
├── supabase/migrations/        # Relational schema DDL & Row-Level Security
│   ├── 001_initial_schema.sql  # Core tables & foreign key constraints
│   ├── 002_rls_policies.sql    # Row-Level Security isolation policies
│   ├── 003_email_and_retention.sql # Delivery ledger & cleanup audit logs
│   ├── 004_minimal_wikipedia_assignments.sql # Minimal daily reading assignments
│   ├── 005_language_directions_and_saved_translations.sql # Trilingual directions & bookmarks
│   ├── 009_schema_reconciliation_and_sync.sql # Schema reconciliation, sync & RLS
│   └── rollback/               # Reversible migration rollback scripts
├── tests/                      # Python pytest automated test suite (98 tests)
├── docs/                       # Architectural guides & deep-dives
│   ├── PROJECT_AUDIT.md        # Comprehensive architecture & security audit
│   ├── DESIGN_SYSTEM.md        # UI/UX design tokens, typography & component inventory
│   ├── MULTILINGUAL_MATRIX.md  # 4-way language decoupling & 9 direction matrix
│   ├── CONTENT_AUTHORING.md    # Pedagogical content authoring guidelines
│   ├── EXTERNAL_API_INTEGRATION.md # Central API integration layer & adapters
│   └── SOURCE_ADAPTERS.md      # Python core content source adapters
├── AGENTS.md                   # AI coding agent ground-truth instructions & invariants
├── ARCHITECTURE.md             # Core system architecture & principles
├── DATA_MODEL.md               # PostgreSQL schema & entity-relationship specifications
├── ENGINEERING_SPEC.md         # Master engineering & pedagogical specification
├── API_CATALOG.md              # External API specifications & rate limits
├── DATA_LICENSES.md            # Provenance & content licensing compliance
├── DEPLOYMENT.md               # Production deployment step-by-step guide
├── ENVIRONMENT_VARIABLES.md    # Environment variable reference
├── SECURITY.md                 # Security architecture & credential boundaries
├── BACKUP_AND_RECOVERY.md      # Disaster recovery & backup procedures
├── OPERATIONS_RUNBOOK.md       # Operational runbook & troubleshooting
└── COST_AND_LIMITS.md          # Free-tier quotas, limits, and cost audit
```

---

## Quickstart

### Prerequisites
- Python 3.12+
- Node.js v20+ / v24+ and npm

### 1. Python Engine Setup
```bash
# Clone the repository
git clone https://github.com/polyglot-c1-daily/language-learning.git
cd language-learning

# Install dependencies
pip install -r requirements.txt

# Run Python verification tests (78 tests)
python -m pytest tests/ -v
```

### 2. Frontend Dashboard Setup
```bash
cd frontend
npm install

# Run frontend unit tests (98 tests)
npx vitest run

# Run production build
npm run build

# Start local development server
npm run dev
```

### 3. Running Daily Lesson Batch (Dry-Run)
```bash
# Execute dry-run batch simulation (zero external mutations)
python scripts/run_daily_batch.py --dry-run
```

---

## Testing Verification

| Test Suite | Scope | Tests | Result | Execution Time |
| :--- | :--- | :--- | :--- | :--- |
| **Backend Pytest** | Curriculum, SM-2, generators, sources, email, security, decoupling, migrations | 82 | **100% Passed** | ~6.25s |
| **Frontend Vitest** | SM-2 client, local storage, dynamic rotation, external APIs, culture, vocab, 4-way decoupling, navigation UX | 132+ | **100% Passed** | All 19 suites |
| **Vite Production Build** | TypeScript strict checks & CSS compilation (`tsc -b && vite build`) | — | **0 Errors** | Production Ready |

---

## Free-Tier Operational Guarantees

Lexilume is designed specifically to run indefinitely on perpetual free tiers:
1. **Supabase PostgreSQL**: 500 MB database allowance with 8 migrations and strict RLS. Daily batch jobs prevent the 7-day inactivity pause.
2. **GitHub Actions**: Consumes ~60 minutes/month out of 2,000 free minutes/month (3% usage).
3. **Cloudflare Pages**: Static SPA hosting with unlimited bandwidth and 500 free builds/month.
4. **Resend**: 100 free emails/day and 3,000/month for personal learner accounts. Fallback to standard SMTP (Gmail App Password) supported.
