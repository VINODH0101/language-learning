# Lexilume — Frontend Cleanup & Architectural Boundary Report

> **Repository:** `VINODH0101/language-learning`  
> **Production Application:** `https://lexi.monster`  
> **Branch:** `phase-6-safe-cleanup`  
> **Phase:** Phase 6 — Safe Cleanup  
> **Focus Area:** Frontend Architecture, Boundaries, Dead Code Removal & Maintainability

---

## 1. Executive Summary

During Phase 6, the frontend codebase underwent a comprehensive, evidence-based cleanup. Unrouted prototype components, unreferenced hook duplicates, bypassed barrel files, dead theme constants, and unused imports were removed. Crucially, all production routes, active course screens, authentication mechanisms, local storage keys, and Dexie database structures were preserved with 100% test integrity (37/37 Vitest test files passed, 310/310 tests passed).

---

## 2. Removed Frontend Code & Modules

### 2.1 Dead Components & Prototypes
- **`frontend/src/components/practice/LanguageToolStudio.tsx` (242 lines):**
  - An early prototype of grammar proofreading.
  - Superseded by `frontend/src/features/writing/WritingCoach.tsx` which integrates with `ProofreadingService` and is tested in `writingAndSpeaking.test.tsx`.
  - Had 0 routes in `App.tsx` and 0 test consumers.
- **`frontend/src/features/language-selection/` (5 files, 298 lines):**
  - Unrouted prototype directory (`DecoupledLanguageSettings.tsx`, `LanguageCapabilityBadge.tsx`, `LanguageSelector.tsx`, `RegionalVarietySelector.tsx`, `index.ts`).
  - Production settings are managed in `frontend/src/pages/SettingsPage.tsx`, and language switching is handled by `InterfaceLanguageSelector.tsx`.
  - Had 0 external callers and 0 test references.

### 2.2 Unused Hooks & State Management Duplicates
- **`frontend/src/features/dashboard/useDashboard.ts` (156 lines):**
  - An orphaned hook that duplicated the state machine of `DashboardView.tsx`.
  - `DashboardView.tsx` manages active course subscription, lesson synchronization, SRS due counts, and daily poetry/conversation modals directly.
  - `useDashboard.ts` was never hooked up or tested.

### 2.3 Obsolete Types & Design System Artifacts
- **`frontend/src/features/progress/types.ts` (33 lines):**
  - Unused types whose canonical definitions reside in `frontend/src/types/index.ts`.
- **`frontend/src/styles/theme.ts` (37 lines):**
  - `THEME_TOKENS` object had 0 imports across the application; Tailwind CSS utility classes are used directly in all TSX components.
- **`frontend/src/config/environment/env.ts` (42 lines):**
  - Unused configuration wrapper that contained an illicit reference to `VITE_GEMINI_API_KEY`.
  - Its deletion eliminates the risk of introducing bundled client-side Gemini credentials, reinforcing Invariant 1 (Zero-Paid AI Mandate).
- **`frontend/src/config/features/index.ts` (19 lines):**
  - Unused static feature flags (`FEATURES`) with 0 callers.

### 2.4 Unused Utility Facades
- **`frontend/src/shared/utils/stringUtils.ts` (44 lines):**
  - Duplicate string normalization methods (`normalizeText`, `areStringsEquivalent`).
  - Canonical text normalization is provided by `StringNormalizer` in `features/practice/engine/practiceEngine.ts`.
- **`frontend/src/shared/utils/errorHandler.ts` (97 lines):**
  - Unused custom error hierarchy. Production code handles errors with native `Error`, Sonner toast notifications, and localized feedback messages.

### 2.5 Bypassed Barrel Re-exports (19 Files)
- Removed 19 empty or single-export `index.ts` files across `config/`, `features/`, and `services/` where callers consistently import the concrete module directly:
  - `config/languages/index.ts`
  - `features/admin/index.ts`
  - `features/discover/index.ts`
  - `features/onboarding/index.ts`
  - `features/practice/index.ts`
  - `features/profile/index.ts`
  - `features/spaced-repetition/index.ts`
  - `features/translation/index.ts`
  - `features/vocabulary/index.ts`
  - `features/world/index.ts`
  - `i18n/index.ts`
  - `services/api/index.ts` & `services/api/interfaces.ts`
  - `services/cache/index.ts`
  - `services/database/index.ts`
  - `services/monitoring/index.ts`
  - `services/normalization/index.ts`
  - `services/sync/index.ts`
  - `services/validation/index.ts`

---

## 3. Preserved Architecture & Boundaries

The following architectural layers were verified and strictly preserved:

### 3.1 Pages & Routes Layer
- Preserved `PortuguesePage.tsx`, `SpanishPage.tsx`, `EnglishPage.tsx`:
  - Verified as active routes in `App.tsx` (`#portuguese`, `#spanish`, `#english`) and essential test fixtures in `courseTranslationsAndPractice.test.tsx`.
- Preserved `DashboardPage.tsx`, `CultureExplorePage.tsx`, `PracticePage.tsx`, `ProgressPage.tsx`, `SettingsPage.tsx`, `TranslatePage.tsx`, `VocabularyPage.tsx`, `AdminPage.tsx`.

### 3.2 Service Boundaries
- **Authentication Service (`services/auth.ts` & `services/auth/index.ts`):**
  - Untouched public API (`signUp`, `signIn`, `signOut`, `getState`, `subscribe`).
  - Active re-export facade preserved (21 callers).
- **Storage Service (`services/storage.ts` & `services/storage/index.ts`):**
  - Untouched user-scoped storage API (`getKey`, `migrateGuestData`, `getSettings`, `getSRSItems`).
  - Active re-export facade preserved (35 callers).
- **Local Database (`services/localDb.ts`):**
  - Untouched Dexie schema (Version 4, 8 stores).
  - Unbroken indexed collections and in-memory fallback.
- **Sync Engine (`services/syncEngine.ts`):**
  - Untouched offline queue processing and idempotent Supabase synchronization.
- **Content Engine (`services/contentEngine/`):**
  - Untouched pipeline and validators tested by `contentPipeline.test.ts`.

---

## 4. Maintainability & Code Quality Improvements (Commit `821fade`)

Unused imported identifiers and unreferenced parameters identified by `oxlint` were cleaned up across 9 files:
1. `src/components/common/Navigation.tsx`:
   - Removed unused `Library` icon import from `lucide-react`.
   - Removed unused `InterfaceLanguage` type import.
   - Removed unused `interfaceLanguage` and `setInterfaceLanguage` state extractions from `useI18n()`.
2. `src/features/admin/AdminContentReview.tsx`:
   - Removed unused `AlertTriangle`, `Filter`, `Eye`, `FileCheck` icons from `lucide-react`.
   - Removed unused `ContentReviewStatus` type import.
3. `src/services/providers/speech/voskProvider.ts`:
   - Prefixed unused parameter `_input: VoskRecognitionInput` in `fetchRaw` to conform to TypeScript lint rules.
4. `src/tests/adminWorkbenchRedesign.test.tsx`:
   - Removed unused `fireEvent`, `waitFor` imports from `@testing-library/react`.
   - Removed unused `AdminWorkbench`, `AdminDailyContentStudio` imports.
5. `src/tests/vocabulary.test.ts`:
   - Removed unused `jsPDF` import.
6. `src/tests/advancedFeatures/lexicalAndSRS.test.tsx`:
   - Removed unused `SRSService` import.
7. `src/tests/languageRegistry.test.ts`:
   - Removed unused `getRegionalVariants` import.
8. `src/tests/languageDecoupling.test.ts`:
   - Removed unused `REGIONAL_VARIETIES_BY_LANGUAGE` and `getLanguageName` imports.
9. `src/tests/advancedFeatures/conversationAndDiscover.test.tsx`:
   - Replaced unused `const speakSpy` declaration with direct `vi.spyOn(SpeechService, 'speak').mockResolvedValue()`.

---

## 5. Verification Results

| Gate | Command | Output | Status |
| :--- | :--- | :--- | :--- |
| **Frontend Unit Tests** | `npm --prefix frontend test` | `Test Files 37 passed (37), Tests 310 passed (310)` | **PASS (33.39s)** |
| **Frontend Production Build** | `npm --prefix frontend run build` | `tsc -b && vite build` (2,775 modules) | **PASS (2.02s)** |
| **Engine Tests** | `python -m pytest tests/ -v` | `106 passed, 1 skipped` | **PASS (5.22s)** |

---

## 6. Remaining Technical Debt & Future Phase 7 Considerations

1. **CourseView Unification:**
   `PortuguesePage`, `SpanishPage`, and `EnglishPage` are thin 8-line wrappers around `<CourseView language="..." />`. In Phase 7, when multi-course switching is consolidated in the new content-centred UI, these can be refactored to delegate to a single dynamic `LearnPage` while maintaining forward-compatible shims for legacy bookmarks.
2. **Component Folder Consolidation:**
   Presentational components are split across `frontend/src/components/` (atomic/shared) and `frontend/src/features/` (domain-specific). This separation is clean and functional, but can be further streamlined as new content-reading views are introduced in Phase 7.
