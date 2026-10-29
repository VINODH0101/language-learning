# 08. Known Issues and Technical Debt

> **Audit Date:** 2026-10-29  
> **Repository:** `language-learning`  
> **Scope:** Confirmed architectural boundaries, external service constraints, and technical debt log.

---

## 1. Technical Debt & Environmental Constraints

### 1.1 jsPDF Client-Side Font Glyph Support
- **Issue:** `PdfService.ts` utilizes jsPDF core standard fonts (`helvetica`, `courier`) to maintain a lightweight bundle size (< 150 KB). Core fonts support standard Latin characters and Portuguese/Spanish diacritics (`á`, `é`, `í`, `ó`, `ú`, `ç`, `ñ`, `ã`, `õ`), but specific international phonetic alphabet (IPA) tone markers (e.g. `[ʁ]`, `[θ]`, `[ɲ]`) may render as nearest ASCII approximations.
- **Mitigation:** Fallback transliteration is provided in PDF generation headers; full IPA transcriptions remain available in the web UI.
- **Recommended Action:** Evaluate bundling a compressed subset TTF font (such as *Noto Sans*) if full IPA rendering is required for offline printed study packs.

### 1.2 Supabase 7-Day Inactivity Database Pause
- **Issue:** Supabase free-tier PostgreSQL projects pause if no SQL queries are executed for 7 consecutive days.
- **Mitigation:** The daily GitHub Actions workflow (`daily_polyglot.yml`) queries and writes to `daily_lessons` and `email_deliveries` every morning, preventing automatic dormancy during active study periods.
- **Manual Resume:** Documented one-click unpause procedure in `OPERATIONS_RUNBOOK.md`.

### 1.3 Resend Free-Tier Sending Domain
- **Issue:** The default Resend sandbox sender (`onboarding@resend.dev`) only delivers transactional messages to the email address registered on the Resend account.
- **Mitigation:** For single-learner operation, registering with the learner's personal email works without a paid domain. Pluggable SMTP adapter (`engine/email/smtp_adapter.py`) allows routing through standard email providers (Gmail, Fastmail, Proton) at zero cost.

### 1.4 Web Speech Synthesis OS Voice Quality
- **Issue:** Browser-native speech synthesis voice timbre and dialect variety depend on installed OS language packs.
- **Mitigation:** `SpeechService.ts` scans all installed browser voices on load and handles the `voiceschanged` event dynamically. Direct Tatoeba audio clips are provided for deterministic native human pronunciation.

### 1.5 Vitest Worker Latency on Heavily Loaded Environments
- **Issue:** Spawning 13 isolated Node.js worker threads simultaneously in `jsdom` under heavy CPU load on Windows can cause test execution to exceed the default 5-second timeout.
- **Mitigation:** Configured `testTimeout: 15000` in `frontend/vite.config.ts`, ensuring deterministic test execution regardless of system load.
