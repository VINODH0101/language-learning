# Lexilume — Comprehensive Module Dependency Matrix

> **Audit Phase:** Phase 2 — Dependency and Usage Analysis  
> **Repository:** `VINODH0101/language-learning` (Lexilume — Illuminate Your Words)  
> **Target Production Domain:** `https://lexi.monster`  
> **Files Audited:** 313 TypeScript/TSX modules and 54 Python modules  
> **Reachable Modules:** 209 frontend modules reachable from entry points (`main.tsx`, `App.tsx`, `routes.ts`)  
> **Test-Only Modules:** 5 modules  
> **Unreachable / Orphaned Modules:** 63 modules (primarily unused barrel `index.ts` files and unrouted prototype views)

---

## 1. Matrix Classification Definitions

- **Path:** Repository-relative module path.
- **Responsibility:** Primary domain or technical duty.
- **Direct Dependencies:** Primary internal packages and modules imported.
- **Reverse Dependencies:** Importers and consuming components/callers.
- **Runtime Reachable:** Reachable from `main.tsx` / `App.tsx` / `routes.ts` or CLI scripts.
- **Test Only:** Only imported within `.test.ts` or `__tests__/` test suites.
- **Data Sources:** Direct access to IndexedDB, LocalStorage, Supabase, or External APIs.
- **Side Effects:** DOM manipulation, network transmission, browser events, or disk writes.
- **Status for Target Architecture:**
  - `Keep`: Retain in target content-centred architecture.
  - `Refactor`: Retain pedagogical capability but overhaul internal contracts.
  - `Consolidate`: Merge overlapping or duplicate implementations.
  - `Defer`: Retain as-is until content-centred core is stabilized.
  - `Archive`: Safe to remove or deprecate during Phase 4 cleanup.

---

## 2. Core Frontend Services & State Layer

| Module Path | Responsibility | Direct Dependencies | Reverse Dependencies (Importers) | Runtime Reachable | Test Only | Data Sources Accessed | Side Effects | Target Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `frontend/src/services/courseService.ts` | Multi-course management, course switching, syllabus progress tracking | `types`, `languageMatrix`, `syncEngine`, `seedData` | `LearnPage.tsx`, `CoursesPage.tsx`, `Navigation.tsx`, `useCourse.ts` | **Yes** | No | `polyglot_courses_{uid}`, `polyglot_active_course_{uid}` | Dispatches course state updates to listeners | **Keep** |
| `frontend/src/services/storage.ts` | Scoped LocalStorage partition manager, guest data migration | `types`, `syncEngine`, `languageRegistry` | `auth.ts`, `courseService.ts`, `srs.ts`, `PlacementTestPage.tsx` | **Yes** | No | 12 LocalStorage keys | Synchronous browser storage read/write | **Keep** |
| `frontend/src/services/localDb.ts` | Dexie v4 IndexedDB configuration, offline entity stores | `dexie`, `types` | `syncEngine.ts`, `lessonGenerator.ts`, `srs.ts`, `MistakesPage.tsx` | **Yes** | No | IndexedDB: `PolyglotLocalDatabase` (8 tables) | Asynchronous IndexedDB storage operations | **Keep** |
| `frontend/src/services/syncEngine.ts` | Local-first mutation queue, auto reconnection, PostgREST sync | `supabaseClient`, `auth`, `localDb` | `courseService.ts`, `storage.ts`, `srs.ts`, `VocabularyPage.tsx` | **Yes** | No | Dexie `syncQueue`, Supabase Cloud | Window `online`/`offline` listeners, network requests | **Keep** |
| `frontend/src/services/auth.ts` | Authentication session state, mock offline auth, Supabase auth | `supabaseClient`, `localDb`, `storage` | `App.tsx`, `Navigation.tsx`, `ProfilePage.tsx`, `LoginPage.tsx` | **Yes** | No | Supabase Auth, `user_profiles`, `user_roles` | Dispatches auth events; updates session tokens | **Keep** |
| `frontend/src/services/srs.ts` | SM-2 spaced repetition algorithm, review queue calculation | `types`, `localDb`, `storage`, `syncEngine` | `ReviewPage.tsx`, `VocabularyPage.tsx`, `LessonView.tsx` | **Yes** | No | Dexie `srsReviews`, Supabase `srs_items` | Mutates SM-2 interval and ease factors | **Keep** |
| `frontend/src/services/lessonGenerator.ts` | Deterministic daily lesson and exercise synthesis engine | `types`, `seedData`, `sentencesData`, `localDb` | `LearnPage.tsx`, `LessonView.tsx`, `DailyContentHub.tsx` | **Yes** | No | Local seed JSON corpora, Dexie `cachedLessons` | Writes generated lessons to cache | **Refactor** (Align to content model) |
| `frontend/src/services/speech.ts` | Web Speech API voice synthesis and pronunciation playback | Browser `window.speechSynthesis` | `ContextualWordPopover.tsx`, `LessonView.tsx`, `WorldMapExplorer.tsx` | **Yes** | No | Browser TTS voices | Speaks audio via system speech synthesizer | **Keep** |
| `frontend/src/services/pdfService.ts` | jsPDF offline study pack generation | `jspdf`, `types`, `seedData` | `DownloadPdfDialog.tsx`, `VocabularyPage.tsx` | **Yes** | No | In-memory vocabulary datasets | Generates binary PDF and triggers browser download | **Keep** |
| `frontend/src/services/dailyContentService.ts`| Published daily reading & article fetcher | `supabaseClient`, `localDb`, `types` | `DailyContentHub.tsx`, `ArticleReaderModal.tsx` | **Yes** | No | Supabase `daily_published_content`, Dexie `apiCache` | Network fetch requests | **Keep & Expand** |
| `frontend/src/services/adminService.ts` | Content moderation, background worker jobs, audit logs | `supabaseClient`, `types` | `AdminPage.tsx`, `AdminContentReview.tsx` | **Yes** | No | Supabase `content_review_items`, `admin_background_jobs` | Network mutations, admin audit log writes | **Keep** |
| `frontend/src/services/ocrService.ts` | Optical character recognition for image text extraction | Dynamic `tesseract.js`, `types` | `OcrModal.tsx` | **Yes** | No | Client image File / Blob | Spawns Web Worker; executes WASM OCR | **Defer** |

---

## 3. Core Frontend Presentation Pages & Feature Views

| Module Path | Responsibility | Direct Dependencies | Consumed By / Route | Runtime Reachable | Test Only | Target Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `frontend/src/pages/LearnPage.tsx` | Unified learning experience, active course curriculum & resume | `courseService`, `useCourse`, `LessonView`, `CurriculumView` | Route: `/learn`, `/learn/:lang` | **Yes** | No | **Keep (Primary Learner Hub)** |
| `frontend/src/pages/CoursesPage.tsx` | Course catalog, multi-track switcher, new course creator | `courseService`, `languageMatrix`, `Badge`, `Button` | Route: `/courses` | **Yes** | No | **Keep (Course Selection Flow)** |
| `frontend/src/pages/LessonPage.tsx` | Standalone lesson player wrapper | `LessonView`, `useCourse`, `lessonGenerator` | Route: `/lesson/:id` | **Yes** | No | **Consolidate (Integrate into Learn flow)** |
| `frontend/src/pages/ReviewPage.tsx` | SM-2 flashcard review session | `srs`, `ReviewSession`, `Button` | Route: `/review` | **Yes** | No | **Keep (Core Practice)** |
| `frontend/src/pages/VocabularyPage.tsx` | Word bank, search, filtering, PDF export | `localDb`, `pdfService`, `MiniSearch`, `DownloadPdfDialog` | Route: `/vocabulary` | **Yes** | No | **Keep & Enhance** |
| `frontend/src/pages/GrammarPage.tsx` | Grammar rules syllabus explorer | `seedData`, `grammarManager`, `LanguageToolStudio` | Route: `/grammar` | **Yes** | No | **Refactor (Align with text analysis)** |
| `frontend/src/pages/CulturePage.tsx` | Reading and cultural articles explorer | `dailyContentService`, `ArticleReaderModal`, `seedData` | Route: `/culture` | **Yes** | No | **Keep & Consolidate** |
| `frontend/src/pages/WorldMapPage.tsx` | Interactive OpenStreetMap capital explorer | `WorldMapExplorer` | Route: `/world` | **Yes** | No | **Keep (Cultural Context)** |
| `frontend/src/pages/PlacementTestPage.tsx` | CEFR diagnostic placement evaluation | `placementTestService`, `storage`, `courseService` | Route: `/placement-test` | **Yes** | No | **Keep** |
| `frontend/src/pages/ProfilePage.tsx` | User profile, learning statistics, settings | `auth`, `storage`, `courseService` | Route: `/profile` | **Yes** | No | **Keep** |
| `frontend/src/pages/AdminPage.tsx` | Administrator dashboard & content management | `adminService`, `auth`, `AdminDashboard` | Route: `/admin` | **Yes** | No | **Keep (Admin Management Hub)** |
| `frontend/src/pages/EnglishPage.tsx` | Legacy route wrapper for `/learn/en` | `CourseView` | Route: `/learn/en` (Legacy) | **Yes** | No | **Consolidate into `LearnPage`** |
| `frontend/src/pages/PortuguesePage.tsx` | Legacy route wrapper for `/learn/pt` | `CourseView` | Route: `/learn/pt` (Legacy) | **Yes** | No | **Consolidate into `LearnPage`** |
| `frontend/src/pages/SpanishPage.tsx` | Legacy route wrapper for `/learn/es` | `CourseView` | Route: `/learn/es` (Legacy) | **Yes** | No | **Consolidate into `LearnPage`** |

---

## 4. Linguistic Decoupling & Configuration Modules

| Module Path | Responsibility | Direct Dependencies | Reverse Dependencies (Importers) | Runtime Reachable | Test Only | Target Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `frontend/src/lib/languages/languageMatrix.ts` | 4-way linguistic decoupling validator (`enforceRegionalVariety`) | `types` | `courseService.ts`, `CoursesPage.tsx`, `auth.ts`, `i18nContext.tsx` | **Yes** | No | **Keep (Core System Invariant)** |
| `frontend/src/config/languages/languageRegistry.ts` | 13 authorized base languages registry & capabilities | `types` | `courseService.ts`, `storage.ts`, `WorldMapExplorer.tsx` | **Yes** | No | **Keep (Core Invariant: 13 Languages)** |
| `frontend/src/i18n/i18nContext.tsx` | Reactive UI interface language switcher (`en`, `pt`, `es`) | `react`, `storage` | `App.tsx`, `InterfaceLanguageSelector.tsx`, `Navigation.tsx` | **Yes** | No | **Keep (UI Localization)** |
| `frontend/src/data/seedData.ts` | Local educational corpus (grammar, vocab, culture, sentences) | `types` | `lessonGenerator.ts`, `courseService.ts`, `pdfService.ts` | **Yes** | No | **Keep (Zero-Paid AI Offline Base)** |
| `frontend/src/data/sentencesData.ts` | Pre-compiled bilingual Tatoeba sentence repository | `types` | `lessonGenerator.ts`, `tatoebaProvider.ts` | **Yes** | No | **Keep (Bilingual Corpora)** |

---

## 5. Python Engine & Scheduled Automation Modules

| Module Path | Responsibility | Direct Dependencies | Consumed By / Caller | Runtime Reachable | Test Only | Target Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `engine/models/enums.py` | Python Pydantic enums (`Language`, `CEFRLevel`, `RegionalVariety`) | `enum` | All engine modules | **Yes** (Engine) | No | **Keep** |
| `engine/models/schemas.py` | Pydantic data validation schemas for lessons, items, reviews | `pydantic`, `enums` | All engine modules | **Yes** (Engine) | No | **Keep** |
| `engine/storage/supabase_repository.py` | Python PostgREST repository for batch publishing | `urllib`, `json`, `os`, `logging` | `run_daily_batch.py`, `retention_cleanup.py` | **Yes** (Batch) | No | **Keep** |
| `engine/storage/repository.py` | Abstract storage interface & InMemory fallback | `abc`, `typing` | `supabase_repository.py` | **Yes** (Engine) | No | **Keep** |
| `engine/generators/template_engine.py` | Deterministic rule-based C1 lesson generator | `json`, `random`, `schemas` | `run_daily_batch.py` | **Yes** (Engine) | No | **Keep (Deterministic Foundation)** |
| `engine/generators/gemini_generator.py`| Optional Gemini LLM lesson generator | `urllib`, `json`, `os` | Optional generator runner | **Yes** (Optional)| No | **Keep (Strictly Optional)** |
| `engine/srs/sm2.py` | Python implementation of SM-2 spaced repetition | `datetime`, `math` | `schemas`, tests | **Yes** (Engine) | No | **Keep** |
| `engine/sources/wiktionary.py` | Wiktionary API client & scraper | `urllib`, `json` | Batch vocabulary generator | **Yes** (Pipeline)| No | **Keep** |
| `engine/sources/tatoeba.py` | Tatoeba parallel sentence harvester | `urllib`, `json` | Batch sentence generator | **Yes** (Pipeline)| No | **Keep** |
| `engine/notifications/email_service.py`| Resend & SMTP email dispatcher | `smtplib`, `email`, `urllib` | `run_daily_batch.py` | **Yes** (Batch) | No | **Keep** |
| `scripts/run_daily_batch.py` | Scheduled daily polyglot automated runner | `engine.*` | GitHub Actions (`daily_polyglot.yml`) | **Yes** (Cron) | No | **Keep** |
| `scripts/verify_connections.py`| Connection diagnostic & credentials verification | `urllib`, `os` | Developer CLI | **Yes** (CLI) | No | **Keep** |
| `scripts/bootstrap_admin.py` | Admin user bootstrapping tool | `urllib`, `os` | Developer CLI | **Yes** (CLI) | No | **Keep** |
| `scripts/retention_cleanup.py` | 90-day GDPR data purge runner | `urllib`, `datetime` | Scheduled maintenance cron | **Yes** (Cron) | No | **Keep** |
| `scripts/backup_restore.py` | Database export and restore utility | `json`, `urllib` | Developer CLI | **Yes** (CLI) | No | **Keep** |

---

## 6. Unreachable / Orphaned Modules Analysis (63 Modules)

Analysis reveals three primary clusters of unreachable modules:
1. **Unused Barrel Files (32 files):**  
   Files such as `frontend/src/features/spaced-repetition/index.ts`, `frontend/src/services/api/index.ts`, `frontend/src/shared/components/index.ts`. Components within these directories are imported directly by file path rather than through barrel files.
2. **Prototype Feature Views (15 files):**  
   Components built for future roadmap milestones that were never wired into `routes.ts`:
   - `frontend/src/components/practice/LanguageToolStudio.tsx`
   - `frontend/src/features/discover/DiscoverHub.tsx`
   - `frontend/src/features/language-selection/DecoupledLanguageSettings.tsx`
   - `frontend/src/features/language-selection/LanguageCapabilityBadge.tsx`
3. **Alternative Architecture Stubs (16 files):**  
   Experimental content pipeline files (`frontend/src/services/contentEngine/*`) that duplicated `lessonGenerator.ts` functionality without being hooked to the UI.

*Recommendation for Phase 4:* Prune unused barrel files and consolidate verified capabilities from prototype modules into the target content-centred architecture.
