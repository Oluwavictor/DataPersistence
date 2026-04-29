import "reflect-metadata";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "../docs/swagger";
import authRoutes from "../routes/auth.routes";
import profileRoutes from "../routes/profile.routes";
import { requestLogger } from "../middleware/requestLogger.middleware";
import { errorResponse } from "./index";
import { AppError, HTTP_STATUS } from "../types";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    // origin: "*",
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "DELETE", "OPTIONS", "PUT", "PATCH"],
    allowedHeaders: [
      "Content-Type", 
      "Authorization",
      "X-API-Version",
      "X-CSRF-Token",
    ],
  })
);

// if (process.env.NODE_ENV !== "test") {
//   app.use((req: Request, res: Response, next: NextFunction) => {
//     const start = Date.now();
//     res.on("finish", () => {
//       const ms = Date.now() - start;
//       const line = `${req.method} ${req.originalUrl} → ${res.statusCode} [${ms}ms]`;
//       res.statusCode >= 400
//         ? console.error(`  ${line}`)
//         : console.log(`   ${line}`);
//     });
//     next();
//   });
// }
if (process.env.NODE_ENV !== "test") {
  app.use(requestLogger);
}

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/api/docs.json", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.get("/", (_req: Request, res: Response) => {
  res.json({
    status: "success",
    message: "Insighta Labs API",
    version: "3.0.0",
    docs: "/api/docs",
    timestamp: new Date().toISOString(),
  });
});

app.use("/auth", authRoutes);
app.use("/api/profiles", profileRoutes);

app.use((_req: Request, res: Response) => {
  res.status(HTTP_STATUS.NOT_FOUND).json(errorResponse("Route not found"));
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (process.env.NODE_ENV !== "test") {
    console.error("[ErrorHandler]", err);
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json(errorResponse(err.message));
    return;
  }

  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as Record<string, unknown>).code === "ER_DUP_ENTRY"
  ) {
    res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json(errorResponse("Profile already exists"));
    return;
  }

  res
    .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    .json(errorResponse("Internal server error"));
});

export default app;