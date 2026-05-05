import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { requireApiVersion } from "../middleware/apiVersion.middleware";
import { csvIngestionService } from "../services/csvIngestion.service";
import { successResponse, errorResponse } from "../utils";
import { HTTP_STATUS } from "../types";

const router = Router();

// ✅ Store in memory — no temp files on disk
// 50MB limit handles ~500k rows comfortably
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const isCSV =
      file.mimetype === "text/csv" ||
      file.mimetype === "application/csv" ||
      file.originalname.toLowerCase().endsWith(".csv");
    if (isCSV) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"));
    }
  },
});

router.use(requireApiVersion);
router.use(authenticate);

// POST /api/ingestion/upload
// Admin only — upload CSV file of profiles
router.post(
  "/upload",
  requireRole("admin"),
  upload.single("file"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json(errorResponse("CSV file is required. Use field name: file"));
        return;
      }

      const result = await csvIngestionService.ingestCsvBuffer(
        req.file.buffer
      );

      res.status(HTTP_STATUS.OK).json(successResponse(result));
    } catch (err: any) {
      if (err.message === "Only CSV files are allowed") {
        res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json(errorResponse(err.message));
        return;
      }
      next(err);
    }
  }
);

export default router;