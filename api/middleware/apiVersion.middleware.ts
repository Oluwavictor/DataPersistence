import { Request, Response, NextFunction } from "express";
import { errorResponse } from "../utils";
import { HTTP_STATUS } from "../types";

const REQUIRED_VERSION = "1";

export function requireApiVersion(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const version = req.headers["x-api-version"] as string | undefined;

  if (!version || version.trim() !== REQUIRED_VERSION) {
    res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json(errorResponse("API version header required"));
    return;
  }

  next();
}