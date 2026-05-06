import { Request, Response, NextFunction } from "express";
import { profileService } from "../services/profile.service";
import { successResponse, errorResponse } from "../utils";
import { HTTP_STATUS, ProfileFilters } from "../types";
import { CreateProfileDto } from "../dtos/CreateProfile.dto";

type DtoRequest<T> = Request & { dto: T };

export class ProfileController {
  // Create 

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

  // Get By ID 

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

  // List 

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

  // Search 

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

  // Export CSV 

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

  // Delete 

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