# 09 — Module API Contracts

> Transport-agnostic service layer implemented in `engine/api/` (`models.py`, `content_service.py`, `discovery_service.py`). HTTP transport (FastAPI / Supabase Edge Functions) is a later layer.

## 1. Conventions

- Query filters: `contentType`, `targetLanguage`, `explanationLanguage`, `cefrLevel`, `topic`, `category`, `page`, `pageSize`, `sort`.
- Pagination response: `{ data: [...], page, pageSize, total, nextCursor? }`.
- Published-content visibility rules applied server-side; learners never see drafts/unpublished.
- Internal provider/usage info is never returned to learners.

## 2. Content endpoints

```http
GET  /api/content                 # list published, filters + pagination
GET  /api/content/:id             # published item
GET  /api/content/:id/versions/:version
GET  /api/content/:id/activities
GET  /api/content/daily           # daily edition
GET  /api/content/recommendations
GET  /api/content/search
GET  /api/content/vocabulary
GET  /api/content/grammar
```

## 3. Discovery endpoints

```http
GET  /api/discovery
GET  /api/discovery/:id
GET  /api/discovery/categories
GET  /api/discovery/search
GET  /api/discovery/collections
```

## 4. Module mapping

| Module | Consumes |
| :--- | :--- |
| Home | `/content/daily`, `/content/recommendations`, continue-learning, recent progress |
| Learn | `/content` (8 types), filters |
| Reader | `/content/:id/versions/:version`, `/content/:id/activities` |
| Vocabulary | `/content/vocabulary`, save words, real-world examples |
| Grammar | `/content/grammar` |
| Practice | `/content/:id/activities` + deterministic scoring |
| Discovery | `/discovery*` |
| Admin | generation config, providers, jobs, review, publication, Discovery sources |

## 5. Example requests/responses

### 5.1 List stories for a Spanish learner (English explanations, B1)

```http
GET /api/content?contentType=story&targetLanguage=es&explanationLanguage=en&cefrLevel=B1&page=1&pageSize=20
```

```json
{
  "data": [
    {
      "id": "uuid",
      "contentType": "story",
      "title": "Una tarde en Madrid",
      "targetLanguage": "es",
      "explanationLanguage": "en",
      "cefrLevel": "B1",
      "summary": "A short story set in Madrid.",
      "currentVersionId": "uuid"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 1
}
```

### 5.2 Discovery search

```http
GET /api/discovery/search?targetLanguage=pt&category=culture&q=lisboa
```

```json
{
  "data": [
    {
      "id": "uuid",
      "category": "culture",
      "title": "Lisboa, cidade das sete colinas",
      "sourceUrl": "https://...",
      "facts": { "country": "PT" },
      "explanation": "A learner-friendly note about Lisbon's geography.",
      "provenance": { "source_name": "wikipedia", "license_name": "CC BY-SA", "attribution": "..." }
    }
  ]
}
```

## 6. Validation

- `pageSize` capped (e.g. ≤ 50).
- Language/CEFR filters validated against allowed enums.
- Unknown filters are ignored (or 400) — to be finalized with the transport layer.
