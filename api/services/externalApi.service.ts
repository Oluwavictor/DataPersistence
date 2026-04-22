import axios, { AxiosInstance, AxiosError } from "axios";
import {
  GenderizeApiResponse,
  AgifyApiResponse,
  NationalizeApiResponse,
  GenderData,
  AgeData,
  NationalityData,
  EnrichedProfileData,
  ExternalApiError,
  EXTERNAL_API_NAMES,
  ExternalApiName,
} from "../types";
import { classifyAge } from "../utils";

const COUNTRY_NAME_MAP: Record<string, string> = {
  NG: "Nigeria", GH: "Ghana", KE: "Kenya", AO: "Angola",
  ET: "Ethiopia", TZ: "Tanzania", UG: "Uganda", SN: "Senegal",
  CM: "Cameroon", CI: "Ivory Coast", ZM: "Zambia", ZW: "Zimbabwe",
  MZ: "Mozambique", MG: "Madagascar", ML: "Mali", MW: "Malawi",
  NE: "Niger", BF: "Burkina Faso", GN: "Guinea", BJ: "Benin",
  TG: "Togo", RW: "Rwanda", BI: "Burundi", SO: "Somalia",
  SD: "Sudan", TD: "Chad", ZA: "South Africa", EG: "Egypt",
  MA: "Morocco", DZ: "Algeria", TN: "Tunisia", LY: "Libya",
  US: "United States", GB: "United Kingdom", FR: "France",
  DE: "Germany", ES: "Spain", IT: "Italy", PT: "Portugal",
  BR: "Brazil", MX: "Mexico", CA: "Canada", AU: "Australia",
  IN: "India", CN: "China", JP: "Japan", RU: "Russia",
  ID: "Indonesia", PK: "Pakistan", BD: "Bangladesh",
  PH: "Philippines", VN: "Vietnam", TH: "Thailand",
  TR: "Turkey", IR: "Iran", IQ: "Iraq", SA: "Saudi Arabia",
  KR: "South Korea", AR: "Argentina", CO: "Colombia",
  PE: "Peru", VE: "Venezuela", CL: "Chile", EC: "Ecuador",
  BO: "Bolivia", PY: "Paraguay", UY: "Uruguay", CU: "Cuba",
  HT: "Haiti", DO: "Dominican Republic", GT: "Guatemala",
  HN: "Honduras", SV: "El Salvador", NI: "Nicaragua",
  CR: "Costa Rica", PA: "Panama", RO: "Romania", UA: "Ukraine",
  PL: "Poland", NL: "Netherlands", BE: "Belgium", SE: "Sweden",
  NO: "Norway", DK: "Denmark", FI: "Finland", CH: "Switzerland",
  AT: "Austria", CZ: "Czech Republic", HU: "Hungary",
  GR: "Greece", RS: "Serbia", HR: "Croatia",
};

const API_TIMEOUT_MS = 30_000;

export class ExternalApiService {
  private readonly client: AxiosInstance;
  private readonly urls: Readonly<{
    genderize: string;
    agify: string;
    nationalize: string;
  }>;

  constructor() {
    this.urls = Object.freeze({
      genderize: process.env.GENDERIZE_URL || "https://api.genderize.io",
      agify: process.env.AGIFY_URL || "https://api.agify.io",
      nationalize: process.env.NATIONALIZE_URL || "https://api.nationalize.io",
    });

    this.client = axios.create({
      timeout: API_TIMEOUT_MS,
      headers: {
        Accept: "application/json",
        "User-Agent": "ProfileIntelligenceService/1.0",
      },
    });
  }

  async getGender(name: string): Promise<GenderData> {
    let data: GenderizeApiResponse;
    try {
      const response = await this.client.get<GenderizeApiResponse>(
        this.urls.genderize,
        { params: { name } }
      );
      data = response.data;
    } catch (err) {
      this.logAxiosError(err, EXTERNAL_API_NAMES.GENDERIZE);
      throw new ExternalApiError(EXTERNAL_API_NAMES.GENDERIZE);
    }
    if (data.gender === null || data.count === 0) {
      throw new ExternalApiError(EXTERNAL_API_NAMES.GENDERIZE);
    }
    return {
      gender: data.gender,
      gender_probability: data.probability,
      sample_size: data.count,
    };
  }

  async getAge(name: string): Promise<AgeData> {
    let data: AgifyApiResponse;
    try {
      const response = await this.client.get<AgifyApiResponse>(
        this.urls.agify,
        { params: { name } }
      );
      data = response.data;
    } catch (err) {
      this.logAxiosError(err, EXTERNAL_API_NAMES.AGIFY);
      throw new ExternalApiError(EXTERNAL_API_NAMES.AGIFY);
    }
    if (data.age === null) {
      throw new ExternalApiError(EXTERNAL_API_NAMES.AGIFY);
    }
    return { age: data.age, age_group: classifyAge(data.age) };
  }

  async getNationality(name: string): Promise<NationalityData> {
    let data: NationalizeApiResponse;
    try {
      const response = await this.client.get<NationalizeApiResponse>(
        this.urls.nationalize,
        { params: { name } }
      );
      data = response.data;
    } catch (err) {
      this.logAxiosError(err, EXTERNAL_API_NAMES.NATIONALIZE);
      throw new ExternalApiError(EXTERNAL_API_NAMES.NATIONALIZE);
    }
    if (!data.country || data.country.length === 0) {
      throw new ExternalApiError(EXTERNAL_API_NAMES.NATIONALIZE);
    }
    const top = data.country[0];
    return {
      country_id: top.country_id,
      country_name: COUNTRY_NAME_MAP[top.country_id] || top.country_id,
      country_probability: top.probability,
    };
  }

  async enrichName(name: string): Promise<EnrichedProfileData> {
    const genderData = await this.getGender(name);
    const ageData = await this.getAge(name);
    const nationalityData = await this.getNationality(name);
    return { ...genderData, ...ageData, ...nationalityData };
  }

  private logAxiosError(err: unknown, apiName: ExternalApiName): void {
    if (axios.isAxiosError(err)) {
      const e = err as AxiosError;
      console.error(`[ExternalApiService] ${apiName} failed:`, {
        status: e.response?.status,
        message: e.message,
      });
    } else {
      console.error(`[ExternalApiService] ${apiName} unexpected:`, err);
    }
  }
}

export const externalApiService = new ExternalApiService();