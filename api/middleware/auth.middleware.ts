import { Request, Response, NextFunction } from "express";
import { tokenService } from "../services/token.service";
import { authService } from "../services/auth.service";
import { errorResponse } from "../utils";
import { HTTP_STATUS, AuthenticatedUser, UnauthorizedError } from "../types";

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }

    if (!token && req.cookies?.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      throw new UnauthorizedError("Authentication required");
    }

    const payload = tokenService.verifyAccessToken(token);

    const user = await authService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    if (!user.is_active) {
      res
        .status(HTTP_STATUS.FORBIDDEN)
        .json(errorResponse("Account is inactive"));
      return;
    }

    req.user = {
      id: user.id,
      github_id: user.github_id,
      username: user.username,
      email: user.email,
      avatar_url: user.avatar_url,
      role: user.role,
      is_active: user.is_active,
    };

    next();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse(err.message));
      return;
    }
    next(err);
  }
}