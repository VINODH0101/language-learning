# 07. Testing and Quality Assurance Report

> **Audit Date:** 2026-10-29  
> **Repository:** `language-learning`  
> **Test Status:** 166 Passed / 0 Failed / 0 Skipped (100% Pass Rate)

---

## 1. Quality Assurance Summary & Inventory

The test suite provides comprehensive regression coverage across all client and backend engine modules:

| Test Layer | Test Runner | Test Files | Total Tests | Passed | Failed | Execution Time |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Frontend SPA** | Vitest 5.0.5 (`jsdom`) | 15 files | 98 tests | 98 | 0 | ~12.98s |
| **Python Engine** | Pytest 9.2.0 | 21 files | 78 tests | 78 | 0 | ~1.63s |
| **Type Checking & Build** | `tsc -b && vite build` | N/A | 2341 modules | 2341 | 0 | ~1.48s |
| **Total** | — | **36 files** | **176 tests** | **176** | **0** | **~16.09s** |

---

## 2. Frontend Test Suite Breakdown (`frontend/src/tests/`)

**Command:** `npm --prefix frontend test -- --run`

| Test File | Tests | Validated Functionality |
| :--- | :--- | :--- |
| `auth.test.ts` | 7 | Supabase GoTrue authentication, guest mode, password validation, role checks. |
| `course.test.ts` | 5 | Multi-course creation, active course toggling, track isolation. |
| `cultureExplore.test.ts` | 9 | Country/language decoupling, bookmark management, reading reader modal. |
| `dashboard.test.tsx` | 4 | Dynamic Home page localization, language-filtered cultural articles, active course adaptation. |
| `i18n.test.ts` | 2 | Dictionary coverage across EN, PT, ES, interface decoupling. |
| `languageDecoupling.test.ts` | 17 | 4-way decoupling, 9 matrix pairs, regional dialect scoping, TTS locale resolution. |
| `lessonGenerator.test.ts` | 5 | Deterministic 12-section synthesis, CEFR adaptation, distractor generation. |
| `localDb.test.ts` | 4 | Dexie schema versioning, IndexedDB persistence, phrasebook storage. |
| `multilingual.test.ts` | 10 | Multilingual lexis extraction, bidirectional translation, corpus queries. |
| `navigation.test.tsx` | 6 | Navigation bar layout, segmented language switcher, learn dropdown, mobile dock. |
| `srs.test.ts` | 5 | SuperMemo-2 (SM-2) formula, interval calculations, ease factor updates. |
| `storage.test.ts` | 4 | LocalStorage preferences, safe parse, font scaling, active course ID. |
| `syncEngine.test.ts` | 4 | Offline mutation queue, idempotency keys, exponential backoff retries. |
| `translate.test.ts` | 7 | Offline dictionary resolution, false-friend warnings, saved translation history. |
| `vocabulary.test.ts` | 9 | Top 200 vocabulary, everyday sentences, client-side PDF study pack generation. |

---

## 3. Python Engine Test Suite Breakdown (`tests/`)

**Command:** `python -m pytest`

| Test File | Tests | Validated Functionality |
| :--- | :--- | :--- |
| `test_auth_and_admin_migrations.py` | 3 | Role-based database migration scripts and security audit log DDL. |
| `test_course_and_multilingual_migrations.py` | 2 | PostgreSQL schema constraints for multi-course tracking. |
| `test_cultural_bookmarks_migrations.py` | 2 | Bookmark tables and sync trigger definitions. |
| `test_curriculum.py` | 5 | Curriculum DAG graph validation, prerequisite checking, CEFR tiers. |
| `test_curriculum_extended.py` | 4 | Extended A1–C1 syllabi, track progression, recency buffers. |
| `test_diagnostic.py` | 2 | 25-question diagnostic scorer, CEFR tier placement. |
| `test_email_workflow.py` | 4 | Idempotency ledger, digest composer, Resend and SMTP adapters. |
| `test_engine_facade.py` | 4 | PolyglotEngine unified facade API and workflow dispatch. |
| `test_exercises.py` | 5 | Cloze generation, answer normalization, distractor evaluation. |
| `test_false_friends.py` | 1 | Spanish-Portuguese false cognate detection matrix. |
| `test_generator.py` | 4 | Deterministic lesson template generator, markdown rendering. |
| `test_language_separation.py` | 5 | Pydantic regional variety validator, enum scoping, rejection of mismatched varieties. |
| `test_models.py` | 3 | Pydantic v2 schemas for lexis, curriculum, and lesson payloads. |
| `test_reading_providers.py` | 3 | Wikipedia and open cultural syllabus reading adapters. |
| `test_retention_extended.py` | 2 | Storage retention policies and pruning logic. |
| `test_security_and_config.py` | 3 | Sensitive data scrubbing, email validation, logging guard. |
| `test_sources.py` | 8 | Tatoeba, Wiktionary, Wikimedia Commons source adapters. |
| `test_srs.py` | 4 | Python SM-2 calculator, interval progression, ease-factor updates. |
| `test_storage_and_retention.py` | 2 | Database repository interfaces and seed loaders. |
| `test_translation_service.py` | 7 | Modular translation adapters, quota guard, LRU cache. |
| `test_wikipedia_source.py` | 5 | Wikipedia REST API integration and thumbnail extraction. |

---

## 4. Continuous Integration (CI) Workflow (`daily_polyglot.yml`)

The automated workflow executes daily via GitHub Actions:
- **Trigger:** Cron schedule (`0 4 * * *` = 09:30 AM IST) and manual `workflow_dispatch`.
- **Environment:** Ubuntu latest, Python 3.12.
- **Verification Gate:** Runs `python -m pytest tests/ -v` before executing batch lesson generation.
- **Idempotency Safeguard:** Checks `email_deliveries` unique ledger to prevent duplicate daily digests.
