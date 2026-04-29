// import rateLimit from "express-rate-limit";
// import type { Request } from "express";
// import { errorResponse } from "../utils";
// import { HTTP_STATUS } from "../types";

// function resolveKey(req: Request): string {
//   if (req.user?.id) return req.user.id;

//   const forwarded = req.headers["x-forwarded-for"];
//   const ip =
//     (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0]) ||
//     req.socket.remoteAddress ||
//     "unknown";

//   // Normalise IPv6-mapped IPv4 (e.g. ::ffff:127.0.0.1 → 127.0.0.1)
//   return ip.replace(/^::ffff:/, "");
// }

// export const authRateLimiter = rateLimit({
//   windowMs: 60 * 1000,
//   max: 10,
//   standardHeaders: true,
//   legacyHeaders: false,
//   keyGenerator: resolveKey,
//   validate: { xForwardedForHeader: false },
//   handler: (_req, res) => {
//     res
//       .status(HTTP_STATUS.TOO_MANY_REQUESTS)
//       .json(errorResponse("Too many requests, please try again later"));
//   },
// });

// export const apiRateLimiter = rateLimit({
//   windowMs: 60 * 1000,
//   max: 60,
//   standardHeaders: true,
//   legacyHeaders: false,
//   keyGenerator: resolveKey,
//   validate: { xForwardedForHeader: false },
//   handler: (_req, res) => {
//     res
//       .status(HTTP_STATUS.TOO_MANY_REQUESTS)
//       .json(errorResponse("Too many requests, please try again later"));
//   },
// });
import rateLimit from "express-rate-limit";
import type { Request } from "express";
import { errorResponse } from "../utils";
import { HTTP_STATUS } from "../types";

const isTest = process.env.NODE_ENV === "test";

function resolveKey(req: Request): string {
  if (req.user?.id) return req.user.id;

  const forwarded = req.headers["x-forwarded-for"];
  const ip =
    (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0]) ||
    req.socket.remoteAddress ||
    "unknown";

  // Normalise IPv6-mapped IPv4 (e.g. ::ffff:127.0.0.1 → 127.0.0.1)
  return ip.replace(/^::ffff:/, "");
}

export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isTest ? 1000 : 10, // ✅ high limit in test mode
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: resolveKey,
  validate: { xForwardedForHeader: false },
  handler: (_req, res) => {
    res
      .status(HTTP_STATUS.TOO_MANY_REQUESTS)
      .json(errorResponse("Too many requests, please try again later"));
  },
});

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isTest ? 1000 : 60, // ✅ high limit in test mode
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: resolveKey,
  validate: { xForwardedForHeader: false },
  handler: (_req, res) => {
    res
      .status(HTTP_STATUS.TOO_MANY_REQUESTS)
      .json(errorResponse("Too many requests, please try again later"));
  },
});
