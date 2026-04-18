import { Router, Request, Response, NextFunction } from "express";
import { profileController } from "../controllers/profile.controller";
import { validateBody } from "../middleware/validate.middleware";
import { CreateProfileDto } from "../dtos/CreateProfile.dto";

const router = Router();

router.post(
  "/",
  validateBody(CreateProfileDto),
  (req: Request, res: Response, next: NextFunction) =>
    profileController.create(req as any, res, next)
);

router.get("/", (req: Request, res: Response, next: NextFunction) =>
  profileController.list(req, res, next)
);

router.get("/:id", (req: Request, res: Response, next: NextFunction) =>
  profileController.getById(req, res, next)
);

router.delete("/:id", (req: Request, res: Response, next: NextFunction) =>
  profileController.delete(req, res, next)
);

export default router;