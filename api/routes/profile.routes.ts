import { Router, Request, Response, NextFunction } from "express";
import { profileController } from "../controllers/profile.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { requireApiVersion } from "../middleware/apiVersion.middleware";
import { apiRateLimiter } from "../middleware/rateLimiter.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { validateQuery } from "../middleware/validate.middleware";
import { CreateProfileDto } from "../dtos/CreateProfile.dto";
import { QueryProfileDto } from "../dtos/QueryProfile.dto";

const router = Router();

router.use(requireApiVersion); 
router.use(authenticate);      
router.use(apiRateLimiter);

router.get(
  "/export",
  requireRole("admin", "analyst"),
  (req: Request, res: Response, next: NextFunction) =>
    profileController.exportCsv(req, res, next)
);

router.get(
  "/search",
  requireRole("admin", "analyst"),
  (req: Request, res: Response, next: NextFunction) =>
    profileController.search(req, res, next)
);

router.post(
  "/",
  requireRole("admin"),
  validateBody(CreateProfileDto),
  (req: Request, res: Response, next: NextFunction) =>
    profileController.create(req as any, res, next)
);

router.get(
  "/",
  requireRole("admin", "analyst"),
  validateQuery(QueryProfileDto),
  (req: Request, res: Response, next: NextFunction) =>
    profileController.list(req, res, next)
);

router.get(
  "/:id",
  requireRole("admin", "analyst"),
  (req: Request, res: Response, next: NextFunction) =>
    profileController.getById(req, res, next)
);

router.delete(
  "/:id",
  requireRole("admin"),
  (req: Request, res: Response, next: NextFunction) =>
    profileController.delete(req, res, next)
);

export default router;