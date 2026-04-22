import { AgeGroup, SuccessResponse, PaginatedResponse, ErrorResponse, ProfileFullResponse, ProfileListItem } from "../types";
import { Profile } from "../entities/Profile";

export declare function generateId(): string;
export declare function classifyAge(age: number): AgeGroup;
export declare function successResponse<T>(data: T, options?: { message?: string; count?: number }): SuccessResponse<T>;
export declare function paginatedResponse<T>(data: T[], page: number, limit: number, total: number): PaginatedResponse<T>;
export declare function errorResponse(message: string): ErrorResponse;
export declare function toFullProfile(entity: Profile): ProfileFullResponse;
export declare function toListItem(entity: Profile): ProfileListItem;