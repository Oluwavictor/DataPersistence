import { AppDataSource } from "../database/data-source";
import { Profile } from "../entities/Profile";
import { externalApiService } from "./externalApi.service";
import { nlqService } from "./nlq.service";
import {
  generateId,
  toFullProfile,
  toListItem,
  paginatedResponse,
  //successResponse,
} from "../utils";
import { NotFoundError, ProfileFilters } from "../types";
import { getCache, setCache, invalidateCacheByPattern } from "../cache/redis.client";
import { normalizeQuery, buildCacheKey, NormalizedFilters } from "../lib/normalizeQuery";

const VALID_SORT_FIELDS: Record<string, string> = {
  age: "p.age",
  created_at: "p.created_at",
  gender_probability: "p.gender_probability",
};

// const MAX_LIMIT = 50;
// const DEFAULT_LIMIT = 10;
// const DEFAULT_PAGE = 1;
const CACHE_TTL = 300;

const profileRepository = () => AppDataSource.getRepository(Profile);

function buildPaginationLinks(
  baseUrl: string,
  page: number,
  limit: number,
  total: number,
  query: Record<string, string>
): { self: string; next: string | null; prev: string | null } {
  const totalPages = Math.ceil(total / limit);

  const buildUrl = (p: number): string => {
    const params = new URLSearchParams({
      ...query,
      page: String(p),
      limit: String(limit),
    });
    return `${baseUrl}?${params.toString()}`;
  };

  return {
    self: buildUrl(page),
    next: page < totalPages ? buildUrl(page + 1) : null,
    prev: page > 1 ? buildUrl(page - 1) : null,
  };
}

function applyFilters(qb: any, filters: Partial<NormalizedFilters>): void {
  if (filters.gender) {
    qb.andWhere("LOWER(p.gender) = :gender", {
      gender: filters.gender.toLowerCase(),
    });
  }
  if (filters.age_group) {
    qb.andWhere("LOWER(p.age_group) = :age_group", {
      age_group: filters.age_group.toLowerCase(),
    });
  }
  if (filters.country_id) {
    qb.andWhere("UPPER(p.country_id) = :country_id", {
      country_id: filters.country_id.toUpperCase(),
    });
  }
  if (filters.min_age !== undefined) {
    qb.andWhere("p.age >= :min_age", { min_age: filters.min_age });
  }
  if (filters.max_age !== undefined) {
    qb.andWhere("p.age <= :max_age", { max_age: filters.max_age });
  }
  if (filters.min_gender_probability !== undefined) {
    qb.andWhere("p.gender_probability >= :mgp", {
      mgp: filters.min_gender_probability,
    });
  }
  if (filters.min_country_probability !== undefined) {
    qb.andWhere("p.country_probability >= :mcp", {
      mcp: filters.min_country_probability,
    });
  }
}

export class ProfileService {
  // ── Create ──────────────────────────────────────────────

  async create(name: string) {
    const repo = profileRepository();

    const existing = await repo.findOne({ where: { name } });
    if (existing) {
      return {
        profile: toFullProfile(existing),
        alreadyExists: true,
      };
    }

    const enriched = await externalApiService.enrichName(name);

    const profile = repo.create({
      id: generateId(),
      name,
      gender: enriched.gender,
      gender_probability: enriched.gender_probability,
      sample_size: enriched.sample_size,
      age: enriched.age,
      age_group: enriched.age_group,
      country_id: enriched.country_id,
      country_name: enriched.country_name,
      country_probability: enriched.country_probability,
    });

    const saved = await repo.save(profile);

    // Invalidate list and search caches on write
    await invalidateCacheByPattern("profiles:list:*");
    await invalidateCacheByPattern("profiles:search:*");

    return {
      profile: toFullProfile(saved),
      alreadyExists: false,
    };
  }

  // ── Get By ID ────────────────────────────────────────────

  async getById(id: string) {
    const cacheKey = `profiles:id:${id}`;
    const cached = await getCache(cacheKey);
    if (cached) return JSON.parse(cached);

    const profile = await profileRepository().findOne({ where: { id } });
    if (!profile) throw new NotFoundError();

    const result = toFullProfile(profile);

    // Cache individual profile for 10 minutes
    await setCache(cacheKey, JSON.stringify(result), 600);

    return result;
  }

  // ── List ─────────────────────────────────────────────────

  async list(rawQuery: Record<string, any>) {
    // Step 1 — normalize query params
    const normalized = normalizeQuery(rawQuery);

    // Step 2 — deterministic cache key
    const cacheKey = buildCacheKey("profiles:list", normalized);

    // Step 3 — check cache
    const cached = await getCache(cacheKey);
    if (cached) return JSON.parse(cached);

    // Step 4 — query database
    const { page: pageNum, limit: limitNum, sort_by, order } = normalized;
    const offset = (pageNum - 1) * limitNum;

    const sortField =
      sort_by && VALID_SORT_FIELDS[sort_by]
        ? VALID_SORT_FIELDS[sort_by]
        : "p.created_at";
    const sortOrder = order?.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const qb = profileRepository()
      .createQueryBuilder("p")
      .orderBy(sortField, sortOrder)
      .skip(offset)
      .take(limitNum);

    applyFilters(qb, normalized);

    const [profiles, total] = await qb.getManyAndCount();
    const totalPages = Math.ceil(total / limitNum);

    const queryParams: Record<string, string> = {};
    if (normalized.gender) queryParams.gender = normalized.gender;
    if (normalized.age_group) queryParams.age_group = normalized.age_group;
    if (normalized.country_id) queryParams.country_id = normalized.country_id;
    if (normalized.min_age !== undefined)
      queryParams.min_age = String(normalized.min_age);
    if (normalized.max_age !== undefined)
      queryParams.max_age = String(normalized.max_age);
    if (normalized.sort_by) queryParams.sort_by = normalized.sort_by;
    if (normalized.order) queryParams.order = normalized.order;

    const links = buildPaginationLinks(
      "/api/profiles",
      pageNum,
      limitNum,
      total,
      queryParams
    );

    const result = paginatedResponse(
      profiles.map(toListItem),
      pageNum,
      limitNum,
      total,
      totalPages,
      links
    );

    // Step 5 — cache result
    await setCache(cacheKey, JSON.stringify(result), CACHE_TTL);

    return result;
  }

  // ── Search ───────────────────────────────────────────────

  async search(rawQuery: Record<string, any>) {
    const q = rawQuery.q as string;

    if (!q || q.trim().length === 0) {
      throw new Error("INVALID_QUERY");
    }

    const filters = nlqService.parse(q);

    if (!filters) {
      throw new Error("UNINTERPRETABLE_QUERY");
    }

    const normalized = normalizeQuery({
      ...filters,
      page: rawQuery.page,
      limit: rawQuery.limit,
    });

    const cacheKey =
      buildCacheKey("profiles:search", normalized) +
      `:q=${q.toLowerCase().trim()}`;

    const cached = await getCache(cacheKey);
    if (cached) return JSON.parse(cached);

    const { page: pageNum, limit: limitNum } = normalized;
    const offset = (pageNum - 1) * limitNum;

    const qb = profileRepository()
      .createQueryBuilder("p")
      .orderBy("p.created_at", "DESC")
      .skip(offset)
      .take(limitNum);

    applyFilters(qb, normalized);

    const [profiles, total] = await qb.getManyAndCount();
    const totalPages = Math.ceil(total / limitNum);

    const links = buildPaginationLinks(
      "/api/profiles/search",
      pageNum,
      limitNum,
      total,
      { q }
    );

    const result = paginatedResponse(
      profiles.map(toListItem),
      pageNum,
      limitNum,
      total,
      totalPages,
      links
    );

    await setCache(cacheKey, JSON.stringify(result), CACHE_TTL);

    return result;
  }

  // ── Export CSV ───────────────────────────────────────────

  async exportCsv(rawQuery: ProfileFilters) {
    const {
      gender,
      age_group,
      country_id,
      min_age,
      max_age,
      min_gender_probability,
      min_country_probability,
      sort_by,
      order,
    } = rawQuery;

    const sortField =
      sort_by && VALID_SORT_FIELDS[sort_by]
        ? VALID_SORT_FIELDS[sort_by]
        : "p.created_at";
    const sortOrder =
      order && order.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const qb = profileRepository()
      .createQueryBuilder("p")
      .orderBy(sortField, sortOrder);

    if (gender)
      qb.andWhere("LOWER(p.gender) = LOWER(:gender)", { gender });
    if (age_group)
      qb.andWhere("LOWER(p.age_group) = LOWER(:age_group)", { age_group });
    if (country_id)
      qb.andWhere("UPPER(p.country_id) = UPPER(:country_id)", { country_id });
    if (min_age)
      qb.andWhere("p.age >= :min_age", { min_age: parseInt(min_age, 10) });
    if (max_age)
      qb.andWhere("p.age <= :max_age", { max_age: parseInt(max_age, 10) });
    if (min_gender_probability) {
      qb.andWhere("p.gender_probability >= :mgp", {
        mgp: parseFloat(min_gender_probability),
      });
    }
    if (min_country_probability) {
      qb.andWhere("p.country_probability >= :mcp", {
        mcp: parseFloat(min_country_probability),
      });
    }

    const profiles = await qb.getMany();

    const headers = [
      "id", "name", "gender", "gender_probability",
      "age", "age_group", "country_id", "country_name",
      "country_probability", "created_at",
    ];

    const rows = profiles.map((p) => [
      p.id,
      p.name,
      p.gender,
      p.gender_probability,
      p.age,
      p.age_group,
      p.country_id,
      p.country_name,
      p.country_probability,
      p.created_at instanceof Date
        ? p.created_at.toISOString()
        : String(p.created_at),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `profiles_${timestamp}.csv`;

    return { csv, filename };
  }

  // ── Delete ───────────────────────────────────────────────

  async delete(id: string) {
    const repo = profileRepository();
    const profile = await repo.findOne({ where: { id } });
    if (!profile) throw new NotFoundError();

    await repo.remove(profile);

    await invalidateCacheByPattern("profiles:list:*");
    await invalidateCacheByPattern("profiles:search:*");
    await invalidateCacheByPattern(`profiles:id:${id}`);
  }
}

export const profileService = new ProfileService();