import "reflect-metadata";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "../docs/swagger";
import profileRoutes from "../routes/profile.routes";
import { errorResponse } from "./index";
import { AppError, HTTP_STATUS } from "../types";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

if (process.env.NODE_ENV !== "test") {
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on("finish", () => {
      const ms = Date.now() - start;
      const line = `${req.method} ${req.originalUrl} → ${res.statusCode} [${ms}ms]`;
      res.statusCode >= 400
        ? console.error(`⚠  ${line}`)
        : console.log(`   ${line}`);
    });
    next();
  });
}

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/api/docs.json", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.get("/", (_req: Request, res: Response) => {
  res.json({
    status: "success",
    message: "Profile Intelligence Service is running",
    version: "1.0.0",
    docs: "/api/docs",
    timestamp: new Date().toISOString(),
  });
});

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