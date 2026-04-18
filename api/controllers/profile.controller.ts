import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../database/data-source";
import { Profile } from "../entities/Profile";
import { externalApiService } from "../services/externalApi.service";
import {
  generateId,
  successResponse,
  toFullProfile,
  toListItem,
} from "../utils";
import { NotFoundError, HTTP_STATUS, ProfileFilters } from "../types";
import { CreateProfileDto } from "../dtos/CreateProfile.dto";

type DtoRequest<T> = Request & { dto: T };

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
      const { gender, country_id, age_group } = req.query as ProfileFilters;

      const qb = profileRepository()
        .createQueryBuilder("p")
        .orderBy("p.created_at", "DESC");

      if (gender) {
        qb.andWhere("LOWER(p.gender) = LOWER(:gender)", { gender });
      }
      if (country_id) {
        qb.andWhere("UPPER(p.country_id) = UPPER(:countryId)", {
          countryId: country_id,
        });
      }
      if (age_group) {
        qb.andWhere("LOWER(p.age_group) = LOWER(:ageGroup)", {
          ageGroup: age_group,
        });
      }

      const profiles = await qb.getMany();

      res.status(HTTP_STATUS.OK).json(
        successResponse(profiles.map(toListItem), { count: profiles.length })
      );
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