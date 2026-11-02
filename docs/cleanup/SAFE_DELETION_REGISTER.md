# Lexilume — Safe Deletion Register

> **Target Standard:** Phase 6 Safe Deletion Protocol  
> **Repository:** `VINODH0101/language-learning`  
> **Branch:** `phase-6-safe-cleanup`  
> **Scope:** Granular register of all 38 verified unused files (35 TypeScript/TSX modules + 3 static assets) safely removed during Phase 6 execution.

---

## 1. Verified Asset Removals (Commit `c5a380e`)

| Item | Previous Location | Evidence of Non-Use | References Checked | Tests | Decision |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `hero.png` | `frontend/src/assets/hero.png` (13,057 B) | 0 static or dynamic string references across all repository files. Initial template placeholder. | All `.ts`, `.tsx`, `.html`, `.css`, `public/` | Vitest (310/310), Vite Build (Pass), Pytest (106/106) | **Permanently Removed** |
| `react.svg` | `frontend/src/assets/react.svg` (4,126 B) | 0 occurrences in source or templates. Default React starter boilerplate. Icons handled by Lucide React. | All `.ts`, `.tsx`, `.html`, `.css`, `public/` | Vitest (310/310), Vite Build (Pass), Pytest (106/106) | **Permanently Removed** |
| `vite.svg` | `frontend/src/assets/vite.svg` (8,709 B) | 0 occurrences. Default Vite starter boilerplate. Production favicon is `frontend/public/favicon.svg`. | All `.ts`, `.tsx`, `.html`, `.css`, `public/` | Vitest (310/310), Vite Build (Pass), Pytest (106/106) | **Permanently Removed** |

---

## 2. Verified Prototype & Dead Code Removals (Commit `5834739`)

| Item | Previous Location | Evidence of Non-Use | References Checked | Tests | Decision |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `LanguageToolStudio.tsx` | `frontend/src/components/practice/LanguageToolStudio.tsx` | 242-line unrouted prototype. 0 routes in `App.tsx` or `useAppRouter.ts`. Superseded by `WritingCoach.tsx`. | AST imports, string scans, route paths | Vitest (310/310), Vite Build (Pass) | **Permanently Removed** |
| `useDashboard.ts` | `frontend/src/features/dashboard/useDashboard.ts` | 156-line orphaned hook. State management is self-contained inside `DashboardView.tsx`. 0 callers. | AST imports, reverse dependency graph | Vitest (310/310), Vite Build (Pass) | **Permanently Removed** |
| `types.ts` | `frontend/src/features/progress/types.ts` | 33-line unused type file. `ProgressFilterState`, `CEFRLevelProgress`, etc. duplicated in canonical `types/index.ts`. | AST imports, type consumers | Vitest (310/310), Vite Build (Pass) | **Permanently Removed** |
| `theme.ts` | `frontend/src/styles/theme.ts` | 37-line unused theme constant. `THEME_TOKENS` object had 0 imports; styling uses Tailwind CSS classes directly. | AST imports, CSS/HTML tokens | Vitest (310/310), Vite Build (Pass) | **Permanently Removed** |
| `env.ts` | `frontend/src/config/environment/env.ts` | 42-line unused configuration wrapper. Contained forbidden `VITE_GEMINI_API_KEY` violation. 0 consumers. | AST imports, environment references | Vitest (310/310), Vite Build (Pass) | **Permanently Removed** |
| `index.ts` | `frontend/src/config/features/index.ts` | 19-line unused feature flags file. `FEATURES` object had 0 imports across application. | AST imports, feature flag scans | Vitest (310/310), Vite Build (Pass) | **Permanently Removed** |
| `index.ts` | `frontend/src/shared/hooks/index.ts` | 21-line unreferenced hook facade. Exported `useDebounce` which had 0 callers in codebase. | AST imports, hook callers | Vitest (310/310), Vite Build (Pass) | **Permanently Removed** |
| `index.ts` | `frontend/src/shared/types/index.ts` | 7-line bypassed re-export. Callers import `frontend/src/types/` directly. | AST imports, type callers | Vitest (310/310), Vite Build (Pass) | **Permanently Removed** |
| `index.ts` | `frontend/src/shared/components/index.ts` | 14-line bypassed re-export. Callers import atomic components from `components/common/` directly. | AST imports, component consumers | Vitest (310/310), Vite Build (Pass) | **Permanently Removed** |
| `stringUtils.ts` | `frontend/src/shared/utils/stringUtils.ts` | 44-line unreferenced utility. String normalization is canonically provided by `StringNormalizer` in `practiceEngine.ts`. | AST imports, utility callers | Vitest (310/310), Vite Build (Pass) | **Permanently Removed** |
| `errorHandler.ts` | `frontend/src/shared/utils/errorHandler.ts` | 97-line unreferenced class. Application uses native Error, Sonner toasts, and inline try/catch blocks. | AST imports, error handling calls | Vitest (310/310), Vite Build (Pass) | **Permanently Removed** |
| `DecoupledLanguageSettings.tsx` | `frontend/src/features/language-selection/DecoupledLanguageSettings.tsx` | 134-line orphaned prototype settings component. 0 callers outside folder. Settings handled in `SettingsPage.tsx`. | AST imports, page routes, modals | Vitest (310/310), Vite Build (Pass) | **Permanently Removed** |
| `LanguageCapabilityBadge.tsx` | `frontend/src/features/language-selection/LanguageCapabilityBadge.tsx` | 25-line component used only within orphaned `language-selection` directory. 0 external callers. | AST imports, component consumers | Vitest (310/310), Vite Build (Pass) | **Permanently Removed** |
| `LanguageSelector.tsx` | `frontend/src/features/language-selection/LanguageSelector.tsx` | 78-line duplicate selector. Application uses `InterfaceLanguageSelector.tsx` in `Navigation.tsx`. 0 external callers. | AST imports, component consumers | Vitest (310/310), Vite Build (Pass) | **Permanently Removed** |
| `RegionalVarietySelector.tsx` | `frontend/src/features/language-selection/RegionalVarietySelector.tsx` | 57-line selector used only by `DecoupledLanguageSettings.tsx`. Dialect selection handled in `SettingsPage.tsx`. | AST imports, component consumers | Vitest (310/310), Vite Build (Pass) | **Permanently Removed** |
| `index.ts` | `frontend/src/features/language-selection/index.ts` | 4-line barrel for orphaned `language-selection` folder. 0 external callers. | AST imports, reverse dependency graph | Vitest (310/310), Vite Build (Pass) | **Permanently Removed** |

---

## 3. Verified Bypassed Barrel Re-export Removals (Commit `5834739`)

All of the following `index.ts` files were verified to have **0 callers** across all application source and test files because consumers import the concrete modules directly:

| Item | Previous Location | Direct Destination Imported by Callers | Callers Verified | Tests | Decision |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `index.ts` | `frontend/src/config/languages/index.ts` | `frontend/src/config/languages/languageRegistry.ts` | 0 callers to barrel | Vitest (310/310) | **Permanently Removed** |
| `index.ts` | `frontend/src/features/admin/index.ts` | `frontend/src/features/admin/AdminWorkbench.tsx` | 0 callers to barrel | Vitest (310/310) | **Permanently Removed** |
| `index.ts` | `frontend/src/features/discover/index.ts` | `frontend/src/pages/CultureExplorePage.tsx` | 0 callers to barrel | Vitest (310/310) | **Permanently Removed** |
| `index.ts` | `frontend/src/features/onboarding/index.ts` | `frontend/src/components/onboarding/GuidedOnboardingModal.tsx` | 0 callers to barrel | Vitest (310/310) | **Permanently Removed** |
| `index.ts` | `frontend/src/features/practice/index.ts` | `frontend/src/pages/PracticePage.tsx` | 0 callers to barrel | Vitest (310/310) | **Permanently Removed** |
| `index.ts` | `frontend/src/features/profile/index.ts` | `frontend/src/features/profile/AvatarCustomizer.tsx` | 0 callers to barrel | Vitest (310/310) | **Permanently Removed** |
| `index.ts` | `frontend/src/features/spaced-repetition/index.ts` | `frontend/src/services/srs.ts` | 0 callers to barrel | Vitest (310/310) | **Permanently Removed** |
| `index.ts` | `frontend/src/features/translation/index.ts` | `frontend/src/services/translate.ts` | 0 callers to barrel | Vitest (310/310) | **Permanently Removed** |
| `index.ts` | `frontend/src/features/vocabulary/index.ts` | `frontend/src/features/vocabulary/VocabularyExplorer.tsx` | 0 callers to barrel | Vitest (310/310) | **Permanently Removed** |
| `index.ts` | `frontend/src/features/world/index.ts` | `frontend/src/features/world/LexilumeWorldHub.tsx` | 0 callers to barrel | Vitest (310/310) | **Permanently Removed** |
| `index.ts` | `frontend/src/i18n/index.ts` | `frontend/src/i18n/config.ts` | 0 callers to barrel | Vitest (310/310) | **Permanently Removed** |
| `index.ts` | `frontend/src/services/api/index.ts` | Concrete service adapters | 0 callers to barrel | Vitest (310/310) | **Permanently Removed** |
| `interfaces.ts` | `frontend/src/services/api/interfaces.ts` | Sole caller was `services/api/index.ts` | 0 callers outside barrel | Vitest (310/310) | **Permanently Removed** |
| `index.ts` | `frontend/src/services/cache/index.ts` | `frontend/src/services/cache/providerCache.ts` | 0 callers to barrel | Vitest (310/310) | **Permanently Removed** |
| `index.ts` | `frontend/src/services/database/index.ts` | `frontend/src/services/localDb.ts` | 0 callers to barrel | Vitest (310/310) | **Permanently Removed** |
| `index.ts` | `frontend/src/services/monitoring/index.ts` | `frontend/src/services/monitoring/providerHealth.ts` | 0 callers to barrel | Vitest (310/310) | **Permanently Removed** |
| `index.ts` | `frontend/src/services/normalization/index.ts` | `frontend/src/services/normalization/responseNormalizers.ts` | 0 callers to barrel | Vitest (310/310) | **Permanently Removed** |
| `index.ts` | `frontend/src/services/sync/index.ts` | `frontend/src/services/syncEngine.ts` | 0 callers to barrel | Vitest (310/310) | **Permanently Removed** |
| `index.ts` | `frontend/src/services/validation/index.ts` | `frontend/src/services/validation/schemas.ts` | 0 callers to barrel | Vitest (310/310) | **Permanently Removed** |

---

## 4. Retained & Preserved Inventory (Deliberately Not Deleted)

| Item | Location | Reason for Retention | Verification Evidence |
| :--- | :--- | :--- | :--- |
| `PortuguesePage.tsx` | `frontend/src/pages/PortuguesePage.tsx` | Active route `#portuguese` in `App.tsx` | Tested in `courseTranslationsAndPractice.test.tsx` |
| `SpanishPage.tsx` | `frontend/src/pages/SpanishPage.tsx` | Active route `#spanish` in `App.tsx` | Tested in `courseTranslationsAndPractice.test.tsx` |
| `EnglishPage.tsx` | `frontend/src/pages/EnglishPage.tsx` | Active route `#english` in `App.tsx` | Tested in `courseTranslationsAndPractice.test.tsx` |
| `localeFormatting.ts` | `frontend/src/shared/utils/localeFormatting.ts` | Internationalized date/number utility | Tested in `languageRegistry.test.ts` |
| `textProcessing.ts` | `frontend/src/shared/utils/textProcessing.ts` | Tokenization & text sanitization utility | Tested in `languageRegistry.test.ts` |
| `contentEngine/` | `frontend/src/services/contentEngine/` | Content pipeline & pedagogical validator | Tested by 19 tests in `contentPipeline.test.ts` |
| `services/auth/index.ts` | `frontend/src/services/auth/index.ts` | Active facade | 21 active callers across frontend |
| `services/storage/index.ts`| `frontend/src/services/storage/index.ts` | Active facade | 35 active callers across frontend |
| `dashboard/components/index.ts` | `frontend/src/features/dashboard/components/index.ts` | Active component barrel | Imported by `DashboardView.tsx` |
| `progress/components/index.ts` | `frontend/src/features/progress/components/index.ts` | Active component barrel | Imported by `ProgressPage.tsx` |
