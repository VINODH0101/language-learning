# 11. Evidence and Findings

> **Audit Date:** 2026-10-29  
> **Repository:** `language-learning`  
> **Scope:** Empirical CLI logs, code citations, and test verification output backing the audit findings.

---

## 1. Verified Test Execution Evidence

### 1.1 Frontend Vitest Suite
```text
> frontend@0.0.0 test
> vitest run --run

 RUN  v5.0.5 C:/Users/vinod/OneDrive/Desktop/language-learning/frontend

 ✓ src/tests/srs.test.ts (5 tests) 8ms
 ✓ src/tests/localDb.test.ts (4 tests) 9ms
 ✓ src/tests/cultureExplore.test.ts (9 tests) 20ms
 ✓ src/tests/vocabulary.test.ts (9 tests) 47ms
 ✓ src/tests/translate.test.ts (7 tests) 13ms
 ✓ src/tests/lessonGenerator.test.ts (5 tests) 28ms
 ✓ src/tests/multilingual.test.ts (10 tests) 28ms
 ✓ src/tests/storage.test.ts (4 tests) 11ms
 ✓ src/tests/i18n.test.ts (2 tests) 10ms
 ✓ src/tests/languageDecoupling.test.ts (17 tests) 540ms
   ✓ Enforce Separation between Interface, Learning, Explanation, and Regional Variety (17)
     ✓ 3. Multi-Course Regional Variety and Explanation Decoupling (3)
       ✓ enforces valid regional varieties when creating courses 485ms
 ✓ src/tests/syncEngine.test.ts (4 tests) 9ms
 ✓ src/tests/auth.test.ts (7 tests) 11ms
 ✓ src/tests/course.test.ts (5 tests) 6ms

 ✓ src/tests/navigation.test.tsx (6 tests) 1391ms

 Test Files  14 passed (14)
      Tests  94 passed (94)
   Start at  22:42:56
   Duration  8.78s
```

### 1.2 Backend Pytest Suite
```text
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.2.0, pluggy-1.7.0
rootdir: C:\Users\vinod\OneDrive\Desktop\language-learning
collected 78 items

tests\test_auth_and_admin_migrations.py ...                              [  3%]
tests\test_course_and_multilingual_migrations.py ..                      [  6%]
tests\test_cultural_bookmarks_migrations.py ..                           [  8%]
tests\test_curriculum.py .....                                           [ 15%]
tests\test_curriculum_extended.py ....                                   [ 20%]
tests\test_diagnostic.py ..                                              [ 23%]
tests\test_email_workflow.py ....                                        [ 28%]
tests\test_engine_facade.py ....                                         [ 33%]
tests\test_exercises.py .....                                            [ 39%]
tests\test_false_friends.py .                                            [ 41%]
tests\test_generator.py ....                                             [ 46%]
tests\test_language_separation.py .....                                  [ 52%]
tests\test_models.py ...                                                 [ 56%]
tests\test_reading_providers.py ...                                      [ 60%]
tests\test_retention_extended.py ..                                      [ 62%]
tests\test_security_and_config.py ...                                    [ 66%]
tests\test_sources.py ........                                           [ 76%]
tests\test_srs.py ....                                                   [ 82%]
tests\test_storage_and_retention.py ..                                   [ 84%]
tests\test_translation_service.py .......                                [ 93%]
tests\test_wikipedia_source.py .....                                     [100%]

============================= 78 passed in 1.15s ==============================
```

### 1.3 TypeScript & Vite Production Build
```text
> frontend@0.0.0 build
> tsc -b && vite build

vite v8.3.5 building client environment for production...
transforming...
✓ 2342 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                          0.45 kB │ gzip:   0.29 kB
dist/assets/index-BOA3HqTc.css          69.69 kB │ gzip:  10.96 kB
dist/assets/purify.es-Dqk5qvad.js       29.02 kB │ gzip:  11.45 kB
dist/assets/index.es-CcRgjWG4.js       151.37 kB │ gzip:  48.88 kB
dist/assets/html2canvas-CP6Mq5PW.js    199.39 kB │ gzip:  46.73 kB
dist/assets/index-WOkTzJib.js        1,564.11 kB │ gzip: 448.59 kB
✓ built in 1.19s
```

---

## 2. Key Code Citations

### 2.1 Pydantic Model Validator for Regional Variety (`engine/models/lesson.py`)
```python
@model_validator(mode="after")
def check_regional_variety_compatibility(self) -> Self:
    from engine.models.enums import is_valid_regional_variety_for_language
    if not is_valid_regional_variety_for_language(self.target_language, self.regional_variety):
        raise ValueError(
            f"Regional variety '{self.regional_variety}' is not valid for target language '{self.target_language}'."
        )
    return self
```

### 2.2 Frontend Regional Variety Normalizer (`frontend/src/lib/languages/languageMatrix.ts`)
```typescript
export function enforceRegionalVariety(
  language: LearningLanguage,
  variety: string | null | undefined
): RegionalVariety {
  if (variety && isValidRegionalVariety(language, variety)) {
    return variety as RegionalVariety;
  }
  return DEFAULT_REGIONAL_VARIETY[language];
}
```
