export interface GenderizeApiResponse {
	readonly count: number;
	readonly name: string;
	readonly gender: string | null;
	readonly probability: number;
  }
  
  export interface AgifyApiResponse {
	readonly count: number;
	readonly name: string;
	readonly age: number | null;
  }
  
  export interface NationalizeCountry {
	readonly country_id: string;
	readonly probability: number;
  }
  
  export interface NationalizeApiResponse {
	readonly count: number;
	readonly name: string;
	readonly country: NationalizeCountry[];
  }
  
  export interface GenderData {
	readonly gender: string;
	readonly gender_probability: number;
	readonly sample_size: number;
  }
  
  export interface AgeData {
	readonly age: number;
	readonly age_group: AgeGroup;
  }
  
  export interface NationalityData {
	readonly country_id: string;
	readonly country_name: string;
	readonly country_probability: number;
  }
  
  export interface EnrichedProfileData
	extends GenderData,
	  AgeData,
	  NationalityData {}
  
  export const AGE_GROUP = {
	CHILD: "child",
	TEENAGER: "teenager",
	ADULT: "adult",
	SENIOR: "senior",
  } as const;
  
  export type AgeGroup = (typeof AGE_GROUP)[keyof typeof AGE_GROUP];
  
  export const AGE_THRESHOLDS = {
	CHILD_MAX: 12,
	TEENAGER_MAX: 19,
	ADULT_MAX: 59,
  } as const;
  
  export const EXTERNAL_API_NAMES = {
	GENDERIZE: "Genderize",
	AGIFY: "Agify",
	NATIONALIZE: "Nationalize",
  } as const;
  
  export type ExternalApiName =
	(typeof EXTERNAL_API_NAMES)[keyof typeof EXTERNAL_API_NAMES];
  
  export const HTTP_STATUS = {
	OK: 200,
	CREATED: 201,
	NO_CONTENT: 204,
	BAD_REQUEST: 400,
	NOT_FOUND: 404,
	UNPROCESSABLE_ENTITY: 422,
	INTERNAL_SERVER_ERROR: 500,
	BAD_GATEWAY: 502,
  } as const;
  
  export type HttpStatusCode =
	(typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];
  
  export interface SuccessResponse<T = unknown> {
	readonly status: "success";
	readonly message?: string;
	readonly count?: number;
	readonly data: T;
  }
  
  export interface PaginatedResponse<T = unknown> {
	readonly status: "success";
	readonly page: number;
	readonly limit: number;
	readonly total: number;
	readonly data: T[];
  }
  
  export interface ErrorResponse {
	readonly status: "error";
	readonly message: string;
  }
  
  export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;
  
  export interface ProfileFullResponse {
	readonly id: string;
	readonly name: string;
	readonly gender: string;
	readonly gender_probability: number;
	readonly sample_size?: number;
	readonly age: number;
	readonly age_group: string;
	readonly country_id: string | null;
	readonly country_name: string | null;
	readonly country_probability: number | null;
	readonly created_at: string;
  }
  
  export interface ProfileListItem {
	readonly id: string;
	readonly name: string;
	readonly gender: string;
	readonly age: number;
	readonly age_group: string;
	readonly country_id: string | null;
	readonly country_name: string | null;
  }
  
  export interface ProfileFilters {
	gender?: string;
	age_group?: string;
	country_id?: string;
	min_age?: string;
	max_age?: string;
	min_gender_probability?: string;
	min_country_probability?: string;
	sort_by?: string;
	order?: string;
	page?: string;
	limit?: string;
  }
  
  export interface NLQFilters {
	gender?: string;
	age_group?: string;
	country_id?: string;
	min_age?: number;
	max_age?: number;
  }
  
  export abstract class AppError extends Error {
	public abstract readonly statusCode: HttpStatusCode;
  
	protected constructor(message: string) {
	  super(message);
	  this.name = this.constructor.name;
	  Object.setPrototypeOf(this, new.target.prototype);
	}
  }
  
  export class ValidationError extends AppError {
	public readonly statusCode = HTTP_STATUS.BAD_REQUEST;
	constructor(message: string) {
	  super(message);
	}
  }
  
  export class UnprocessableError extends AppError {
	public readonly statusCode = HTTP_STATUS.UNPROCESSABLE_ENTITY;
	constructor(message: string) {
	  super(message);
	}
  }
  
  export class NotFoundError extends AppError {
	public readonly statusCode = HTTP_STATUS.NOT_FOUND;
	constructor(message = "Profile not found") {
	  super(message);
	}
  }
  
  export class ExternalApiError extends AppError {
	public readonly statusCode = HTTP_STATUS.BAD_GATEWAY;
	public readonly apiName: ExternalApiName;
	constructor(apiName: ExternalApiName) {
	  super(`${apiName} returned an invalid response`);
	  this.apiName = apiName;
	}
  }
  
  export class InternalError extends AppError {
	public readonly statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
	constructor(message = "Internal server error") {
	  super(message);
	}
  }