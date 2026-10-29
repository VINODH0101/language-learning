# Polyglot C1 Daily — External API Catalog

This catalog documents all external educational, linguistic, and operational APIs utilized by **Polyglot C1 Daily**, including endpoints, rate limits, caching policies, license requirements, and failure resilience strategies.

---

## 1. API Summary Matrix

| Service | Primary Purpose | Base URL | Auth / Key Required | Rate Limits | Content License | Status / Mode |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Wiktionary REST API** | Dictionary definitions, parts of speech, IPA pronunciation | `https://en.wiktionary.org/api/rest_v1/` | None (User-Agent header required) | Polite crawling (200 req/sec cluster limit) | CC-BY-SA 3.0 / GFDL | Active with offline fallback |
| **Wiktionary MediaWiki API** | Target-language parse lookups (pt.wiktionary / es.wiktionary) | `https://{pt,es}.wiktionary.org/w/api.php` | None (User-Agent header required) | Max 500 req/min | CC-BY-SA 3.0 / GFDL | Active with offline fallback |
| **Wikipedia REST API** | Authentic Portuguese & Spanish reading passages & metadata | `https://{pt,es}.wikipedia.org/api/rest_v1/page/summary/{title}` | None (User-Agent header required) | Polite request rate (200 req/sec cluster limit) | CC-BY-SA 4.0 | Active with offline fallback & cascade |
| **Tatoeba Project API** | Authentic bilingual sentences & native audio clips | `https://tatoeba.org/en/api_v0/` | None (User-Agent header required) | Polite request delay (1 req/sec recommended) | CC-BY 2.0 France | Active with offline fallback |
| **Wikimedia Commons API** | Native pronunciation `.ogg` / `.mp3` audio files | `https://commons.wikimedia.org/w/api.php` | None (User-Agent header required) | Polite request delay (max 200 req/sec cluster) | CC0 / CC-BY-SA 4.0 / Public Domain | Active with offline fallback |
| **Resend Email API** | Transactional daily digest email delivery | `https://api.resend.com/emails` | Bearer Token (`RESEND_API_KEY`) | 100 emails/day, 3,000/month (Free Tier) | Proprietary Service | Active in GHA runner |
| **Supabase REST (PostgREST)** | Cloud state sync and progress persistence | `https://<ref>.supabase.co/rest/v1/` | Bearer Token (Anon Key / Service Key) | Free tier compute limits | Managed Database | Active |

---

## 2. Detailed API Specifications

### 2.1 Wiktionary REST Definition API
- **Endpoint**: `GET /api/rest_v1/page/definition/{lemma}`
- **Host**: `en.wiktionary.org`
- **Request Headers**:
  ```http
  User-Agent: PolyglotC1DailyBot/1.0 (Educational Language Learning Research; contact@polyglot.dev)
  Accept: application/json
  ```
- **Response Format**: JSON containing array of language sections with `partOfSpeech`, `definitions`, and `examples`.
- **Error Handling**:
  - `404 Not Found`: Lemma not present in English Wiktionary; falls back to target-language parse API or offline fixture.
  - `429 Too Many Requests`: Handled with exponential backoff and `Retry-After` header parsing.
- **Cache Policy**: Responses cached on disk in `engine/sources/.cache/wiktionary_{lang}_{lemma}.json`.

### 2.2 Tatoeba Corpus Search API
- **Endpoint**: `GET /en/api_v0/search?from={por|spa}&to=eng&query={query}&trans_filter=limit&limit={limit}`
- **Host**: `tatoeba.org`
- **Request Headers**:
  ```http
  User-Agent: PolyglotC1DailyBot/1.0 (Educational Language Learning Research; contact@polyglot.dev)
  Accept: application/json
  ```
- **Response Format**: JSON object with `results` array containing `id`, `text`, `translations`, and `audios`.
- **Audio Stream URL**: `https://audio.tatoeba.org/sentences/{lang}/{sentence_id}.mp3`
- **Error Handling**: On network failure, timeout, or missing results, falls back to `fixtures/tatoeba_{lang}_fixtures.json`.

### 2.3 Wikimedia Commons Media API
- **Endpoint**: `GET /w/api.php?action=query&titles=File:{filename}&prop=imageinfo&iiprop=url|extmetadata&format=json`
- **Host**: `commons.wikimedia.org`
- **Request Headers**: Standard User-Agent header identifying the Polyglot C1 Daily bot.
- **Response Format**: Image and audio file metadata including direct CDN download URLs.
- **Error Handling**: Falls back to `fixtures/wikimedia_fixtures.json`.

### 2.4 Wikipedia REST Summary API
- **Endpoint**: `GET /api/rest_v1/page/summary/{title}`
- **Hosts**: `pt.wikipedia.org` (Portuguese), `es.wikipedia.org` (Spanish)
- **Request Headers**:
  ```http
  User-Agent: PolyglotC1DailyBot/1.0 (Educational Language Learning Research; contact@polyglot.dev)
  Accept: application/json
  ```
- **Response Fields**: `pageid`, `title`, `extract` (clean plain-text introductory passage), `description`, `thumbnail.source`, `content_urls.desktop.page`, `revision`, `timestamp`.
- **Usage Strategy**: Supplies authentic reading material for Section 4 with CEFR level adaptation (A1-B1 excerpts, B2-C1 full extracts). Zero bulk article text stored in database.
- **Error Handling**: Graceful fallback cascade to curated reading passages (`reading_and_dialogues.json`) and offline test fixtures (`wikipedia_{lang}_fixtures.json`).
- **Cache Policy**: Disk cached in `engine/sources/.cache/wikipedia_{lang}_{title}.json`.

---

## 3. Resilience & Offline Guarantee

1. **Zero Runtime Blocking**: No external API is a mandatory blocker for daily lesson generation or frontend dashboard rendering.
2. **Local Caching**: Every external request is hashed and cached locally to prevent redundant bandwidth consumption and abide by API usage guidelines.
3. **Graceful Fallbacks**: If any API endpoint returns 429, 500, or times out after 3 retries, the system transparently utilizes the curated offline test fixtures in `engine/sources/fixtures/`.
