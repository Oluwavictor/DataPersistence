import { Router, Request, Response, NextFunction } from "express";
import { authController } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authRateLimiter } from "../middleware/rateLimiter.middleware";

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

export default router;