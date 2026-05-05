// import { Request, Response, NextFunction } from "express";
// import { AppDataSource } from "../database/data-source";
// import { Profile } from "../entities/Profile";
// import { externalApiService } from "../services/externalApi.service";
// import { nlqService } from "../services/nlq.service";
// import {
//   generateId,
//   successResponse,
//   paginatedResponse,
//   errorResponse,
//   toFullProfile,
//   toListItem,
// } from "../utils";
// import { NotFoundError, HTTP_STATUS, ProfileFilters } from "../types";
// import { CreateProfileDto } from "../dtos/CreateProfile.dto";

// type DtoRequest<T> = Request & { dto: T };

// const VALID_SORT_FIELDS: Record<string, string> = {
//   age: "p.age",
//   created_at: "p.created_at",
//   gender_probability: "p.gender_probability",
// };

// const MAX_LIMIT = 50;
// const DEFAULT_LIMIT = 10;
// const DEFAULT_PAGE = 1;

// const profileRepository = () => AppDataSource.getRepository(Profile);

// function buildPaginationLinks(
//   baseUrl: string,
//   page: number,
//   limit: number,
//   total: number,
//   query: Record<string, string>
// ): { self: string; next: string | null; prev: string | null } {
//   const totalPages = Math.ceil(total / limit);

//   const buildUrl = (p: number): string => {
//     const params = new URLSearchParams({
//       ...query,
//       page: String(p),
//       limit: String(limit),
//     });
//     return `${baseUrl}?${params.toString()}`;
//   };

//   return {
//     self: buildUrl(page),
//     next: page < totalPages ? buildUrl(page + 1) : null,
//     prev: page > 1 ? buildUrl(page - 1) : null,
//   };
// }

// export class ProfileController {
//   async create(
//     req: DtoRequest<CreateProfileDto>,
//     res: Response,
//     next: NextFunction
//   ): Promise<void> {
//     try {
//       const { name } = req.dto;
//       const repo = profileRepository();

//       const existing = await repo.findOne({ where: { name } });
//       if (existing) {
//         res.status(HTTP_STATUS.CREATED).json(
//           successResponse(toFullProfile(existing), {
//             message: "Profile already exists",
//           })
//         );
//         return;
//       }

//       const enriched = await externalApiService.enrichName(name);

//       const profile = repo.create({
//         id: generateId(),
//         name,
//         gender: enriched.gender,
//         gender_probability: enriched.gender_probability,
//         sample_size: enriched.sample_size,
//         age: enriched.age,
//         age_group: enriched.age_group,
//         country_id: enriched.country_id,
//         country_name: enriched.country_name,
//         country_probability: enriched.country_probability,
//       });

//       const saved = await repo.save(profile);

//       res
//         .status(HTTP_STATUS.CREATED)
//         .json(successResponse(toFullProfile(saved)));
//     } catch (err) {
//       next(err);
//     }
//   }

//   async getById(
//     req: Request,
//     res: Response,
//     next: NextFunction
//   ): Promise<void> {
//     try {
//       const id = req.params.id as string;
//       const profile = await profileRepository().findOne({ where: { id } });
//       if (!profile) throw new NotFoundError();
      
//       res.status(HTTP_STATUS.OK).json(successResponse(toFullProfile(profile)));
//     } catch (err) {
//       next(err);
//     }
//   }

//   async list(req: Request, res: Response, next: NextFunction): Promise<void> {
//     try {
//       const {
//         gender,
//         age_group,
//         country_id,
//         min_age,
//         max_age,
//         min_gender_probability,
//         min_country_probability,
//         sort_by,
//         order,
//         page,
//         limit,
//       } = req.query as ProfileFilters;

//       const pageNum = Math.max(
//         DEFAULT_PAGE,
//         parseInt(page || String(DEFAULT_PAGE), 10)
//       );
//       const limitNum = Math.min(
//         MAX_LIMIT,
//         Math.max(1, parseInt(limit || String(DEFAULT_LIMIT), 10))
//       );
//       const offset = (pageNum - 1) * limitNum;

//       const sortField =
//         sort_by && VALID_SORT_FIELDS[sort_by]
//           ? VALID_SORT_FIELDS[sort_by]
//           : "p.created_at";
//       const sortOrder =
//         order && order.toUpperCase() === "ASC" ? "ASC" : "DESC";

//       const qb = profileRepository()
//         .createQueryBuilder("p")
//         .orderBy(sortField, sortOrder)
//         .skip(offset)
//         .take(limitNum);

//       if (gender) {
//         qb.andWhere("LOWER(p.gender) = LOWER(:gender)", { gender });
//       }
//       if (age_group) {
//         qb.andWhere("LOWER(p.age_group) = LOWER(:age_group)", { age_group });
//       }
//       if (country_id) {
//         qb.andWhere("UPPER(p.country_id) = UPPER(:country_id)", { country_id });
//       }
//       if (min_age) {
//         qb.andWhere("p.age >= :min_age", { min_age: parseInt(min_age, 10) });
//       }
//       if (max_age) {
//         qb.andWhere("p.age <= :max_age", { max_age: parseInt(max_age, 10) });
//       }
//       if (min_gender_probability) {
//         qb.andWhere("p.gender_probability >= :min_gender_probability", {
//           min_gender_probability: parseFloat(min_gender_probability),
//         });
//       }
//       if (min_country_probability) {
//         qb.andWhere("p.country_probability >= :min_country_probability", {
//           min_country_probability: parseFloat(min_country_probability),
//         });
//       }

//       const [profiles, total] = await qb.getManyAndCount();
//       const totalPages = Math.ceil(total / limitNum);

//       const queryParams: Record<string, string> = {};
//       if (gender) queryParams.gender = gender;
//       if (age_group) queryParams.age_group = age_group;
//       if (country_id) queryParams.country_id = country_id;
//       if (min_age) queryParams.min_age = min_age;
//       if (max_age) queryParams.max_age = max_age;
//       if (sort_by) queryParams.sort_by = sort_by;
//       if (order) queryParams.order = order;

//       const links = buildPaginationLinks(
//         "/api/profiles",
//         pageNum,
//         limitNum,
//         total,
//         queryParams
//       );

//       res
//         .status(HTTP_STATUS.OK)
//         .json(
//           paginatedResponse(
//             profiles.map(toListItem),
//             pageNum, 
//             limitNum, 
//             total,
//             totalPages,
//             links
//           )
//         );
//     } catch (err) {
//       next(err);
//     }
//   }

//   async search(req: Request, res: Response, next: NextFunction): Promise<void> {
//     try {
//       const q = req.query.q as string;

//       if (!q || q.trim().length === 0) {
//         res
//           .status(HTTP_STATUS.BAD_REQUEST)
//           .json(errorResponse("Invalid query parameters"));
//         return;
//       }

//       const filters = nlqService.parse(q);

//       if (!filters) {
//         res
//           .status(HTTP_STATUS.BAD_REQUEST)
//           .json(errorResponse("Unable to interpret query"));
//         return;
//       }

//       const page = req.query.page as string | undefined;
//       const limit = req.query.limit as string | undefined;

//       const pageNum = Math.max(
//         DEFAULT_PAGE,
//         parseInt(page || String(DEFAULT_PAGE), 10)
//       );
//       const limitNum = Math.min(
//         MAX_LIMIT,
//         Math.max(1, parseInt(limit || String(DEFAULT_LIMIT), 10))
//       );
//       const offset = (pageNum - 1) * limitNum;

//       const qb = profileRepository()
//         .createQueryBuilder("p")
//         .orderBy("p.created_at", "DESC")
//         .skip(offset)
//         .take(limitNum);

//       if (filters.gender) {
//         qb.andWhere("LOWER(p.gender) = LOWER(:gender)", {
//           gender: filters.gender,
//         });
//       }
//       if (filters.age_group) {
//         qb.andWhere("LOWER(p.age_group) = LOWER(:age_group)", {
//           age_group: filters.age_group,
//         });
//       }
//       if (filters.country_id) {
//         qb.andWhere("UPPER(p.country_id) = UPPER(:country_id)", {
//           country_id: filters.country_id,
//         });
//       }
//       if (filters.min_age !== undefined) {
//         qb.andWhere("p.age >= :min_age", { min_age: filters.min_age });
//       }
//       if (filters.max_age !== undefined) {
//         qb.andWhere("p.age <= :max_age", { max_age: filters.max_age });
//       }

//       const [profiles, total] = await qb.getManyAndCount();
//       const totalPages = Math.ceil(total / limitNum);

//       const links = buildPaginationLinks(
//         "/api/profiles/search",
//         pageNum,
//         limitNum,
//         total,
//         { q }
//       );

//       res
//         .status(HTTP_STATUS.OK)
//         .json(
//           paginatedResponse(
//             profiles.map(toListItem), 
//             pageNum, 
//             limitNum, 
//             total,
//             totalPages,
//             links
//           )
//         );
//     } catch (err) {
//       next(err);
//     }
//   }

//   async exportCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
//     try {
//       const {
//         gender, age_group, country_id,
//         min_age, max_age,
//         min_gender_probability, min_country_probability,
//         sort_by, order,
//       } = req.query as ProfileFilters;

//       const sortField =
//         sort_by && VALID_SORT_FIELDS[sort_by]
//           ? VALID_SORT_FIELDS[sort_by]
//           : "p.created_at";
//       const sortOrder =
//         order && order.toUpperCase() === "ASC" ? "ASC" : "DESC";

//       const qb = profileRepository()
//         .createQueryBuilder("p")
//         .orderBy(sortField, sortOrder);

//       if (gender) qb.andWhere("LOWER(p.gender) = LOWER(:gender)", { gender });
//       if (age_group) qb.andWhere("LOWER(p.age_group) = LOWER(:age_group)", { age_group });
//       if (country_id) qb.andWhere("UPPER(p.country_id) = UPPER(:country_id)", { country_id });
//       if (min_age) qb.andWhere("p.age >= :min_age", { min_age: parseInt(min_age, 10) });
//       if (max_age) qb.andWhere("p.age <= :max_age", { max_age: parseInt(max_age, 10) });
//       if (min_gender_probability) {
//         qb.andWhere("p.gender_probability >= :mgp", {
//           mgp: parseFloat(min_gender_probability),
//         });
//       }
//       if (min_country_probability) {
//         qb.andWhere("p.country_probability >= :mcp", {
//           mcp: parseFloat(min_country_probability),
//         });
//       }

//       const profiles = await qb.getMany();

//       const headers = [
//         "id", "name", "gender", "gender_probability",
//         "age", "age_group", "country_id", "country_name",
//         "country_probability", "created_at",
//       ];

//       const rows = profiles.map((p) => [
//         p.id,
//         p.name,
//         p.gender,
//         p.gender_probability,
//         p.age,
//         p.age_group,
//         p.country_id,
//         p.country_name,
//         p.country_probability,
//         p.created_at instanceof Date
//           ? p.created_at.toISOString()
//           : String(p.created_at),
//       ]);

//       const csv = [
//         headers.join(","),
//         ...rows.map((row) =>
//           row
//             .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
//             .join(",")
//         ),
//       ].join("\n");

//       const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
//       const filename = `profiles_${timestamp}.csv`;

//       res.setHeader("Content-Type", "text/csv");
//       res.setHeader(
//         "Content-Disposition",
//         `attachment; filename="${filename}"`
//       );
//       res.status(HTTP_STATUS.OK).send(csv);
//     } catch (err) {
//       next(err);
//     }
//   }

//   async delete(
//     req: Request,
//     res: Response,
//     next: NextFunction
//   ): Promise<void> {
//     try {
//       const id = req.params.id as string;
//       const repo = profileRepository();
//       const profile = await repo.findOne({ where: { id } });
//       if (!profile) throw new NotFoundError();
//       await repo.remove(profile);
//       res.status(HTTP_STATUS.NO_CONTENT).send();
//     } catch (err) {
//       next(err);
//     }
//   }
// }

// export const profileController = new ProfileController();

import { Request, Response, NextFunction } from "express";
import { profileService } from "../services/profile.service";
import { successResponse, errorResponse } from "../utils";
import { HTTP_STATUS, ProfileFilters } from "../types";
import { CreateProfileDto } from "../dtos/CreateProfile.dto";

type DtoRequest<T> = Request & { dto: T };

export class ProfileController {
  // ── Create ──────────────────────────────────────────────

  async create(
    req: DtoRequest<CreateProfileDto>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { name } = req.dto;
      const { profile, alreadyExists } = await profileService.create(name);

      res.status(HTTP_STATUS.CREATED).json(
        successResponse(
          profile,
          alreadyExists ? { message: "Profile already exists" } : undefined
        )
      );
    } catch (err) {
      next(err);
    }
  }

  // ── Get By ID ────────────────────────────────────────────

  async getById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id as string; 
      const profile = await profileService.getById(id);
      res.status(HTTP_STATUS.OK).json(successResponse(profile));
    } catch (err) {
      next(err);
    }
  }

  // ── List ─────────────────────────────────────────────────

  async list(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await profileService.list(
        req.query as Record<string, any>
      );
      res.status(HTTP_STATUS.OK).json(result);
    } catch (err) {
      next(err);
    }
  }

  // ── Search ───────────────────────────────────────────────

  async search(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await profileService.search(
        req.query as Record<string, any>
      );
      res.status(HTTP_STATUS.OK).json(result);
    } catch (err: any) {
      if (err.message === "INVALID_QUERY") {
        res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json(errorResponse("Invalid query parameters"));
        return;
      }
      if (err.message === "UNINTERPRETABLE_QUERY") {
        res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json(errorResponse("Unable to interpret query"));
        return;
      }
      next(err);
    }
  }

  // ── Export CSV ───────────────────────────────────────────

  async exportCsv(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { csv, filename } = await profileService.exportCsv(
        req.query as ProfileFilters
      );

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.status(HTTP_STATUS.OK).send(csv);
    } catch (err) {
      next(err);
    }
  }

  // ── Delete ───────────────────────────────────────────────

  async delete(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id as string;
      await profileService.delete(id);
      res.status(HTTP_STATUS.NO_CONTENT).send();
    } catch (err) {
      next(err);
    }
  }
}

export const profileController = new ProfileController();