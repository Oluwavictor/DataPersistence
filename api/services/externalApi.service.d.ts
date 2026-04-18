import { GenderData, AgeData, NationalityData, EnrichedProfileData } from "../types";

export declare class ExternalApiService {
  getGender(name: string): Promise<GenderData>;
  getAge(name: string): Promise<AgeData>;
  getNationality(name: string): Promise<NationalityData>;
  enrichName(name: string): Promise<EnrichedProfileData>;
}

export declare const externalApiService: ExternalApiService;