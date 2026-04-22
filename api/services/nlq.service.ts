import { NLQFilters } from "../types";

const COUNTRY_MAP: Record<string, string> = {
  nigeria: "NG",
  ghana: "GH",
  kenya: "KE",
  angola: "AO",
  ethiopia: "ET",
  tanzania: "TZ",
  uganda: "UG",
  senegal: "SN",
  cameroon: "CM",
  "ivory coast": "CI",
  "cote d'ivoire": "CI",
  zambia: "ZM",
  zimbabwe: "ZW",
  mozambique: "MZ",
  madagascar: "MG",
  mali: "ML",
  malawi: "MW",
  niger: "NE",
  burkina: "BF",
  "burkina faso": "BF",
  guinea: "GN",
  benin: "BJ",
  togo: "TG",
  rwanda: "RW",
  burundi: "BI",
  somalia: "SO",
  sudan: "SD",
  chad: "TD",
  "south africa": "ZA",
  egypt: "EG",
  morocco: "MA",
  algeria: "DZ",
  tunisia: "TN",
  libya: "LY",
  "united states": "US",
  usa: "US",
  america: "US",
  "united kingdom": "GB",
  uk: "GB",
  britain: "GB",
  england: "GB",
  france: "FR",
  germany: "DE",
  spain: "ES",
  italy: "IT",
  portugal: "PT",
  brazil: "BR",
  mexico: "MX",
  canada: "CA",
  australia: "AU",
  india: "IN",
  china: "CN",
  japan: "JP",
  russia: "RU",
  indonesia: "ID",
  pakistan: "PK",
  bangladesh: "BD",
  philippines: "PH",
  vietnam: "VN",
  thailand: "TH",
  turkey: "TR",
  iran: "IR",
  iraq: "IQ",
  "saudi arabia": "SA",
  "south korea": "KR",
  korea: "KR",
  argentina: "AR",
  colombia: "CO",
  peru: "PE",
  venezuela: "VE",
  chile: "CL",
  ecuador: "EC",
  bolivia: "BO",
  paraguay: "PY",
  uruguay: "UY",
  cuba: "CU",
  haiti: "HT",
  "dominican republic": "DO",
  guatemala: "GT",
  honduras: "HN",
  "el salvador": "SV",
  nicaragua: "NI",
  "costa rica": "CR",
  panama: "PA",
  romania: "RO",
  ukraine: "UA",
  poland: "PL",
  netherlands: "NL",
  belgium: "BE",
  sweden: "SE",
  norway: "NO",
  denmark: "DK",
  finland: "FI",
  switzerland: "CH",
  austria: "AT",
  "czech republic": "CZ",
  hungary: "HU",
  greece: "GR",
  serbia: "RS",
  croatia: "HR",
};

const GENDER_KEYWORDS: Record<string, string> = {
  male: "male",
  males: "male",
  man: "male",
  men: "male",
  boy: "male",
  boys: "male",
  female: "female",
  females: "female",
  woman: "female",
  women: "female",
  girl: "female",
  girls: "female",
};

const AGE_GROUP_KEYWORDS: Record<string, string> = {
  child: "child",
  children: "child",
  kid: "child",
  kids: "child",
  teenager: "teenager",
  teenagers: "teenager",
  teen: "teenager",
  teens: "teenager",
  adolescent: "teenager",
  adolescents: "teenager",
  adult: "adult",
  adults: "adult",
  senior: "senior",
  seniors: "senior",
  elderly: "senior",
  old: "senior",
};

const YOUNG_AGE_MIN = 16;
const YOUNG_AGE_MAX = 24;

export class NLQService {
  parse(query: string): NLQFilters | null {
    if (!query || query.trim().length === 0) return null;

    const q = query.toLowerCase().trim();
    const filters: NLQFilters = {};
    let matched = false;

    // Gender
    for (const [keyword, gender] of Object.entries(GENDER_KEYWORDS)) {
      const regex = new RegExp(`\\b${keyword}\\b`);
      if (regex.test(q)) {
        filters.gender = gender;
        matched = true;
        break;
      }
    }

    // Age group
    for (const [keyword, group] of Object.entries(AGE_GROUP_KEYWORDS)) {
      const regex = new RegExp(`\\b${keyword}\\b`);
      if (regex.test(q)) {
        filters.age_group = group;
        matched = true;
        break;
      }
    }

    // young - ages 16–24
    if (/\byoung\b/.test(q)) {
      filters.min_age = YOUNG_AGE_MIN;
      filters.max_age = YOUNG_AGE_MAX;
      matched = true;
    }

    // "above X" or "older than X"
    const aboveMatch = q.match(/(?:above|over|older than)\s+(\d+)/);
    if (aboveMatch) {
      filters.min_age = parseInt(aboveMatch[1], 10);
      matched = true;
    }

    // "below X" or "younger than X"
    const belowMatch = q.match(/(?:below|under|younger than)\s+(\d+)/);
    if (belowMatch) {
      filters.max_age = parseInt(belowMatch[1], 10);
      matched = true;
    }

    // "between X and Y"
    const betweenMatch = q.match(/between\s+(\d+)\s+and\s+(\d+)/);
    if (betweenMatch) {
      filters.min_age = parseInt(betweenMatch[1], 10);
      filters.max_age = parseInt(betweenMatch[2], 10);
      matched = true;
    }

    // "age X"
    const agedMatch = q.match(/\baged?\s+(\d+)\b/);
    if (agedMatch) {
      filters.min_age = parseInt(agedMatch[1], 10);
      filters.max_age = parseInt(agedMatch[1], 10);
      matched = true;
    }

    // Country — check multi-word first, then single word
    const sortedCountries = Object.keys(COUNTRY_MAP).sort(
      (a, b) => b.length - a.length
    );
    for (const country of sortedCountries) {
      if (q.includes(country)) {
        filters.country_id = COUNTRY_MAP[country];
        matched = true;
        break;
      }
    }

    if (!matched) return null;

    return filters;
  }
}

export const nlqService = new NLQService();