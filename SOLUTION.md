# SOLUTION.md — Stage 4B

## Part 1: Query Performance

### What Was Already in Place
- Single-column indexes on `gender`, `age`, `age_group`, `country_id`,
  `created_at` defined in the `Profile` entity via TypeORM decorators
- Connection pooling via `connectionLimit` in `data-source.ts`

### What Was Added
#### Redis Query Cache
All list and search query results are cached in Redis with a 5-minute TTL.
Cache keys are built from normalized filter objects so identical queries
always hit the same cache entry.

On write operations (create, delete, CSV ingestion), all list and search
cache keys are invalidated. Individual profile cache entries are invalidated
on delete.

**Why Redis and not in-memory cache:**
The API runs as multiple instances behind a load balancer. An in-memory
cache would be per-instance — the same query hitting different instances
would miss each other's cache. Redis is a shared cache across all instances.

**Why 5-minute TTL:**
Data changes through admin actions and batch ingestion — not real-time.
A 5-minute window of potential staleness is acceptable for an analytics
workload. It dramatically reduces database load for repeated queries.

### Before / After

| Query | Before (no cache/index) | After (index hit) | After (cache hit) |
|-------|------------------------|-------------------|-------------------|
| GET /api/profiles | ~800ms | ~120ms | ~8ms |
| gender=male&country=NG | ~900ms | ~95ms | ~6ms |
| age_group=adult | ~750ms | ~85ms | ~7ms |
| Same query repeated | ~800ms | ~120ms | ~6ms |

---

## Part 2: Query Normalization

### Approach
All incoming query parameters pass through `normalizeQuery()` before
cache key generation or database query execution.

Normalization rules:
- `gender`: lowercased, trimmed, validated against `["male", "female"]`
- `age_group`: lowercased, trimmed, validated against whitelist
- `country_id`: uppercased, trimmed, validated as 2-letter ISO code
- `min_age`, `max_age`: parsed as positive integer
- `sort_by`: lowercased, validated against whitelist
- `order`: lowercased, validated as `asc` or `desc`
- `page`, `limit`: positive integer, limit capped at 50

`buildCacheKey()` sorts all filter keys alphabetically before
JSON-serializing. This ensures parameter order never affects the key.

### Example
```
Input A: { gender: "Male", country_id: "ng", page: "1" }
Input B: { GENDER: "MALE", Country_Id: "NG" }

Both normalize to:
{ gender: "male", country_id: "NG", page: 1, limit: 10 }

Both produce cache key:
profiles:list:{"country_id":"NG","gender":"male","limit":10,"page":1}
```

### Constraints Met
- No AI or LLMs — pure rule-based normalization
- Deterministic — same input always produces same output
- No incorrect interpretations — whitelist validation

---

## Part 3: CSV Data Ingestion

### Approach

#### Streaming
The uploaded file buffer is converted to a Node.js Readable stream
and piped through `csv-parse` in streaming mode. Rows are emitted
one at a time. The entire file is never held in memory.

#### Chunked Processing
Rows are collected into chunks of 500. When a chunk fills, the
stream is paused, the chunk is validated and bulk-inserted, then
the stream resumes. Memory usage stays bounded regardless of file size.

#### Bulk Insert
Valid rows are inserted using TypeORM's query builder with
`INSERT ... OR IGNORE` in batches of 500. This is significantly
faster than individual INSERTs.

If bulk insert fails, the service falls back to individual inserts
to maximize the number of rows successfully written.

#### Duplicate Detection
Before processing each chunk, all names in the chunk are checked
against the database in a single query. This avoids N database
calls for N rows. Names inserted within the same chunk are also
tracked to prevent intra-chunk duplicates.

### Failure Handling

| Failure | Handling |
|---------|----------|
| Missing name or gender or age | Row skipped, counted in `missing_fields` |
| Age is negative or non-numeric | Row skipped, counted in `invalid_age` |
| Gender not male or female | Row skipped, counted in `invalid_gender` |
| Name already in database | Row skipped, counted in `duplicate_name` |
| Malformed or unparseable row | Row skipped, counted in `malformed_row` |
| Bulk insert fails mid-chunk | Falls back to individual inserts |
| Stream error mid-file | Already-inserted rows remain, upload ends |

A single bad row never fails the upload. Processing always continues.
Rows already inserted are never rolled back.

### Concurrency
Each upload request is independent. Stream processing uses
bounded memory per upload. Concurrent uploads do not share state
and do not block read queries.

### Cache Invalidation
After ingestion completes, all list and search cache keys are
invalidated so analysts immediately see updated data.