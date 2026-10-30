# Lexilume — Known Limitations & Operational Considerations

> **Target Version:** Lexilume 2.0.0  
> **Repository:** `VINODH0101/language-learning`  
> **Date:** October 30, 2026

---

## 1. Browser Speech Synthesis & Audio Constraints

- **Platform-Dependent Web Speech API**:
  - The Web Speech API relies on operating system voices. While desktop Chrome, macOS Safari, and Android typically offer native high-quality voices for English, Portuguese, Spanish, French, and German, support for smaller regional locales (e.g., `pt-PT` on Windows or `ta-IN` on older Linux distros) depends on installed system voice packages.
  - *Mitigation*: The `SpeechService` implements an automatic locale fallback hierarchy (`pt-PT` falls back to `pt-BR` if missing; `ta-LK` falls back to `ta-IN` or universal TTS).

- **Mobile Web Speech Audio Unlock**:
  - iOS Safari requires user interaction (tap or click) before playing synthesized audio. Audio buttons are styled and bound directly to user gesture handlers to prevent browser playback blocking.

---

## 2. Open-Source Dataset Density Variations

- **Curated Dataset Asymmetry**:
  - High-resource language pairs (English, Portuguese, Spanish, French, German) feature rich lemma entries in Wiktionary and tens of thousands of Tatoeba example sentences.
  - Lower-resource pairs (such as Tamil to Portuguese or Dutch to Korean) have fewer sentence pairs on Tatoeba.
  - *Mitigation*: The `ContentGapRegistry` and `ContentPipeline` detect low sentence density and dynamically pull contextual translations and definitions from the secondary fallback layer.

---

## 3. Client-Side OCR Engine Initialization (Tesseract.js)

- **Worker Download Latency on First Scan**:
  - Scan & Learn utilizes `tesseract.js` directly in the browser to maintain zero-paid external API compliance and student document privacy.
  - The first time a student launches OCR, language traineddata files (~5–15MB depending on script complexity) are fetched and cached in IndexedDB.
  - *Mitigation*: Clear visual progress bars (`progress` indicator) and cache retention ensure this download happens only once per language on a student device.

---

## 4. Bot Detection Adblocker Interactions

- **Cloudflare Turnstile Script Blocking**:
  - Privacy-oriented browser extensions (uBlock Origin, Brave Shields, Pi-hole) may block scripts originating from `challenges.cloudflare.com`.
  - *Mitigation*: The `TurnstileWidget` catches network failures and script errors immediately, falling back to a frictionless local test verification without blocking student authentication or submission.

---

## 5. Storage Quotas on Mobile Safari Private Browsing

- **IndexedDB in Private Browsing**:
  - In certain strict mobile private browsing modes, IndexedDB writes may be restricted or ephemeral upon tab closure.
  - *Mitigation*: Lexilume implements a resilient in-memory fallback mirror in `frontend/src/services/localDb.ts` to ensure lessons and quizzes never crash even if IndexedDB throws quota errors.
