# Lexilume — External API Capability Matrix & Open Resource Guide

> **Repository:** `VINODH0101/language-learning` (Lexilume — Illuminate Your Words)  
> **Status:** Active Provider Integration Architecture  
> **Last Verified Date:** October 30, 2026

---

## 1. Architectural Principles

1. **Zero-Paid AI Mandate**: Lexilume core features (grammar, SM-2 spaced repetition, lexical lookups, reading comprehension, diagnostic placement) operate without mandatory external paid subscriptions or API keys.
2. **Provider-Based Facade**: UI components **never** call external APIs or third-party endpoints directly. All data access flows through decoupled typed services and provider adapters (`services/providers/`).
3. **Graceful Fallback & No Fake Content**: When an external API is offline or rate-limited, providers fall back to local offline dictionaries and verified curriculum corpora. The system never generates fictitious pedagogical facts.
4. **Secret Isolation**: Gemini API keys, Supabase service-role keys, and SMTP credentials exist only in environment variables or backend configurations (`.env`, GitHub Secrets). Frontend bundles never bundle secret tokens.
5. **Privacy-Preserving Logs**: Structured logs are sanitized at the monitoring layer (`ProviderHealthTracker`), automatically stripping emails, access tokens, and query credentials.

---

## 2. API Capability Matrix

| Provider | Purpose | Languages Supported | Authentication | Free-Tier Restrictions | Rate Limits | Commercial Restrictions | Attribution Required | CORS Limitations | Fallback Provider |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **MyMemory** | Word and sentence translation suggestions | `en`, `pt`, `es`, `fr`, `de`, `it`, `ja`, `ko`, `ru`, `nl`, `zh`, `tr`, `ta` | None (Public API) | 1,000 words/day without email; 10,000 words/day with free email | 10 req/sec burst | Non-commercial free tier | **Yes** — "MyMemory (Translated.net)" link | Direct CORS supported | Local Offline Trilingual Dictionary |
| **LibreTranslate** | Self-hosted machine translation engine | All Argos Translate language pairs | None (Self-hosted) or Optional API Key | Depends on host infrastructure | Configurable per instance | AGPLv3 open source license | Optional (encouraged) | Depends on host CORS configuration | Local Offline Trilingual Dictionary |
| **Kaikki / Wiktionary** | Definitions, inflections, IPA, synonyms, etymology | All 13 target languages | None (Wikimedia REST / Kaikki Mirror) | Open Data | 200 req/min | CC-BY-SA 4.0 | **Yes** — CC-BY-SA 4.0 Wiktionary credit | Supported via REST API | Curated seed data + Local MiniSearch |
| **Free Dictionary API** | English definitions, IPA phonetics, audio pronunciations | `en` | None (Public API) | Free public community API | Fair use (~60 req/min) | Open API / MIT | Encouraged | Direct CORS supported | Kaikki / Wiktionary (`en`) |
| **Dicionário Aberto** | Historical and contemporary Portuguese definitions & POS | `pt` | None (Public XML/JSON API) | Public Portuguese academic service | Fair use (~30 req/min) | Public Domain / CC-BY | Encouraged | Supported via proxy / direct | Kaikki / Wiktionary (`pt`) |
| **Tatoeba** | Authentic bilingual example sentences & native audio clips | All 13 target languages | None (Public API v0) | Open community corpus | 1 req/sec recommended | CC-BY 2.0 FR | **Yes** — Tatoeba Project credit | Direct CORS supported | OPUS Parallel Corpora / Local Sentences |
| **OPUS Corpora** | Parallel translated corpora for sentence alignment | All 13 target languages | None (Public REST) | Open Data research index | 5 req/sec | Corpus-dependent (CC0, CC-BY, Open) | **Yes** — OPUS Tiedemann citation | Direct CORS supported | Local Seed Sentences |
| **wordfreq / FrequencyWords** | Empirical word frequency rankings for curriculum prioritization | All 13 target languages | None (Static / Offline) | Static dataset | Unlimited (Offline in-memory) | MIT / CC-BY-SA 4.0 | **Yes** — Robyn Speer / Hermit Dave | None (Local execution) | Curriculum sequence order |
| **Wikipedia REST API** | Encyclopedic reading passages & topic discovery | All 13 target languages | None (REST v1) | Free knowledge archive | 200 req/sec global | CC-BY-SA 4.0 | **Yes** — Wikimedia Foundation | Direct CORS supported | Curated Cultural Articles |
| **Gutendex** | Public domain classic literature for reading comprehension | `en`, `pt`, `es`, `fr`, `de`, `it`, `nl`, `ru`, `zh` | None (Public REST) | Public domain archive index | Fair use (~60 req/min) | Public Domain | Encouraged | Direct CORS supported | Curated Cultural Articles |
| **Open Library** | Book discovery, author bibliographies, and taxonomy | Multilingual | None (Public REST) | Catalog metadata only | 100 req/min | CC0 Public Domain Metadata | Encouraged | Direct CORS supported | Gutendex |
| **Wikimedia Commons** | Vocabulary illustrations, cultural diagrams, audio | Multilingual | None (MediaWiki API) | Open media repository | Fair use (with User-Agent header) | Individual file licenses apply | **Yes** — Author, license, and source link required | Direct CORS with `origin=*` | Static Lexilume Assets |
| **Openverse** | Creative Commons images and cultural audio clips | Multilingual | None (Public API v1) | CC search index | 100 req/min without key | Creative Commons / Public Domain | **Yes** — Creator attribution & license link | Direct CORS supported | Wikimedia Commons |
| **Web Speech API** | Client-side speech synthesis and speech recognition | All browser-supported voices | None (Browser Native) | Zero cost; client hardware execution | Unlimited (Device-bound) | Standard W3C Web API | None required | None (Local browser runtime) | Pre-recorded audio URLs |
| **OpenAI Whisper** | Self-hosted speech-to-text server | Multilingual | None (Self-hosted server) | Free local GPU/CPU compute | Depends on self-hosted server | MIT License | Optional | Configured on self-hosted host | Web Speech API Recognition |
| **Vosk** | Offline WebAssembly speech recognition engine | Supported acoustic models | None (Local WASM) | Model download required | Unlimited (Offline) | Apache 2.0 | Optional | Local browser execution | Web Speech API Recognition |
| **LanguageTool** | Multilingual grammar, style, and spell checking | `pt-BR`, `pt-PT`, `es`, `en-US`, `en-GB`, `fr`, `de`, `it`, `nl`, `ru`, `zh`, `ta` | None (Free public endpoint) or Self-Hosted | 20 req/min; max 20,000 chars/check | 20 req/min public | LGPL 2.1 | Encouraged | Direct CORS supported | Local Rule-based heuristics |
| **Google Gemini API** | Auxiliary dialogue generation & dynamic exercise distractors | Multilingual | `GEMINI_API_KEY` (Optional) | Free tier: 15 req/min, 1,500 req/day | 15 RPM | Commercial terms apply | Google AI terms | CORS via server / client proxy | Deterministic Pedagogical Generator |

---

## 3. Directory Layout

The provider integration layer is organized under `frontend/src/services/`:

```
frontend/src/services/
├── providers/
│   ├── types.ts                    # Common metadata, execution options, structured errors
│   ├── baseProvider.ts             # Abstract provider lifecycle (validate -> cache -> rateLimit -> retry -> normalize)
│   ├── translation/
│   │   ├── mymemoryProvider.ts     # MyMemory translation memory adapter
│   │   ├── libretranslateProvider.ts # LibreTranslate self-hostable adapter
│   │   ├── localTranslationProvider.ts # Guaranteed offline trilingual dictionary
│   │   └── translationManager.ts   # Cascade: MyMemory -> LibreTranslate -> Local
│   ├── dictionary/
│   │   ├── kaikkiProvider.ts       # Structured Wiktionary extracts (all 13 languages)
│   │   ├── dictionaryIndex.ts      # Fast local MiniSearch search & prefix index
│   │   └── dictionaryManager.ts    # Routes FreeDict (EN), DicionarioAberto (PT), Kaikki
│   ├── examples/
│   │   ├── tatoebaProvider.ts      # Tatoeba bilingual sentence pairs & audio
│   │   ├── opusProvider.ts         # OPUS parallel corpus with review guard
│   │   └── examplesManager.ts      # Tatoeba -> OPUS cascade
│   ├── frequency/
│   │   ├── frequencyWordsProvider.ts # wordfreq / FrequencyWords empirical rankings
│   │   └── frequencyManager.ts     # Frequency query manager
│   ├── reading/
│   │   ├── wikipediaReadingProvider.ts # Wikipedia REST articles & summaries
│   │   ├── gutendexProvider.ts     # Project Gutenberg public domain literature
│   │   ├── openLibraryProvider.ts  # Open Library book metadata & catalogs
│   │   └── readingManager.ts       # Reading material orchestrator
│   ├── media/
│   │   ├── wikimediaCommonsProvider.ts # Wikimedia Commons media & audio
│   │   ├── openverseProvider.ts    # Openverse Creative Commons index
│   │   └── mediaManager.ts         # Media query with license metadata
│   ├── speech/
│   │   ├── webSpeechProvider.ts    # Browser SpeechSynthesis & Recognition
│   │   ├── whisperProvider.ts      # Self-hosted Whisper STT adapter
│   │   ├── voskProvider.ts         # Offline Vosk WASM adapter with user consent guard
│   │   └── speechManager.ts        # Speech orchestrator
│   ├── grammar/
│   │   ├── languageToolProvider.ts # LanguageTool grammar checking
│   │   └── grammarManager.ts       # Grammar checking facade
│   └── ai/
│       ├── geminiProvider.ts       # Gemini API with strict Zod validation
│       └── aiManager.ts            # Auxiliary AI with deterministic fallback
├── cache/
│   └── providerCache.ts            # L1 In-Memory + L2 Dexie IndexedDB dual-tier cache
├── normalization/
│   └── responseNormalizers.ts      # Canonical data mappers
├── validation/
│   └── schemas.ts                  # Zod runtime response validation schemas
└── monitoring/
    └── providerHealth.ts           # Status tracker & privacy-preserving log scrubber
```

---

## 4. Key Invariants & Safeguards

1. **Vosk Model Download Consent Guard**: Vosk offline speech models require user consent via `hasUserConsentForModelDownload`. The application never downloads multi-megabyte models in the background without explicit permission.
2. **OPUS Unverified Review Guard**: Raw parallel corpus text from OPUS is flagged as `isPedagogicallyVerified: false` to ensure learners understand it is unedited corpus material.
3. **No Frequency/CEFR Conflation**: Frequency ranks are documented as empirical corpus frequencies and never presented as official CEFR pedagogical tiers.
4. **Deterministic Fallbacks**: Every generative AI path and external API query includes a local, deterministic fallback.
