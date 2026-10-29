# Polyglot C1 Daily — External API Integration & Architecture Inventory

**Date:** 2026-10-30  
**Status:** In Progress / Implementation  
**Auditor:** Senior Full-Stack Software Architect & Integration Engineer  

---

## 1. Executive Summary & Objective

Polyglot C1 Daily is an offline-first, local-first, zero-paid-API language-learning web application for English, Portuguese, and Spanish (CEFR A1–C1).

This document establishes the audit inventory and target architecture for introducing a **Central External API Integration Layer** and integrating **seven external APIs**:

1. **Google Gemini API** (Scheduled server-side/pipeline lesson & reading generation, zero frontend key exposure).
2. **MyMemory Translation API** (Public multi-pair machine translation fallback).
3. **Jikan Anime API** (Public anime/manga metadata & Japanese cultural reading integration with 3 req/sec rate limit).
4. **Wikipedia REST / Wikifeeds API** (Authentic reading comprehension articles for PT, ES, EN with dynamic date & search feeds).
5. **Free Dictionary API** (English lemma, phonetics, audio URLs, definitions, examples).
6. **Dicionário Aberto API** (Portuguese definitions, etymology, and grammar classifications).
7. **LanguageTool HTTP API** (Interactive real-time spelling and grammar proofreading with character offsets).

The application's UI experience is reorganized into **Five Primary Pillars**:
- **Pillar 1: Daily Learning** (Daily lessons, conversation scenarios, grammar explications, daily practice).
- **Pillar 2: Explore & Read** (Authentic Wikipedia reader, curated cultural catalog, Jikan cultural explorer).
- **Pillar 3: Vocabulary & Dictionary** (Bilingual dictionary search, Free Dictionary EN, Dicionário Aberto PT, MyMemory translation, Top 200 frequency lists, pronunciation).
- **Pillar 4: Practice & Improve** (LanguageTool interactive proofreader, translation challenges, cloze quizzes, Mistake Notebook).
- **Pillar 5: My Learning** (CEFR diagnostic assessment, SM-2 SRS spaced repetition review, streak & progress analytics, offline API cache status).

---

## 2. Existing Feature vs Target Implementation Inventory

| Feature Area | Existing Implementation | Proposed Integration Layer Change | Files Affected |
| :--- | :--- | :--- | :--- |
| **Translation** | Hardcoded trilingual corpus (`trilingualDictionary`) + basic direct `fetch` in `translate.ts` to MyMemory. | Decouple provider from service. Create `MyMemoryAdapter` conforming to `TranslationProvider` with quota tokens, retries, and Dexie/memory caching. | `frontend/src/services/translate.ts`<br>`frontend/src/integrations/external-apis/adapters/mymemory/`<br>`frontend/src/pages/TranslatePage.tsx` |
| **English Dictionary** | Static seed data and dictionary lookup in `seedData.ts`. | Integrate `FreeDictionaryAdapter` for live lemma definitions, IPA phonetics, and audio pronunciation. | `frontend/src/integrations/external-apis/adapters/free-dictionary/`<br>`frontend/src/services/dictionaryService.ts`<br>`frontend/src/pages/VocabularyPage.tsx` |
| **Portuguese Dictionary** | Static seed data in `seedData.ts`. | Integrate `DicionarioAbertoAdapter` for authentic Portuguese lexicon definitions, grammar tags, and etymology. | `frontend/src/integrations/external-apis/adapters/dicionario-aberto/`<br>`frontend/src/services/dictionaryService.ts`<br>`frontend/src/pages/VocabularyPage.tsx` |
| **Authentic Reading** | Curated static articles in `cultureData.ts`. | Integrate `WikipediaAdapter` to fetch real-time Portuguese, Spanish, and English featured articles and summaries. | `frontend/src/integrations/external-apis/adapters/wikipedia/`<br>`frontend/src/services/readingService.ts`<br>`frontend/src/pages/CultureExplorePage.tsx` |
| **Cultural Exploration** | Static cultural catalog in `cultureService.ts`. | Integrate `JikanAdapter` for character discovery, metadata, and cross-cultural reading passages with strict token-bucket rate limiting (3 req/s). | `frontend/src/integrations/external-apis/adapters/jikan/`<br>`frontend/src/services/readingService.ts`<br>`frontend/src/pages/CultureExplorePage.tsx` |
| **Interactive Grammar Check** | Static exercise validator in `PracticePage.tsx`. | Integrate `LanguageToolAdapter` for interactive user writing proofreading with inline character offset error highlights and one-click fixes. | `frontend/src/integrations/external-apis/adapters/languagetool/`<br>`frontend/src/services/proofreadingService.ts`<br>`frontend/src/pages/PracticePage.tsx` |
| **Curriculum Generation** | Python generator in `engine/generators/template_engine.py` using templates. | Integrate `GeminiAdapter` in server-side/pipeline script for rich curriculum generation, with deterministic fallback when API key is unset. | `engine/generators/gemini_generator.py`<br>`frontend/src/integrations/external-apis/adapters/gemini/` |
| **API Management & Caching** | Ad-hoc Map caches with no unified rate limits or Dexie caching. | Central `ApiRegistry`, `ApiCache`, `RateLimitManager`, `RetryPolicy`, and typed `ApiError` hierarchy. | `frontend/src/integrations/external-apis/core/*`<br>`frontend/src/services/localDb.ts` |
| **Navigation & UI** | 11 flat nav tabs with mixed mobile responsiveness. | Reorganize into 5 coherent pillars with backwards-compatible tab routing and preserved guest/auth workflows. | `frontend/src/components/common/Navigation.tsx`<br>`frontend/src/App.tsx`<br>`frontend/src/pages/*` |

---

## 3. Architectural Design

```text
                         React 19 + TypeScript UI
                                   │
                                   ▼
                       High-Level Services
      (TranslationService, DictionaryService, ReadingService, ProofreadingService)
                                   │
                                   ▼
                    Central External API Integration Layer
 ┌────────────────────────────────────────────────────────────────────────┐
 │                              ApiRegistry                               │
 │                                                                        │
 │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
 │  │ RateLimitManager │  │   RetryPolicy    │  │       ApiCache       │  │
 │  │ (Token Bucket/3s)│  │ (Exp. Backoff)   │  │ (Dexie / In-Memory)  │  │
 │  └──────────────────┘  └──────────────────┘  └──────────────────────┘  │
 │                                                                        │
 │                                Adapters                                │
 │  ┌───────────────┐ ┌────────────────┐ ┌──────────────────────────────┐ │
 │  │   MyMemory    │ │ FreeDictionary │ │      DicionarioAberto        │ │
 │  └───────────────┘ └────────────────┘ └──────────────────────────────┘ │
 │  ┌───────────────┐ ┌────────────────┐ ┌───────────────┐ ┌────────────┐ │
 │  │   Wikipedia   │ │     Jikan      │ │ LanguageTool │ │   Gemini   │ │
 │  └───────────────┘ └────────────────┘ └───────────────┘ └────────────┘ │
 └────────────────────────────────────────────────────────────────────────┘
                                   │
              ┌────────────────────┴───────────────────┐
              ▼                                        ▼
      Direct Public HTTP                   Scheduled Python Pipeline
   (Browser CORS Endpoints)                 (GEMINI_API_KEY server-side)
```

---

## 4. Security & Zero-Cost Guarantees

1. **No Paid Endpoints in Browser:** All 6 client-side APIs (MyMemory, Free Dictionary, Dicionário Aberto, Wikipedia REST, Jikan, LanguageTool) are open and require no credit cards or paid tokens.
2. **Gemini Key Confidentiality:** The `GEMINI_API_KEY` is exclusively utilized server-side in GitHub Actions workflows or Python generation scripts. Never embedded in frontend bundle or exposed to learners.
3. **Local-First & Offline Fallback:** If internet is disconnected, all adapters fail gracefully to cached entries or local seed dictionaries without throwing uncaught UI crashes.
