# Lexilume — Unused Code, Dead Assets & Consolidation Audit

> **Target Standard:** Rule 3 — *Do not claim a file, component, table, API, or dependency is unused without evidence. Check dynamic imports, route registries, manifests, SQL references, configuration, runtime string references, generated files, and external integrations.*

---

## 1. Summary of Candidates & Risk Categorization

Every file identified as potentially redundant or unused was evaluated across 4 strict criteria:
1. **Static AST Analysis:** Direct imports and reverse dependency graph.
2. **Textual & String References:** Dynamic imports (`import()`), route constants, template literals, and i18n keys.
3. **Runtime Execution & Test Harnesses:** Verification against Vitest (315 tests), Pytest (106 tests), and CLI batch runners.
4. **Data Persistence Impact:** Verification that deletion does NOT affect Supabase tables, Dexie collections, or LocalStorage tenant keys.

---

## 2. Detailed Candidate Assessment

### 2.1. Legacy Language-Specific Page Wrappers

#### A. `frontend/src/pages/PortuguesePage.tsx`
- **Purpose:** 8-line legacy wrapper that renders `<CourseView language="pt" />`.
- **Direct Dependencies:** `react`, `CourseView`.
- **Reverse Dependencies:** `App.tsx` (route `#portuguese`), `frontend/src/tests/courseTranslationsAndPractice.test.tsx`.
- **Evidence of Redundancy:** Identical to `<CourseView language="pt" />` or `<LearnPage language="pt" />`. Does not include course switcher, level controls, or multi-course context.
- **User Data Impact:** **Zero.** Learner progress is saved in `localDb.activeLessonProgress` and `StorageService` by `course_id` / `language`.
- **Replacement:** Refactor legacy route `#portuguese` to render the unified `LearnPage` with Portuguese preselected, or retain thin backward-compatibility shim until all legacy aliases are retired.
- **Rollback Procedure:** `git checkout HEAD -- frontend/src/pages/PortuguesePage.tsx`.

#### B. `frontend/src/pages/SpanishPage.tsx`
- **Purpose:** 8-line legacy wrapper that renders `<CourseView language="es" />`.
- **Direct Dependencies:** `react`, `CourseView`.
- **Reverse Dependencies:** `App.tsx` (route `#spanish`), `frontend/src/tests/courseTranslationsAndPractice.test.tsx`.
- **Evidence of Redundancy:** Identical wrapper duplication.
- **User Data Impact:** **Zero.**
- **Replacement:** Delegate to unified `LearnPage` with Spanish preset.
- **Rollback Procedure:** `git checkout HEAD -- frontend/src/pages/SpanishPage.tsx`.

#### C. `frontend/src/pages/EnglishPage.tsx`
- **Purpose:** 8-line legacy wrapper that renders `<CourseView language="en" />`.
- **Direct Dependencies:** `react`, `CourseView`.
- **Reverse Dependencies:** `App.tsx` (route `#english`), `frontend/src/tests/courseTranslationsAndPractice.test.tsx`.
- **Evidence of Redundancy:** Identical wrapper duplication.
- **User Data Impact:** **Zero.**
- **Replacement:** Delegate to unified `LearnPage` with English preset.
- **Rollback Procedure:** `git checkout HEAD -- frontend/src/pages/EnglishPage.tsx`.

---

### 2.2. Unused Default Assets

| Asset Path | Size | Origin | Evidence of Non-Use | Target Replacement | Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `frontend/src/assets/hero.png` | 2.1 MB | Early template placeholder | Zero occurrences in all source files, CSS, and HTML | Curated topic thumbnails & SVG icons | **Archive / Safe Removal** |
| `frontend/src/assets/react.svg` | 4.1 KB | Vite default starter boilerplate | Zero occurrences; application uses Lucide React icons | None needed | **Archive / Safe Removal** |
| `frontend/src/assets/vite.svg` | 1.5 KB | Vite default starter boilerplate | Zero occurrences; favicon is `/favicon.svg` | None needed | **Archive / Safe Removal** |

---

### 2.3. Python Cache Artifacts & Temporary Fixtures

| Directory / Artifact | Size | Origin | Purpose / Evaluation | Action |
| :--- | :--- | :--- | :--- | :--- |
| `engine/**/__pycache__/` | ~1.8 MB | Python runtime bytecode compilation | Transient execution artifacts (`.pyc`). Ignored by git in standard workflow. | **Exclude from inventory**; clean via `find . -name "*.pyc" -delete` |
| `engine/sources/.cache/` | ~350 KB | Local offline cached Wikipedia articles | Offline test fixtures and network resilience caches. **Used by offline source tests.** | **Retain** (Essential for Zero-Paid AI & offline local tests) |
| `engine/sources/fixtures/` | ~45 KB | Curated Wiktionary & Tatoeba test fixtures | Required by `tests/test_sources.py` and `tests/test_wikipedia_source.py`. | **Retain** (Test baseline integrity) |

---

### 2.4. Duplicate Barrel Exports (`index.ts`)

Several directories contain empty or single-export `index.ts` files that are bypassed by direct imports:

| Barrel File | Contents | Real Callers | Status | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| `frontend/src/features/discover/index.ts` | Re-exports `CultureExplorePage` | Components import from `pages/CultureExplorePage` directly | Bypass | **Consolidate** |
| `frontend/src/features/profile/index.ts` | Re-exports `UserProfileModal` | Direct imports used | Bypass | **Consolidate** |
| `frontend/src/features/language-selection/index.ts` | Re-exports Language Matrix modal | Direct imports from `languageMatrix.ts` | Bypass | **Consolidate** |
| `frontend/src/services/api/index.ts` | Empty or placeholder re-export | Direct imports to adapters | Unused | **Remove safely in cleanup phase** |
| `frontend/src/services/database/index.ts` | Re-exports `localDb` | Callers import from `services/localDb` directly | Duplicate | **Consolidate** |

---

## 3. Safe Cleanup Protocol (Part 9 Execution Rules)

1. **Phase 1: Zero Destructive Action During Planning**: All candidate files remain untouched during architecture specification and review.
2. **Phase 2: Forward Shims Before Deletion**: When retiring legacy page wrappers (`PortuguesePage.tsx`, `SpanishPage.tsx`, `EnglishPage.tsx`), maintain forward-compatible exports delegating to `LearnPage` to ensure all existing test suites (`courseTranslationsAndPractice.test.tsx`) pass without modification.
3. **Phase 3: Automated Verification Gate**: Any deletion must be tested via:
   ```bash
   npm --prefix frontend test
   npm --prefix frontend run build
   python -m pytest tests/ -v
   ```
4. **Phase 4: Explicit Git Commit Isolation**: Cleanup actions must be committed independently with clear messages (e.g. `chore(cleanup): remove unused vite starter assets`).
