# Lexilume — Multilingual Language Coverage & Capabilities Report

> **Target Version:** Lexilume 2.0.0  
> **Repository:** `VINODH0101/language-learning`  
> **Date:** October 30, 2026

---

## 1. Supported Languages & Regional Dialects

Lexilume officially models base language families and regional varieties separately. Base language codes control curriculum tracks and dictionary mapping, while regional variety codes control phonetic synthesis, dialectal grammar notes, and audio accents.

| Language | Code | Native Name | Script | Text Direction | Regional Varieties | Default Variety |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **English** | `en` | English | Latin | LTR | `en-US`, `en-GB`, `all` | `en-US` |
| **Portuguese** | `pt` | Português | Latin | LTR | `pt-BR`, `pt-PT`, `all` | `pt-BR` |
| **Spanish** | `es` | Español | Latin | LTR | `es-ES`, `es-419`, `es-MX`, `es-AR`, `all` | `es-ES` |
| **French** | `fr` | Français | Latin | LTR | `fr-FR`, `fr-CA`, `all` | `fr-FR` |
| **German** | `de` | Deutsch | Latin | LTR | `de-DE`, `de-AT`, `de-CH`, `all` | `de-DE` |
| **Italian** | `it` | Italiano | Latin | LTR | `it-IT`, `all` | `it-IT` |
| **Japanese** | `ja` | 日本語 | Kanji / Kana | LTR | `ja-JP`, `all` | `ja-JP` |
| **Korean** | `ko` | 한국어 | Hangul | LTR | `ko-KR`, `all` | `ko-KR` |
| **Russian** | `ru` | Русский | Cyrillic | LTR | `ru-RU`, `all` | `ru-RU` |
| **Dutch** | `nl` | Nederlands | Latin | LTR | `nl-NL`, `nl-BE`, `all` | `nl-NL` |
| **Mandarin Chinese** | `zh` / `zh-Hans` | 简体中文 | Simplified Hanzi | LTR | `zh-Hans`, `zh-CN`, `all` | `zh-Hans` |
| **Turkish** | `tr` | Türkçe | Latin | LTR | `tr-TR`, `all` | `tr-TR` |
| **Tamil** | `ta` | தமிழ் | Tamil | LTR | `ta-IN`, `ta-LK`, `all` | `ta-IN` |

> [!IMPORTANT]
> **Strict Hindi (`hi`) Exclusion**: Hindi is permanently excluded from all product configurations, language registries, test suites, and localization matrices. The function `isForbiddenLanguage('hi')` returns `true`, and attempts to instantiate Hindi curricula are rejected by frontend and backend validators.

---

## 2. Feature Capability Matrix

Lexilume utilizes capability-based feature flags (`frontend/src/config/languages/capabilities.ts`). A capability is enabled in the UI only when verified providers or deterministic engines exist:

| Language | CEFR Levels | Dictionary | Examples | TTS Voice | STT Speech | Grammar Engine | Universal Tokenizer |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **English** | A1 – C1 | Wiktionary / Kaikki | Tatoeba | `en-US` / `en-GB` | Web Speech API | LanguageTool / Rule | Space / Punct |
| **Portuguese** | A1 – C1 | Dicionário Aberto / Wiktionary | Tatoeba | `pt-BR` / `pt-PT` | Web Speech API | LanguageTool / Rule | Space / Punct |
| **Spanish** | A1 – C1 | Wiktionary / FreeDict | Tatoeba | `es-ES` / `es-MX` | Web Speech API | LanguageTool / Rule | Space / Punct |
| **French** | A1 – C1 | Wiktionary | Tatoeba | `fr-FR` | Web Speech API | LanguageTool / Rule | Space / Punct |
| **German** | A1 – C1 | Wiktionary | Tatoeba | `de-DE` | Web Speech API | LanguageTool / Rule | Space / Punct |
| **Italian** | A1 – C1 | Wiktionary | Tatoeba | `it-IT` | Web Speech API | LanguageTool / Rule | Space / Punct |
| **Japanese** | A1 – B2 | Kaikki (JA) | Tatoeba | `ja-JP` | Web Speech API | Regex / Particle | Intl.Segmenter / Kanji |
| **Korean** | A1 – B2 | Kaikki (KO) | Tatoeba | `ko-KR` | Web Speech API | Regex / Josa | Hangul Syllable Decomp |
| **Russian** | A1 – B2 | Kaikki (RU) | Tatoeba | `ru-RU` | Web Speech API | LanguageTool / Rule | Cyrillic Stress Stripper |
| **Dutch** | A1 – B2 | Wiktionary | Tatoeba | `nl-NL` | Web Speech API | LanguageTool / Rule | Space / Punct |
| **Mandarin** | A1 – B2 | Kaikki (ZH) | Tatoeba | `zh-CN` | Web Speech API | Hanzi / Pinyin | Intl.Segmenter / CJK |
| **Turkish** | A1 – B2 | Wiktionary | Tatoeba | `tr-TR` | Web Speech API | Rule-based Suffix | Space / Agglutinative |
| **Tamil** | A1 – B1 | Wiktionary / Kaikki | Tatoeba | `ta-IN` | Web Speech API | Rule-based Suffix | Grapheme Cluster Aware |

---

## 3. UI Internationalization (i18n) Parity

All 15 authorized interface locales (`en`, `pt`, `pt-BR`, `pt-PT`, `es`, `fr`, `de`, `it`, `ja`, `ko`, `ru`, `nl`, `zh-Hans`, `tr`, `ta`) are bundled across 9 distinct functional namespaces:
1. `common.json` (System actions, status badges, universal labels)
2. `navigation.json` (Nav headers, mobile dock, curriculum track titles)
3. `dashboard.json` (Daily roadmaps, greetings, study goals)
4. `learning.json` (4-stage lesson stepper, tabs, action buttons)
5. `practice.json` (Flashcards, quiz drills, SM-2 interval labels)
6. `settings.json` (Preferences, dialect configuration, dark mode)
7. `auth.json` (Modals, guest migration, credential forms)
8. `world.json` (Real-world scenarios, weather, currency, country explorer)
9. `errors.json` (Network error alerts, rate limit feedback, validation warnings)

Tested and verified in `frontend/src/tests/i18n/i18nArchitecture.test.tsx` (100% key parity across all 135 JSON resource files).
