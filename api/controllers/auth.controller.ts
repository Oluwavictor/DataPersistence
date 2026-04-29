import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { authService } from "../services/auth.service";
import { tokenService } from "../services/token.service";
import { errorResponse, successResponse } from "../utils";
import { HTTP_STATUS } from "../types";

const pendingStates = new Map<string, { codeVerifier?: string; source: "web" | "cli"; callbackPort?: number }>();

function generateState(): string {
  return crypto.randomBytes(32).toString("hex");
}

export class AuthController {
  async githubLogin(req: Request, res: Response): Promise<void> {
    const state = generateState();
    const source = (req.query.source as string) || "web";
    const callbackPort = req.query.callback_port
      ? parseInt(req.query.callback_port as string, 10)
      : undefined;
    const codeChallenge = req.query.code_challenge as string | undefined;
    const codeVerifier = req.query.code_verifier as string | undefined;

    pendingStates.set(state, {
      codeVerifier,
      source: source as "web" | "cli",
      callbackPort,
    });

    setTimeout(() => pendingStates.delete(state), 10 * 60 * 1000);

    const url = authService.buildGitHubAuthUrl(state, codeChallenge);
    res.redirect(url);
  }

  async githubCallback(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { code, state } = req.query as Record<string, string>;

      if (!code || !state) {
        res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json(errorResponse("Missing code or state"));
        return;
      }

      const pending = pendingStates.get(state);
      if (!pending) {
        res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json(errorResponse("Invalid or expired state"));
        return;
      }

      pendingStates.delete(state);

      const githubToken = await authService.exchangeCodeForToken(
        code,
        pending.codeVerifier
      );
      const githubUser = await authService.getGitHubUser(githubToken);
      const user = await authService.findOrCreateUser(githubUser);

      const { access_token, refresh_token } =
        await tokenService.issueTokenPair(user);

      if (pending.source === "cli" && pending.callbackPort) {
        const callbackUrl = `http://localhost:${pending.callbackPort}/callback?access_token=${access_token}&refresh_token=${refresh_token}&username=${user.username}`;
        res.redirect(callbackUrl);
        return;
      }

	  //Web flow — send tokens in URL
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    //   res.cookie("access_token", access_token, {
    //     httpOnly: true,
    //     secure: process.env.NODE_ENV === "production",
    //     sameSite: "lax",
    //     maxAge: 3 * 60 * 1000,
    //   });

    //   res.cookie("refresh_token", refresh_token, {
    //     httpOnly: true,
    //     secure: process.env.NODE_ENV === "production",
    //     sameSite: "lax",
    //     path: "/auth/refresh",
    //     maxAge: 5 * 60 * 1000,
    //   });

    //   res.redirect(`${frontendUrl}/dashboard`);

	res.redirect(
		`${frontendUrl}/dashboard?access_token=${access_token}&refresh_token=${refresh_token}&username=${user.username}`
	  );
    } catch (err) {
      next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawToken =
        req.body.refresh_token || req.cookies?.refresh_token;

      if (!rawToken) {
        res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json(errorResponse("Refresh token required"));
        return;
      }

      const { access_token, refresh_token } =
        await tokenService.rotateRefreshToken(rawToken);

      if (req.cookies?.refresh_token) {
        res.cookie("access_token", access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 3 * 60 * 1000,
        });

        res.cookie("refresh_token", refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/auth/refresh",
          maxAge: 5 * 60 * 1000,
        });
      }

      res.status(HTTP_STATUS.OK).json(
        successResponse({ access_token, refresh_token })
      );
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawToken =
        req.body.refresh_token || req.cookies?.refresh_token;

      if (rawToken) {
        await tokenService.revokeRefreshToken(rawToken);
      }

      res.clearCookie("access_token");
      res.clearCookie("refresh_token", { path: "/auth/refresh" });

      res.status(HTTP_STATUS.OK).json(
        successResponse(null, { message: "Logged out successfully" })
      );
    } catch (err) {
      next(err);
    }
  }

  async whoami(req: Request, res: Response): Promise<void> {
    res.status(HTTP_STATUS.OK).json(successResponse(req.user));
  }
}

export const authController = new AuthController();