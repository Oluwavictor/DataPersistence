# Data Persistence

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

## Validation

| Input | Status | Message |
|-------|--------|---------|
| No name field | 400 | Name is required |
| `name: ""` | 400 | Name is required |
| `name: "  "` | 400 | Name is required |
| `name: 123` | 422 | Name must be a string |
| `name: true` | 422 | Name must be a string |
| `name: "ella"` | 201 | Profile created |
| `name: "ELLA"` (dup) | 201 | Profile already exists |

---

## Error Codes

| Code | Meaning |
|------|---------|
| 400 | Missing or empty name |
| 404 | Profile / route not found |
| 422 | Name is not a string |
| 502 | External API returned invalid data |
| 500 | Internal server error |