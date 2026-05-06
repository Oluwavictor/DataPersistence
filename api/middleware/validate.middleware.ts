import { Request, Response, NextFunction } from "express";
import { plainToInstance } from "class-transformer";
import { validate, ValidationError as CVError } from "class-validator";
import { ClassConstructor } from "class-transformer/types/interfaces";
import { errorResponse } from "../utils";
import { HTTP_STATUS } from "../types";

function resolveStatusCode(
  errors: CVError[],
  body: Record<string, unknown>
): number {
  for (const err of errors) {
    const value = body[err.property];
    if (
      value !== undefined &&
      value !== null &&
      typeof value !== "string" &&
      err.constraints?.isString
    ) {
      return HTTP_STATUS.UNPROCESSABLE_ENTITY;
    }
  }
  return HTTP_STATUS.BAD_REQUEST;
}

function extractFirstMessage(errors: CVError[]): string {
  const first = errors[0];
  if (!first) return "Invalid query parameters";
  if (first.constraints) {
    return Object.values(first.constraints)[0] ?? "Invalid query parameters";
  }
  if (first.children?.length) {
    return extractFirstMessage(first.children);
  }
  return "Invalid query parameters";
}

export function validateBody<T extends object>(DtoClass: ClassConstructor<T>) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const instance = plainToInstance(DtoClass, req.body, {
      enableImplicitConversion: false,
      excludeExtraneousValues: false,
    });

    const errors = await validate(instance, {
      whitelist: true,
      forbidNonWhitelisted: false,
      stopAtFirstError: true,
    });

    if (errors.length > 0) {
      const statusCode = resolveStatusCode(
        errors,
        req.body as Record<string, unknown>
      );
      res.status(statusCode).json(errorResponse(extractFirstMessage(errors)));
      return;
    }

    (req as Request & { dto: T }).dto = instance;
    next();
  };
}

export function validateQuery<T extends object>(DtoClass: ClassConstructor<T>) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    // enableImplicitConversion: true is critical for @Transform to work
    const instance = plainToInstance(DtoClass, req.query, {
      enableImplicitConversion: true,
      excludeExtraneousValues: false,
    });

    const errors = await validate(instance, {
      whitelist: false,
      forbidNonWhitelisted: false,
      stopAtFirstError: true,
    });

    if (errors.length > 0) {
      res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(errorResponse(extractFirstMessage(errors)));
      return;
    }

    // replaces req.query with normalized instance
    Object.assign(req.query, instance);

    next();
  };
}