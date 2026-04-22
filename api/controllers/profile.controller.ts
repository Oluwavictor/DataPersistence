import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../database/data-source";
import { Profile } from "../entities/Profile";
import { externalApiService } from "../services/externalApi.service";
import { nlqService } from "../services/nlq.service";
import {
  generateId,
  successResponse,
  paginatedResponse,
  errorResponse,
  toFullProfile,
  toListItem,
} from "../utils";
import { NotFoundError, HTTP_STATUS, ProfileFilters } from "../types";
import { CreateProfileDto } from "../dtos/CreateProfile.dto";

type DtoRequest<T> = Request & { dto: T };

const VALID_SORT_FIELDS: Record<string, string> = {
  age: "p.age",
  created_at: "p.created_at",
  gender_probability: "p.gender_probability",
};

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 10;
const DEFAULT_PAGE = 1;

const profileRepository = () => AppDataSource.getRepository(Profile);

export class ProfileController {
  async create(
    req: DtoRequest<CreateProfileDto>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { name } = req.dto;
      const repo = profileRepository();

      const existing = await repo.findOne({ where: { name } });
      if (existing) {
        res.status(HTTP_STATUS.CREATED).json(
          successResponse(toFullProfile(existing), {
            message: "Profile already exists",
          })
        );
        return;
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

      res
        .status(HTTP_STATUS.CREATED)
        .json(successResponse(toFullProfile(saved)));
    } catch (err) {
      next(err);
    }
  }

  async getById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id as string;
      const profile = await profileRepository().findOne({ where: { id } });
      if (!profile) throw new NotFoundError();
      
      res.status(HTTP_STATUS.OK).json(successResponse(toFullProfile(profile)));
    } catch (err) {
      next(err);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
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
        page,
        limit,
      } = req.query as ProfileFilters;

      const pageNum = Math.max(
        DEFAULT_PAGE,
        parseInt(page || String(DEFAULT_PAGE), 10)
      );
      const limitNum = Math.min(
        MAX_LIMIT,
        Math.max(1, parseInt(limit || String(DEFAULT_LIMIT), 10))
      );
      const offset = (pageNum - 1) * limitNum;

      const sortField =
        sort_by && VALID_SORT_FIELDS[sort_by]
          ? VALID_SORT_FIELDS[sort_by]
          : "p.created_at";
      const sortOrder =
        order && order.toUpperCase() === "ASC" ? "ASC" : "DESC";

      const qb = profileRepository()
        .createQueryBuilder("p")
        .orderBy(sortField, sortOrder)
        .skip(offset)
        .take(limitNum);

      if (gender) {
        qb.andWhere("LOWER(p.gender) = LOWER(:gender)", { gender });
      }
      if (age_group) {
        qb.andWhere("LOWER(p.age_group) = LOWER(:age_group)", { age_group });
      }
      if (country_id) {
        qb.andWhere("UPPER(p.country_id) = UPPER(:country_id)", { country_id });
      }
      if (min_age) {
        qb.andWhere("p.age >= :min_age", { min_age: parseInt(min_age, 10) });
      }
      if (max_age) {
        qb.andWhere("p.age <= :max_age", { max_age: parseInt(max_age, 10) });
      }
      if (min_gender_probability) {
        qb.andWhere("p.gender_probability >= :min_gender_probability", {
          min_gender_probability: parseFloat(min_gender_probability),
        });
      }
      if (min_country_probability) {
        qb.andWhere("p.country_probability >= :min_country_probability", {
          min_country_probability: parseFloat(min_country_probability),
        });
      }

      const [profiles, total] = await qb.getManyAndCount();

      res
        .status(HTTP_STATUS.OK)
        .json(paginatedResponse(profiles.map(toListItem), pageNum, limitNum, total));
    } catch (err) {
      next(err);
    }
  }

  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = req.query.q as string;

      if (!q || q.trim().length === 0) {
        res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json(errorResponse("Invalid query parameters"));
        return;
      }

      const filters = nlqService.parse(q);

      if (!filters) {
        res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json(errorResponse("Unable to interpret query"));
        return;
      }

      const page = req.query.page as string | undefined;
      const limit = req.query.limit as string | undefined;

      const pageNum = Math.max(
        DEFAULT_PAGE,
        parseInt(page || String(DEFAULT_PAGE), 10)
      );
      const limitNum = Math.min(
        MAX_LIMIT,
        Math.max(1, parseInt(limit || String(DEFAULT_LIMIT), 10))
      );
      const offset = (pageNum - 1) * limitNum;

      const qb = profileRepository()
        .createQueryBuilder("p")
        .orderBy("p.created_at", "DESC")
        .skip(offset)
        .take(limitNum);

      if (filters.gender) {
        qb.andWhere("LOWER(p.gender) = LOWER(:gender)", {
          gender: filters.gender,
        });
      }
      if (filters.age_group) {
        qb.andWhere("LOWER(p.age_group) = LOWER(:age_group)", {
          age_group: filters.age_group,
        });
      }
      if (filters.country_id) {
        qb.andWhere("UPPER(p.country_id) = UPPER(:country_id)", {
          country_id: filters.country_id,
        });
      }
      if (filters.min_age !== undefined) {
        qb.andWhere("p.age >= :min_age", { min_age: filters.min_age });
      }
      if (filters.max_age !== undefined) {
        qb.andWhere("p.age <= :max_age", { max_age: filters.max_age });
      }

      const [profiles, total] = await qb.getManyAndCount();

      res
        .status(HTTP_STATUS.OK)
        .json(paginatedResponse(profiles.map(toListItem), pageNum, limitNum, total));
    } catch (err) {
      next(err);
    }
  }

  async delete(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id as string;
      const repo = profileRepository();
      const profile = await repo.findOne({ where: { id } });
      if (!profile) throw new NotFoundError();
      await repo.remove(profile);
      res.status(HTTP_STATUS.NO_CONTENT).send();
    } catch (err) {
      next(err);
    }
  }
}

export const profileController = new ProfileController();