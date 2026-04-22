# Data Persistence Stage 2

Query Engine upgrade: advanced filtering, sorting, pagination, and natural language search.

---

**Node.js · TypeScript · Express 5 · TypeORM · MySQL
---

## Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 18+ |
| Language | TypeScript |
| Framework | Express 5 |
| ORM | TypeORM 0.3 |
| Database | MySQL 8.0 |
| Validation | class-validator + class-transformer |
| HTTP Client | Axios |
| UUID | uuidv7 |
| Docs | Swagger UI (OpenAPI 3.0) |
| Testing | Jest + Supertest |

---

## Local Development

```bash
npm install
npm run dev
```

---

## Production

---

## Build

```bash
npm run build
npm start
```

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Health check |
| POST | `/api/profiles` | Create profile |
| GET | `/api/profiles` | List (filterable) |
| GET | `/api/profiles/:id` | Get by ID |
| DELETE | `/api/profiles/:id` | Delete |
| GET | `/api/docs` | Swagger UI |

---

## Filtering

```bash
GET /api/profiles?gender=male&country_id=NG&min_age=25
GET /api/profiles?age_group=adult&min_gender_probability=0.9
GET /api/profiles?min_age=20&max_age=40

### Supported Filters

| Param | Type | Description |
|-------|------|-------------|
| `gender` | string | male or female |
| `age_group` | string | child, teenager, adult, senior |
| `country_id` | string | ISO 2-letter code |
| `min_age` | number | Minimum age |
| `max_age` | number | Maximum age |
| `min_gender_probability` | float | Min gender confidence |
| `min_country_probability` | float | Min country confidence |

---

## Sorting

```bash
GET /api/profiles?sort_by=age&order=asc
GET /api/profiles?sort_by=gender_probability&order=desc
```

| Param | Values |
|-------|--------|
| `sort_by` | `age`, `created_at`, `gender_probability` |
| `order` | `asc`, `desc` |

---

## Pagination

```bash
GET /api/profiles?page=2&limit=20
```

| Param | Default | Max |
|-------|---------|-----|
| `page` | 1 | — |
| `limit` | 10 | 50 |

Response format:

```json
{
  "status": "success",
  "page": 1,
  "limit": 10,
  "total": 2026,
  "data": []
}
```

---

## Error Codes

| Code | Meaning |
|------|---------|
| 400 | Missing or empty name |
| 404 | Profile / route not found |
| 422 | Name is not a string |
| 502 | External API returned invalid data |
| 500 | Internal server error |

---

## NLQ Parser Explanation

The natural language parser (`api/services/nlq.service.ts`) uses rule-based keyword matching:

1. **Gender** — scans for keywords: `male`, `males`, `man`, `men`, `female`, `females`, `woman`, `women`, etc.
2. **Age group** — scans for: `child`, `teen`, `teenager`, `adult`, `senior`, `elderly`
3. **Age ranges** — regex patterns for: `above X`, `below X`, `between X and Y`, `aged X`, `young` (16–24)
4. **Country** — dictionary of 80+ country names mapped to ISO codes, sorted longest-first to avoid partial matches
5. **Unmatched** — if nothing matches, returns `null` → 400 response

No query is sent to an external API. All parsing runs in-memory.