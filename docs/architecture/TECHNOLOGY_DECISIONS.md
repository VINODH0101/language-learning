# Lexilume — Technology Decisions & Architectural Rationales

> **Repository:** `VINODH0101/language-learning` (Lexilume — Illuminate Your Words)  
> **Production Application:** `https://lexi.monster`  
> **Phase:** Phase 4 — Target Architecture Design  
> **Core Principle:** Maximize leverage of proven existing technologies; avoid premature microservices and expensive infrastructure.

---

## 1. Executive Summary

A critical evaluation of Lexilume's current technology stack confirmed that **the existing infrastructure is fully capable of supporting the content-centred target product without introducing expensive new backend servers, Kubernetes clusters, or microservices**.

By coupling client-side processing (React 19 + Vite + Dexie v4) with managed cloud primitives (Supabase PostgreSQL + GoTrue Auth) and serverless batch runners (GitHub Actions + Python 3.12), Lexilume achieves:
- **Zero Fixed Infrastructure Cost:** Operates within free edge and cloud tiers.
- **Sub-10ms Local Interactions:** Local-first IndexedDB eliminates network latency for reading and vocabulary review.
- **Maximum Developer Velocity:** Single TypeScript/Python codebase without microservice orchestration overhead.

---

## 2. Technology Decision Matrix

| Technology | Current Role in System | Target Architecture Role | Decision | Rationale, Cost & Migration Impact |
| :--- | :--- | :--- | :--- | :--- |
| **React 19** | SPA UI Framework | Core UI Framework | **Retain** | High rendering performance with concurrent features; zero migration cost; team expertise. |
| **TypeScript 5.8** | Static Type System | Core Type System | **Retain** | Strict type contracts across frontend and domain models eliminate runtime type errors. |
| **Vite 8.3** | Build Tool & Bundler | Build Tool & Bundler | **Retain with modifications** | Ultra-fast HMR and production builds. Modification: Configure `rollupOptions` for route-level code splitting (`React.lazy`). |
| **Tailwind CSS v4** | CSS Design System | UI Styling System | **Retain** | Modern CSS utility framework; zero runtime overhead; responsive mobile-first utilities. |
| **Dexie v4 (IndexedDB)**| Local Database Engine | Local-First Storage Core | **Retain with modifications** | Provides transactional IndexedDB with compound indexes. Modification: Add `cached_content_items` and `user_saved_words` stores. |
| **Supabase PostgreSQL** | Remote Database & API | Authoritative Cloud Store | **Retain with modifications** | PostgreSQL 15 with PostgREST eliminates custom API middleware. Modification: Add migration for `english_content_items`. |
| **Supabase GoTrue Auth**| Session Management | Authentication Engine | **Retain** | Robust JWT auth, auto-refresh tokens, and tight RLS integration with zero auth server maintenance. |
| **Python 3.12 & Pydantic**| CLI Batch Runner & Schemas| Content Pipeline Engine | **Retain with modifications** | Ideal for text parsing, tokenization, and linguistic validation. Modification: Add content analysis scripts. |
| **GitHub Actions** | CI/CD & Scheduled Cron | Automation Runner | **Retain** | Executes automated test suites on push and triggers daily content publishing at zero infrastructure cost. |
| **Web Speech API** | Browser Voice Synthesis | Audio Pronunciation Core | **Retain** | Zero-cost native speech synthesis and speech recognition without external audio streaming fees. |
| **jsPDF** | Study Pack Generator | Offline PDF Exporter | **Retain** | Generates binary study packs entirely in client memory with zero server roundtrips. |
| **MiniSearch** | Client Search Indexing | Vocabulary Search Engine | **Retain** | Lightweight (7 kB), in-memory substring and prefix search for the `My Words` tab. |
| **Tesseract.js** | Optical Character Recog. | Image Text Ingestion | **Retain (Lazy Loaded)** | Enables learners and admins to snap photos of English texts. Kept dynamically imported to protect bundle size. |
| **Leaflet & OSM** | Interactive World Map | Cultural Geography Hub | **Retain (Optional)** | Kept lazy-loaded for cultural enrichment; isolated from core reading flows. |
| **Lucide React** | SVG Iconography | UI Icon Set | **Retain** | Clean, accessible SVG icons; tree-shaken during build. |
| **Sonner** | Toast Notifications | System Feedback Toast | **Retain** | Accessible, lightweight notification system for user confirmations and sync states. |

---

## 3. Evaluation: Is a Dedicated Backend Server Required?

A major architectural question addressed in Phase 4:

> *Does Lexilume require a dedicated, long-running backend server (e.g. Node.js Express, NestJS, FastAPI, or Django) deployed to a cloud VPS or container service?*

### Decision: NO. A Dedicated Backend Server is NOT Required.

### Detailed Technical Rationale:
1. **PostgREST Direct Data Access:** Supabase exposes a hardened, high-performance REST API over PostgreSQL. With proper Row-Level Security (RLS) policies, frontend clients perform CRUD operations directly against the database with strict tenant isolation. Custom Node.js or Python API middleware would merely duplicate what PostgREST already provides out-of-the-box.
2. **Asynchronous Content Processing:** Content analysis does not occur synchronously on every learner page load. Administrators ingest and publish content asynchronously. The content analysis pipeline can execute:
   - Client-side in TypeScript for basic plain text and Tesseract OCR.
   - Via GitHub Actions / serverless execution for batch ingestion and Tatoeba corpus alignments.
3. **Zero Maintenance Overhead:** Running a VPS or Kubernetes cluster introduces server maintenance, patching, scaling bottlenecks, and monthly cloud subscription costs ($20–$100/mo). The serverless edge model operates at **$0/month** within existing free-tier allowances.
4. **Lowest Complexity Principle:** The simplest architecture that fully satisfies the product vision is a static edge SPA backed by Supabase and scheduled GitHub Actions runners.
