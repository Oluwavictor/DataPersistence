import { Request, Response, NextFunction } from "express";
import { errorResponse } from "../utils";
import { HTTP_STATUS } from "../types";
import { UserRole } from "../entities/User";

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json(errorResponse("Authentication required"));
      return;
    }

    if (!roles.includes(req.user.role as UserRole)) {
      res
        .status(HTTP_STATUS.FORBIDDEN)
        .json(errorResponse("Insufficient permissions"));
      return;
    }

    next();
  };
}