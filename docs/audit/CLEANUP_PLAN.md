# Lexilume — Safe Cleanup, Consolidation & Deletion Plan

> **Non-Negotiable Invariants (Rules 1, 3, 4, 5, 6, 13):**  
> - *Inspect the complete repository before proposing deletions or structural changes.*  
> - *Do not claim a file, component, table, API, or dependency is unused without evidence.*  
> - *Do not delete database migrations or rewrite historical migrations.*  
> - *Do not drop or truncate production tables.*  
> - *Do not remove user data, saved vocabulary, SRS records, mistakes, progress, accounts, or historical activity.*  
> - *Do not perform destructive cleanup until the dependency and migration reports have been reviewed.*

---

## 1. Cleanup Principles & Execution Isolation

1. **Dedicated Cleanup Phase:** Destructive file deletions occur ONLY after target product architecture is completely implemented, verified, and reviewed.
2. **Backward-Compatible Shimming:** Where legacy components are referenced by older tests (e.g. `PortuguesePage.tsx`, `SpanishPage.tsx`), maintain lightweight delegation shims to preserve test suite integrity (`npm test` must always pass).
3. **Database Forward-Only Non-Destructive Invariant:** Production tables are never dropped. Unused legacy columns remain dormant or mapped via database views.

---

## 2. Granular Inventory of Deletion & Consolidation Candidates

### 2.1. Unused Assets & Starter Boilerplate

#### Candidate A: `frontend/src/assets/hero.png` (2.1 MB)
- **Path:** `frontend/src/assets/hero.png`
- **Evidence of Non-Use:** Zero imports across all 799 repository files. Verified by full AST and string scan.
- **Dependencies Affected:** None.
- **User Data Impact:** None.
- **Replacement:** Real-world topic imagery and Lucide SVG icons.
- **Rollback:** `git checkout HEAD -- frontend/src/assets/hero.png`.
- **Action:** **Safe Deletion** in Phase 4 cleanup.

#### Candidate B: `frontend/src/assets/react.svg` (4.1 KB) & `frontend/src/assets/vite.svg` (1.5 KB)
- **Path:** `frontend/src/assets/react.svg`, `frontend/src/assets/vite.svg`
- **Evidence of Non-Use:** Leftover Vite boilerplate. Production favicon is `/favicon.svg`. Zero source imports.
- **Dependencies Affected:** None.
- **User Data Impact:** None.
- **Replacement:** None needed.
- **Action:** **Safe Deletion** in Phase 4 cleanup.

---

### 2.2. Legacy Page Wrappers Consolidation

| Legacy Component Path | Size / Lines | Callers & Test References | Target Consolidation Strategy | User Data Impact | Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `frontend/src/pages/PortuguesePage.tsx` | 8 lines | `App.tsx` (`#portuguese`), `courseTranslationsAndPractice.test.tsx` | Replace body with `<LearnPage language="pt" />`. Retains backwards compatibility. | **Zero** | **Consolidate via Shim** |
| `frontend/src/pages/SpanishPage.tsx` | 8 lines | `App.tsx` (`#spanish`), `courseTranslationsAndPractice.test.tsx` | Replace body with `<LearnPage language="es" />`. Retains backwards compatibility. | **Zero** | **Consolidate via Shim** |
| `frontend/src/pages/EnglishPage.tsx` | 8 lines | `App.tsx` (`#english`), `courseTranslationsAndPractice.test.tsx` | Replace body with `<LearnPage language="en" />`. Retains backwards compatibility. | **Zero** | **Consolidate via Shim** |

---

### 2.3. Empty / Redundant Barrel Exports (`index.ts`)

| File Path | Direct Callers | Analysis | Action |
| :--- | :--- | :--- | :--- |
| `frontend/src/services/api/index.ts` | 0 callers | Empty placeholder barrel export. Callers import adapters directly. | **Remove safely** |
| `frontend/src/features/discover/index.ts` | 0 callers | Single-line export. Components import `pages/CultureExplorePage` directly. | **Consolidate** |
| `frontend/src/features/profile/index.ts` | 0 callers | Single-line export. Direct imports used. | **Consolidate** |
| `frontend/src/features/language-selection/index.ts` | 0 callers | Single-line export. Matrix methods imported from `lib/languages/languageMatrix`. | **Consolidate** |

---

### 2.4. Database Objects Cleanup Policy

- **Tables:** All 26 tables are **preserved**. Historical tables (`language_tracks`, `lesson_assignments`, `daily_lessons`) contain baseline test fixtures and historical migrations (`001` to `014`) that must remain verifiable.
- **Migrations:** Zero modifications to existing `.sql` files. New capabilities introduced in `015`.
- **Triggers & Functions:** Keep all existing security definer functions (`sync_auth_user_role()`, `clean_expired_retention_records()`).

---

## 3. Pre-Cleanup Verification Gate

Before committing any cleanup batch:
```bash
# 1. Verify all 315 Vitest frontend tests pass
npm --prefix frontend test

# 2. Verify TypeScript compile & production Vite build succeed
npm --prefix frontend run build

# 3. Verify all 106 Pytest engine tests pass
python -m pytest tests/ -v
```
All commands must exit with code `0`. Any failure immediately triggers rollback of the candidate file.
