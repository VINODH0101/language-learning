# Adding a New Language to Lexilume — Developer & Architecture Guide

> **Target Audience:** Full-Stack Engineers & Content Curators  
> **Repository:** `VINODH0101/language-learning` (Lexilume)  
> **Architecture Principle:** Capability-Driven, Extensible Multilingual Registry

---

## 1. Overview of Lexilume's Language Architecture

Lexilume uses a **centralized, capability-driven language configuration registry**. Adding a new language is modular and does **not** require modifying core UI pages, layout components, or persistence logic.

### Core System Invariants:
1. **Four-Way Linguistic Decoupling**:
   - `interfaceLanguage`: UI navigation and buttons (`en`, `pt`, `es`).
   - `targetLanguage`: The language being studied (all registered languages).
   - `explanationLanguage`: The pedagogical language for definitions and grammar notes (`en`, `pt`, `es`).
   - `regionalVariety`: The dialect/accent strictly bound to the target learning language (e.g. `pt-BR`, `pt-PT`, `es-ES`, `es-MX`).
   - *Changing the target language must NEVER change the interface language!*
2. **Zero-Paid AI Mandate**:
   - New languages must use open educational datasets (Wiktionary, Tatoeba, Wikipedia) with deterministic synthesis fallbacks.
3. **Explicit Exclusion**:
   - Hindi (`hi`) is strictly excluded by policy.
4. **CEFR Editorial Provenance**:
   - Never assign CEFR levels without validated pedagogical evidence or documented source attribution.

---

## 2. Step-by-Step Checklist to Add a 14th Language

Follow this 6-step checklist to add a new language (e.g., Swedish `sv` or Polish `pl`).

### Step 1: Add Language Code to Types
File: `frontend/src/config/languages/types.ts`
```typescript
export type SupportedLanguage =
  | 'en' | 'pt' | 'es' | 'fr' | 'de' | 'it'
  | 'ja' | 'ko' | 'ru' | 'nl' | 'zh' | 'tr' | 'ta'
  | 'sv'; // Add new code here
```
Update `frontend/src/types/index.ts` and `frontend/src/lib/languages/languageMatrix.ts` to reflect the union.

---

### Step 2: Register in `LANGUAGE_REGISTRY`
File: `frontend/src/config/languages/languageRegistry.ts`

Add the language entry to `LANGUAGE_REGISTRY`:
```typescript
sv: {
  id: 'sv',
  displayName: 'Swedish',
  nativeName: 'Svenska',
  defaultLocale: 'sv-SE',
  script: 'Latn',
  textDirection: 'ltr',
  flag: '🇸🇪',
  cefrAvailability: ['A1', 'A2', 'B1', 'B2', 'C1'],
  supportedDictionaryProviders: ['free_dictionary', 'wiktionary', 'local_fallback'],
  supportedTranslationProviders: ['mymemory', 'local_dictionary'],
  supportedSentenceProviders: ['tatoeba', 'wikipedia', 'curated'],
  ttsSupport: {
    isSupported: true,
    defaultVoiceLocale: 'sv-SE',
    supportedLocales: ['sv-SE', 'sv-FI'],
  },
  sttSupport: {
    isSupported: true,
    defaultVoiceLocale: 'sv-SE',
    supportedLocales: ['sv-SE'],
  },
  grammarCheckingSupport: {
    isSupported: true,
    provider: 'languagetool',
    languageToolCode: 'sv',
  },
  readingResourceAvailability: {
    hasWikipedia: true,
    hasCuratedPassages: true,
    wikipediaCode: 'sv',
  },
  writingPracticeAvailability: {
    isSupported: true,
  },
  regionalVariants: [
    {
      code: 'sv-SE',
      displayName: 'Standard Swedish',
      nativeName: 'Rikssvenska',
      locale: 'sv-SE',
      flag: '🇸🇪',
      isDefault: true,
    },
    {
      code: 'sv-FI',
      displayName: 'Finland Swedish',
      nativeName: 'Finlandssvenska',
      locale: 'sv-FI',
      flag: '🇫🇮',
      isDefault: false,
    },
  ],
  validationRules: DEFAULT_CEFR_WORD_RULES,
},
```

---

### Step 3: Register Script-Specific Processing (If Non-Latin)
File: `frontend/src/shared/utils/textProcessing.ts`

If the language uses:
- **Non-spaced scripts** (like Thai, Burmese, Japanese, Chinese): Ensure `tokenizeText` handles word segmentation via `Intl.Segmenter(lang, { granularity: 'word' })`.
- **Complex vowel signs or ligatures** (like Arabic, Tamil, Devanagari): Add a grapheme cluster utility function.
- **Tone marks or diacritics**: Add normalization helpers.

---

### Step 4: Update the Python Learning Engine
File: `engine/models/enums.py`

1. Add enum entry to `Language`:
   ```python
   class Language(str, Enum):
       ...
       SWEDISH = "sv"
   ```
2. Add regional varieties to `RegionalVariety`:
   ```python
   SV_SE = "sv-SE"
   SV_FI = "sv-FI"
   ```
3. Map varieties in `REGIONAL_VARIETIES_BY_LANGUAGE`:
   ```python
   Language.SWEDISH: [RegionalVariety.SV_SE, RegionalVariety.SV_FI, RegionalVariety.ALL]
   ```
4. Define default in `DEFAULT_REGIONAL_VARIETY`:
   ```python
   Language.SWEDISH: RegionalVariety.SV_SE
   ```

---

### Step 5: Add Unit & Integration Tests
File: `frontend/src/tests/languageRegistry.test.ts`
- Verify configuration retrieves correctly: `getLanguageConfig('sv')`.
- Verify capabilities report accurately: `hasTTS('sv')`, `hasGrammarChecker('sv')`.
- Verify regional varieties enforce safely: `enforceRegionalVariant('sv', 'invalid') === 'sv-SE'`.
- Verify CEFR word count validation functions.

File: `tests/test_language_separation.py`
- Verify Python enum and variety scoping.

---

### Step 6: Verify Verification Commands
Run all three test and build suites:
```bash
# Frontend Unit Tests
npm --prefix frontend test -- --run

# Frontend Production Build & TypeScript Check
npm --prefix frontend run build

# Python Engine Tests
python -m pytest tests/ -v
```
All commands must exit with code `0`.
