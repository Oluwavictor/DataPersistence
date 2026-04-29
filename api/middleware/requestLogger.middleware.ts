import { Request, Response, NextFunction } from "express";

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const log = {
      method: req.method,
      endpoint: req.originalUrl,
      status: res.statusCode,
      response_time_ms: duration,
      user: req.user?.username || "anonymous",
      timestamp: new Date().toISOString(),
    };

    if (res.statusCode >= 400) {
      console.error(JSON.stringify(log));
    } else {
      console.log(JSON.stringify(log));
    }
  });

  next();
}