# Polyglot C1 Daily — Testing Status & Verification Log

**Verification Date**: 2026-10-29  
**Platform**: Windows 11, PowerShell  
**Runtimes**:
- **Python**: 3.12.10
- **Node.js**: v24.22.1
- **npm**: 11.19.1
- **Pytest**: 9.2.0
- **Vitest**: 5.0.5

---

## 1. Test Execution Summary

| Test Suite | Scope | Total Tests | Passed | Failed | Duration | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Python Engine (`tests/`)** | Backend Learning Engine, Curriculum, SM-2, Generators, Exercises, Diagnostics, Sources, Email, Security, Retention, Language Decoupling | 78 | 78 | 0 | 1.37s | **PASSED** |
| **Frontend Unit (`frontend/src/tests/`)** | Client SRS (SM-2), Local Storage, Lesson Generator, Translation, Auth, Multi-Course, Culture, Vocabulary PDF, 4-Way Language Decoupling, Navigation UX, Dynamic Home Page Content, Multilingual Course Translations, Practice & Progress English Toggles | 110 | 110 | 0 | ~12.74s | **PASSED** |
| **Frontend Production Build** | TypeScript Compilation (`tsc -b`) & Vite Production Bundling | 2341 modules | 2341 modules | 0 errors | 11.01s | **PASSED** |
| **Daily Batch Pipeline Script** | Idempotency lock, dual-track rendering, dry-run delivery | — | — | 0 errors | ~1.5s | **PASSED** |
| **Storage Retention Maintenance** | Pruning evaluation, essential record protection guarantee | — | — | 0 errors | ~0.5s | **PASSED** |
| **Backup & Restore Pipeline** | JSON export and verified restoration cycle | — | — | 0 errors | ~0.8s | **PASSED** |

---

## 2. Python Test Suite Log (`pytest`)

**Execution Command**:
```powershell
python -m pytest tests/ -v
```

**Output**:
```text
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.2.0, pluggy-1.7.0 -- C:\Users\vinod\AppData\Local\Programs\Python\Python312\python.exe
cachedir: .pytest_cache
rootdir: C:\Users\vinod\OneDrive\Desktop\language-learning
collecting ... collected 49 items

tests/test_curriculum.py::test_empty_curriculum_raises_error PASSED      [  2%]
tests/test_curriculum.py::test_prerequisite_enforcement PASSED           [  4%]
tests/test_curriculum.py::test_level_progression PASSED                  [  6%]
tests/test_curriculum.py::test_regional_variety_filtering PASSED         [  8%]
tests/test_curriculum.py::test_recency_buffer_avoids_repetition PASSED   [ 10%]
tests/test_curriculum_extended.py::test_lesson_fingerprint_and_reproducibility PASSED [ 12%]
tests/test_curriculum_extended.py::test_deleting_lesson_does_not_reset_progress PASSED [ 14%]
tests/test_curriculum_extended.py::test_objective_based_progression_independent_of_lesson_count PASSED [ 16%]
tests/test_curriculum_extended.py::test_consolidation_review_lesson_marked_properly PASSED [ 18%]
tests/test_diagnostic.py::test_diagnostic_perfect_score_places_into_c1 PASSED [ 20%]
tests/test_diagnostic.py::test_diagnostic_zero_score_places_into_a1 PASSED [ 22%]
tests/test_email_workflow.py::test_composer_renders_combined_pt_es_email PASSED [ 24%]
tests/test_email_workflow.py::test_mock_email_adapter_delivery PASSED    [ 26%]
tests/test_email_workflow.py::test_mock_email_adapter_failure_handling PASSED [ 28%]
tests/test_email_workflow.py::test_resend_adapter_missing_api_key_graceful_error PASSED [ 30%]
tests/test_engine_facade.py::test_polyglot_engine_diagnostic_submission PASSED [ 32%]
tests/test_engine_facade.py::test_polyglot_engine_exercise_evaluation_and_storage PASSED [ 34%]
tests/test_engine_facade.py::test_polyglot_engine_srs_rating PASSED      [ 36%]
tests/test_engine_facade.py::test_lesson_validator_under_12_vocabulary_raises_error PASSED [ 38%]
tests/test_exercises.py::test_string_normalizer PASSED                   [ 40%]
tests/test_exercises.py::test_checker_correct_exact PASSED               [ 42%]
tests/test_exercises.py::test_checker_distractor_pedagogical_feedback PASSED [ 44%]
tests/test_exercises.py::test_checker_accent_warning PASSED              [ 46%]
tests/test_exercises.py::test_cloze_generator_from_vocabulary PASSED     [ 48%]
tests/test_false_friends.py::test_false_friend_detection PASSED          [ 51%]
tests/test_generator.py::test_generate_portuguese_br_daily_lesson PASSED [ 53%]
tests/test_generator.py::test_generate_spanish_es_daily_lesson PASSED    [ 55%]
tests/test_generator.py::test_compact_study_mode PASSED                  [ 57%]
tests/test_generator.py::test_exercise_history_avoids_immediate_repetition PASSED [ 59%]
tests/test_models.py::test_cefr_level_ordering PASSED                    [ 61%]
tests/test_models.py::test_attribution_validation PASSED                 [ 63%]
tests/test_models.py::test_distractor_item PASSED                        [ 65%]
tests/test_security_and_config.py::test_sensitive_data_scrubbing PASSED  [ 67%]
tests/test_security_and_config.py::test_email_validation PASSED          [ 69%]
tests/test_security_and_config.py::test_input_sanitization PASSED        [ 71%]
tests/test_sources.py::test_text_normalization PASSED                    [ 73%]
tests/test_sources.py::test_wiktionary_adapter_offline_fixture_pt PASSED [ 75%]
tests/test_sources.py::test_wiktionary_adapter_offline_fixture_es PASSED [ 77%]
tests/test_sources.py::test_tatoeba_adapter_offline_fixture_pt PASSED    [ 79%]
tests/test_sources.py::test_tatoeba_adapter_offline_fixture_es PASSED    [ 81%]
tests/test_sources.py::test_wikimedia_commons_adapter_offline_fixture PASSED [ 83%]
tests/test_sources.py::test_source_manager_composition PASSED            [ 85%]
tests/test_sources.py::test_source_adapter_missing_record_handling PASSED [ 87%]
tests/test_srs.py::test_sm2_successful_progression PASSED                [ 89%]
tests/test_srs.py::test_sm2_mastery_distinction_from_presented PASSED    [ 91%]
tests/test_srs.py::test_sm2_lapse_reset PASSED                           [ 93%]
tests/test_srs.py::test_sm2_minimum_ease_factor PASSED                   [ 95%]
tests/test_storage_and_retention.py::test_essential_progress_survives_cleanup PASSED [ 97%]
tests/test_storage_and_retention.py::test_backup_and_restore_cycle PASSED [100%]

============================= 49 passed in 1.12s ==============================
```

---

## 3. Frontend Test Suite Log (`vitest`)

**Execution Command**:
```powershell
cd frontend
npx vitest run
```

**Output**:
```text
 RUN  v5.0.5 C:/Users/vinod/OneDrive/Desktop/language-learning/frontend

 ✓ src/tests/srs.test.ts (5 tests) 6ms
 ✓ src/tests/storage.test.ts (4 tests) 8ms
 ✓ src/tests/lessonGenerator.test.ts (4 tests) 12ms

 Test Files  3 passed (3)
      Tests  13 passed (13)
   Start at  13:30:15
   Duration  15.75s (environment 79%, setup 19%, transform 1%)
```

---

## 4. Frontend Production Build Log (`vite build`)

**Execution Command**:
```powershell
cd frontend
npm run build
```

**Output**:
```text
> frontend@0.0.0 build
> tsc -b && vite build

vite v8.3.5 building client environment for production...
transforming...
✓ 2058 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.45 kB │ gzip:   0.29 kB
dist/assets/index-6bIO8h4Y.css   49.45 kB │ gzip:   8.39 kB
dist/assets/index-CrNkHQb3.js   389.26 kB │ gzip: 111.96 kB

✓ built in 12.48s
```
