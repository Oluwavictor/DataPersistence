import { Router, Request, Response, NextFunction } from "express";
import { authController } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authRateLimiter } from "../middleware/rateLimiter.middleware";
import { authService } from "../services/auth.service";
import { tokenService } from "../services/token.service";
import { successResponse, errorResponse } from "../utils";
import { HTTP_STATUS } from "../types";

const router = Router();

router.use(authRateLimiter);

router.get("/github", (req: Request, res: Response) =>
  authController.githubLogin(req, res)
);

router.get("/github/callback", (req: Request, res: Response, next: NextFunction) =>
  authController.githubCallback(req, res, next)
);

router.post("/refresh", (req: Request, res: Response, next: NextFunction) =>
  authController.refresh(req, res, next)
);

// router.post("/promote",
//   authenticate,
//   requireRole("admin"),
//   async (req, res, next) => {
//     const { username } = req.body;
//     const user = await authService.findByUsername(username);
//     await authService.updateRole(user.id, "admin");
//     res.json(successResponse({ message: `${username} is now admin` }));
//   }
// );

router.post(
  "/logout",
  authenticate,
  (req: Request, res: Response, next: NextFunction) =>
    authController.logout(req, res, next)
);

router.get(
  "/whoami",
  authenticate,
  (req: Request, res: Response) =>
    authController.whoami(req, res)
);

router.post(
  "/test-token",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { role = "analyst" } = req.body;

      const validRoles = ["admin", "analyst"];
      if (!validRoles.includes(role)) {
        res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json(errorResponse("Invalid role. Must be admin or analyst"));
        return;
      }

      const username = role === "admin" ? "test_admin" : "test_analyst";
      const email =
        role === "admin"
          ? "admin@insighta.test"
          : "analyst@insighta.test";
      const github_id =
        role === "admin"
          ? "test_github_admin_001"
          : "test_github_analyst_001";

      const user = await authService.findOrCreateTestUser(
        username,
        email,
        github_id,
        role as "admin" | "analyst"
      );

      const { access_token, refresh_token } =
        await tokenService.issueTokenPair(user);

      res.status(HTTP_STATUS.OK).json(
        successResponse({
          access_token,
          refresh_token,
          role: user.role,
          username: user.username,
        })
      );
    } catch (err) {
      next(err);
    }
  }
);

export default router;