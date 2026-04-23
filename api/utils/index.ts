import { uuidv7 } from "uuidv7";
import {
  AGE_GROUP,
  AGE_THRESHOLDS,
  AgeGroup,
  SuccessResponse,
  ErrorResponse,
  ProfileFullResponse,
  ProfileListItem,
  PaginatedResponse,
} from "../types";
import { Profile } from "../entities/Profile";

export function generateId(): string {
  return uuidv7();
}

export function classifyAge(age: number): AgeGroup {
  if (age <= AGE_THRESHOLDS.CHILD_MAX) return AGE_GROUP.CHILD;
  if (age <= AGE_THRESHOLDS.TEENAGER_MAX) return AGE_GROUP.TEENAGER;
  if (age <= AGE_THRESHOLDS.ADULT_MAX) return AGE_GROUP.ADULT;
  return AGE_GROUP.SENIOR;
}

export function successResponse<T>(
  data: T,
  options: { message?: string; count?: number } = {}
): SuccessResponse<T> {
  const response: SuccessResponse<T> = {
    status: "success",
    data,
  };

  if (options.message !== undefined) {
    (response as SuccessResponse<T> & { message: string }).message =
      options.message;
  }

  if (options.count !== undefined) {
    (response as SuccessResponse<T> & { count: number }).count = options.count;
  }

  return response;
}

export function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> {
  return { status: "success", page, limit, total, data };
}

export function errorResponse(message: string): ErrorResponse {
  return { status: "error", message };
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseFloat(value);
  return Number(value);
}

function toISO(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") {
    return value.endsWith("Z") ? value : new Date(value).toISOString();
  }
  return new Date(String(value)).toISOString();
}

export function toFullProfile(entity: Profile): ProfileFullResponse {
  return {
    id: entity.id,
    name: entity.name,
    gender: entity.gender,
    gender_probability: toNumber(entity.gender_probability),
    sample_size: toNumber(entity.sample_size),
    age: toNumber(entity.age),
    age_group: entity.age_group,
    country_id: entity.country_id,
    country_name: entity.country_name,
    country_probability:
      entity.country_probability !== null
        ? toNumber(entity.country_probability)
        : null,
    created_at: toISO(entity.created_at),
  };
}

export function toListItem(entity: Profile): ProfileListItem {
  return {
    id: entity.id,
    name: entity.name,
    gender: entity.gender,
    age: toNumber(entity.age),
    age_group: entity.age_group,
    country_id: entity.country_id,
    country_name: entity.country_name,
  };
}
