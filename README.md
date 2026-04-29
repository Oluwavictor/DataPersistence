# Insighta Labs Backend — Stage 3

Secure, multi-interface platform for demographic intelligence.  
Extends Stage 2 with GitHub OAuth, RBAC, API versioning, CSV export, rate limiting, and structured logging.

---

## System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     Clients                              │
│  CLI (insighta-cli)  │  Web Portal (insighta-web)        │
└──────────────┬───────┴──────────────┬────────────────────┘
               │                      │
               ▼                      ▼
┌─────────────────────────────────────────────────────────┐
│                  insighta-backend                        │
│                                                          │
│  /auth/*         GitHub OAuth + Token Management         │
│  /api/profiles/* Profile CRUD + Filtering + NLQ          │
│                                                          │
│  Middleware Stack:                                        │
│  authenticate → requireApiVersion → requireRole          │
│  → rateLimiter → requestLogger                           │
│                                                          │
│  MySQL (TypeORM)                                         │
│  tables: users, refresh_tokens, profiles                 │
└─────────────────────────────────────────────────────────┘
```

---

## Auth Flow

### Web (Browser)
```
User → Click "Login with GitHub"
     → GET /auth/github (backend redirects to GitHub)
     → GitHub callback → GET /auth/github/callback
     → Backend creates/updates user
     → Issues access_token (3m) + refresh_token (5m)
     → Sets HTTP-only cookies
     → Redirects to /dashboard
```

### CLI (PKCE)
```
insighta login
  → CLI generates: state, code_verifier, code_challenge
  → CLI starts local HTTP server on port 9876
  → CLI opens browser: GET /auth/github?source=cli&callback_port=9876&code_challenge=...
  → GitHub authenticates user
  → Callback: GET /auth/github/callback
  → Backend exchanges code, creates user, issues tokens
  → Redirects to http://localhost:9876/callback?access_token=...&refresh_token=...
  → CLI captures tokens, stores at ~/.insighta/credentials.json
  → Prints: Logged in as @username
```

---

## Token Handling

| Token | Expiry | Storage (Web) | Storage (CLI) |
|-------|--------|---------------|---------------|
| access_token | 3 minutes | HTTP-only cookie | credentials.json |
| refresh_token | 5 minutes | HTTP-only cookie (path: /auth/refresh) | credentials.json |

- Refresh tokens are single-use (rotated on every use)
- Old refresh token is revoked immediately on rotation
- Revoked tokens stored in `refresh_tokens` table

---

## Role Enforcement

| Role | Permissions |
|------|------------|
| `admin` | GET, POST, DELETE profiles + search + export |
| `analyst` | GET profiles + search + export (read-only) |

All `/api/*` endpoints require:
1. Valid access token (Bearer or HTTP-only cookie)
2. `X-API-Version: 1` header
3. Sufficient role

---

## API Versioning

All `/api/*` requests must include:
```
X-API-Version: 1
```
Missing header → `400 Bad Request`

---

## Rate Limiting

| Scope | Limit |
|-------|-------|
| `/auth/*` | 10 req/min |
| `/api/*` | 60 req/min per user |

---

## Natural Language Search

```
GET /api/profiles/search?q=young males from nigeria
```

Rule-based parser — no AI/LLM:
- Gender: `male/males/man/men/female/females/woman/women`
- Age groups: `child/teen/teenager/adult/senior/elderly`
- `young` → ages 16–24
- `above X` / `over X` → min_age=X
- `below X` / `under X` → max_age=X
- `between X and Y` → min_age=X, max_age=Y
- Country: dictionary of 80+ countries → ISO codes

---

## Quick Start

```bash
cp .env.example .env
# Fill in: GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, JWT secrets, DB credentials

npm install
npm run dev
```

---

## Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| GET | `/auth/github` | Initiate GitHub OAuth |
| GET | `/auth/github/callback` | OAuth callback |
| POST | `/auth/refresh` | Rotate token pair |
| POST | `/auth/logout` | Revoke refresh token |
| GET | `/auth/whoami` | Current user info |

### Profiles (require `X-API-Version: 1` + auth)
| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/api/profiles` | any | List with filters/sort/pagination |
| GET | `/api/profiles/search` | any | Natural language search |
| GET | `/api/profiles/export?format=csv` | any | Export as CSV |
| GET | `/api/profiles/:id` | any | Get single profile |
| POST | `/api/profiles` | admin | Create profile |
| DELETE | `/api/profiles/:id` | admin | Delete profile |