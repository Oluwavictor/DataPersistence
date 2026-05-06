export interface NormalizedFilters {
	gender?: string;
	age_group?: string;
	country_id?: string;
	min_age?: number;
	max_age?: number;
	min_gender_probability?: number;
	min_country_probability?: number;
	sort_by?: string;
	order?: string;
	page: number;
	limit: number;
  }
  
  const VALID_GENDERS = ["male", "female"];
  const VALID_AGE_GROUPS = ["child", "teenager", "adult", "senior"];
  const VALID_SORT_FIELDS = ["age", "created_at", "gender_probability"];
  const VALID_ORDERS = ["asc", "desc"];
  const MAX_LIMIT = 50;
  const DEFAULT_LIMIT = 10;
  const DEFAULT_PAGE = 1;
  
  /**
   * Normalizes raw query params into a canonical filter object.
   *
   * Rules:
   * - gender: lowercased, trimmed, validated
   * - country_id: uppercased, trimmed, validated as 2-letter ISO
   * - age_group: lowercased, trimmed, validated against whitelist
   * - ages: parsed as positive integer
   * - sort_by: lowercased, validated against whitelist
   * - order: lowercased, validated
   * - page/limit: positive integer, limit capped at 50
   *
   * Two queries with the same intent always produce identical output.
   */
  export function normalizeQuery(
	raw: Record<string, any>
  ): NormalizedFilters {
	const filters: NormalizedFilters = {
	  page: DEFAULT_PAGE,
	  limit: DEFAULT_LIMIT,
	};
  
	// Gender
	if (raw.gender) {
	  const g = String(raw.gender).toLowerCase().trim();
	  if (VALID_GENDERS.includes(g)) {
		filters.gender = g;
	  }
	}
  
	// Age Group 
	if (raw.age_group) {
	  const ag = String(raw.age_group).toLowerCase().trim();
	  if (VALID_AGE_GROUPS.includes(ag)) {
		filters.age_group = ag;
	  }
	}
  
	// Country 
	// Accept both country_id and country
	const rawCountry = raw.country_id || raw.country;
	if (rawCountry) {
	  const c = String(rawCountry).toUpperCase().trim();
	  if (/^[A-Z]{2}$/.test(c)) {
		filters.country_id = c;
	  }
	}
  
	// Age Range 
	if (raw.min_age !== undefined && raw.min_age !== "") {
	  const v = parseInt(String(raw.min_age), 10);
	  if (!isNaN(v) && v >= 0) filters.min_age = v;
	}
  
	if (raw.max_age !== undefined && raw.max_age !== "") {
	  const v = parseInt(String(raw.max_age), 10);
	  if (!isNaN(v) && v >= 0) filters.max_age = v;
	}
  
	// Probability Filters 
	if (raw.min_gender_probability !== undefined) {
	  const v = parseFloat(String(raw.min_gender_probability));
	  if (!isNaN(v) && v >= 0 && v <= 1) {
		filters.min_gender_probability = v;
	  }
	}
  
	if (raw.min_country_probability !== undefined) {
	  const v = parseFloat(String(raw.min_country_probability));
	  if (!isNaN(v) && v >= 0 && v <= 1) {
		filters.min_country_probability = v;
	  }
	}
  
	// Sort 
	if (raw.sort_by) {
	  const s = String(raw.sort_by).toLowerCase().trim();
	  if (VALID_SORT_FIELDS.includes(s)) {
		filters.sort_by = s;
	  }
	}
  
	if (raw.order) {
	  const o = String(raw.order).toLowerCase().trim();
	  if (VALID_ORDERS.includes(o)) {
		filters.order = o;
	  }
	}
  
	// Pagination 
	if (raw.page) {
	  const v = parseInt(String(raw.page), 10);
	  if (!isNaN(v) && v > 0) filters.page = v;
	}
  
	if (raw.limit) {
	  const v = parseInt(String(raw.limit), 10);
	  if (!isNaN(v) && v > 0) {
		filters.limit = Math.min(v, MAX_LIMIT);
	  }
	}
  
	return filters;
  }
  
  /**
   * Builds a deterministic cache key from normalized filters.
   *
   * Keys are sorted alphabetically before serialization.
   * This ensures order of parameters never affects the key.
   *
   * Example:
   *   { gender: "male", country_id: "NG", page: 1, limit: 10 }
   *   → "profiles:{"country_id":"NG","gender":"male","limit":10,"page":1}"
   */
  export function buildCacheKey(
	prefix: string,
	filters: NormalizedFilters
  ): string {
	const sorted = Object.keys(filters)
	  .sort()
	  .reduce((acc, key) => {
		const val = filters[key as keyof NormalizedFilters];
		if (val !== undefined) {
		  acc[key] = val;
		}
		return acc;
	  }, {} as Record<string, any>);
  
	return `${prefix}:${JSON.stringify(sorted)}`;
}