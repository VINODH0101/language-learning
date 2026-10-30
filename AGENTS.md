# Lexilume — AI Assistant & Coding Agent Guidelines

> **Target Audience:** AI Coding Agents, Automated Assistants & Pair Programmers  
> **Repository:** `VINODH0101/language-learning` (Lexilume — Illuminate Your Words)  
> **Status:** Current Ground Truth Architecture & System Invariants

---

## 1. Core System Invariants (Never Violate These)

1. **Zero-Paid AI Mandate**: Never introduce mandatory paid LLM APIs, recurring translation subscriptions, or proprietary external AI services. The application must function reliably using open educational datasets (Wiktionary, Tatoeba, Wikipedia) and deterministic synthesis engines. Optional Gemini API integration must always have full deterministic fallbacks.
2. **Local-First Functionality**: Core learning activities, SM-2 reviews, vocabulary browsing, and placement testing must operate offline in browser storage via Dexie / IndexedDB and localStorage.
3. **Four-Way Linguistic Decoupling**:
   - `interface_language`: Controls UI navigation and buttons (`en`, `pt`, `es`).
   - `learning_language`: The target language actively being acquired (`pt`, `es`, `en`).
   - `explanation_language`: The pedagogical language for grammar notes and definitions (`en`, `pt`, `es`).
   - `regional_variety`: The dialect/accent strictly bound to the target learning language (`pt-BR`, `pt-PT`, `es-ES`, `es-MX`, `en-US`, etc.).
   - *Never conflate these concerns!* Regional variety must never be assigned to interface or explanation languages. Mismatched varieties must be normalized via `enforceRegionalVariety` and rejected by backend Pydantic validation (`validate_regional_variety`).
4. **Tenant & Account Isolation**:
   - LocalStorage keys in `StorageService` are scoped by user ID to prevent data leakage between users on shared devices.
   - `localDb` sync queue items store `user_id` so mutations are never uploaded under another user's session.
5. **No Machine-Specific Paths in Documentation**: Always use repository-relative paths (e.g. `frontend/src/services/courseService.ts`) rather than absolute machine paths.
6. **No Fabricated Statistics or Test Claims**: Document verified numbers only based on actual CLI execution.

---

## 2. Key Files & Services Map

| Responsibility | Frontend Path | Backend / Engine Path |
| :--- | :--- | :--- |
| **Language Matrix & Scoping** | `frontend/src/lib/languages/languageMatrix.ts` | `engine/models/enums.py` |
| **Multi-Course Management** | `frontend/src/services/courseService.ts` | `engine/storage/repository.py` |
| **Deterministic Lesson Generator** | `frontend/src/services/lessonGenerator.ts` | `engine/generators/template_engine.py` |
| **Spaced Repetition (SM-2)** | `frontend/src/services/srs.ts` | `engine/srs/sm2.py` |
| **Local Database (IndexedDB)** | `frontend/src/services/localDb.ts` (Dexie) | N/A |
| **Offline Mutation Sync** | `frontend/src/services/syncEngine.ts` | N/A |
| **External API Integration** | `frontend/src/integrations/external-apis/` | `engine/sources/` |
| **Speech Audio (TTS)** | `frontend/src/services/speech.ts` | N/A |
| **Study Pack PDF Service** | `frontend/src/services/pdfService.ts` (jsPDF) | N/A |
| **Database Migrations & DDL** | N/A | `supabase/migrations/` (001 to 009) |
| **Daily Automation Runner** | N/A | `.github/workflows/daily_polyglot.yml`, `scripts/run_daily_batch.py` |

---

## 3. Standard Verification Commands

Before concluding any implementation turn, run:
```bash
# Frontend Unit Tests (Vitest)
npm --prefix frontend test -- --run

# Frontend TypeScript & Vite Production Build
npm --prefix frontend run build

# Python Engine Tests (Pytest)
python -m pytest tests/ -v
```
All commands must exit with code `0`.
