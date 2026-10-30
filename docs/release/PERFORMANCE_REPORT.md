# Lexilume — Performance & Bundle Optimization Report

> **Target Version:** Lexilume 2.0.0  
> **Repository:** `VINODH0101/language-learning`  
> **Date:** October 30, 2026

---

## 1. Production Build & Bundle Metrics

The frontend production build (`npm --prefix frontend run build`, running `tsc -b && vite build`) executes in ~31 seconds transforming 2,707 modules into production assets:

### Output Asset Breakdown

| Asset File | Uncompressed Size | Gzipped Size | Purpose |
| :--- | :--- | :--- | :--- |
| `dist/index.html` | 1.18 kB | 0.59 kB | Application Shell Entrypoint |
| `dist/assets/index-*.css` | 96.15 kB | 13.88 kB | Tailwind CSS v4 Global Styles |
| `dist/assets/src-*.js` | 17.24 kB | 7.29 kB | Core Bootstrapping & Feature Modules |
| `dist/assets/purify.es-*.js` | 29.02 kB | 11.45 kB | DOMPurify XSS Sanitization |
| `dist/assets/leaflet-src-*.js` | 148.60 kB | 43.32 kB | Leaflet Geographic World Explorer |
| `dist/assets/index.es-*.js` | 151.37 kB | 48.88 kB | MiniSearch & Client Tokenizer Engine |
| `dist/assets/html2canvas-*.js` | 199.39 kB | 46.73 kB | Study Pack PDF & Visual Exporter |
| `dist/assets/index-*.js` | 2,302.27 kB | 646.62 kB | Main Application Bundle & 15 Locale Bundles |
| **Total Transfer Footprint** | **~2,945 kB** | **~778 kB** | **High-speed production payload** |

All 15 language locales across 9 namespaces (135 JSON bundles) are bundled directly into the client asset tree, eliminating runtime translation fetch latency.

---

## 2. Two-Tier Client-Side Caching Architecture

To prevent network strain and ensure instantaneous response times for vocabulary searches and grammar lookups:
1. **L1 In-Memory Cache**:
   - Implemented via `frontend/src/services/cache/providerCache.ts`.
   - In-memory `Map` with sub-millisecond retrieval.
2. **L2 IndexedDB (Dexie) Persistent Cache**:
   - `localDb.apiCache` table stores API responses with a 24-hour default TTL (`expiresAt`).
   - Re-populates L1 cache automatically on cache hits.
   - Verified in `frontend/src/tests/externalApis/rateLimitAndCache.test.ts`.

---

## 3. Database & Sync Queue Performance

- **Dexie IndexedDB Transactions**: Asynchronous indexed lookups execute in `< 10ms` in browser environments.
- **Batched Offline Syncing**: The `SyncEngine` processes pending mutations in FIFO order with jittered backoff, avoiding request bursts when users reconnect.
- **Local Storage Quota Preservation**: Essential learner state is partitioned between Dexie for high-volume items (saved vocabulary, mistake history) and localStorage for fast synchronous profile preferences.

---

## 4. Execution Velocity Benchmarks

- **Frontend Vitest Suite (254 tests)**: Executed in **24.23 seconds** (average ~95ms per test case).
- **Backend Pytest Suite (100 tests)**: Executed in **8.14 seconds** (average ~81ms per test case).
- **Linter Execution (Oxlint)**: Analyzed 264 files across 116 rules in **170 milliseconds**.
