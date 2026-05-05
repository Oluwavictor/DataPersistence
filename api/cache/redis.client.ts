import Redis from "ioredis";

const isTest = process.env.NODE_ENV === "test";


// Support both Railway format (REDISHOST) and standard format (REDIS_HOST)
const redisHost = process.env.REDISHOST || process.env.REDIS_HOST;
const redisPort = process.env.REDISPORT || process.env.REDIS_PORT || "6379";
const redisPassword = process.env.REDISPASSWORD || process.env.REDIS_PASSWORD;

export const redisClient =
  isTest || !process.env.REDIS_HOST
    ? null
    : new Redis({
        host: redisHost,
        port: parseInt(redisPort, 10),
        password: redisPassword || undefined,
        maxRetriesPerRequest: 3,
        enableOfflineQueue: false,
        lazyConnect: true,
      });

// Connect on startup
if (redisClient) {
  redisClient.connect().catch(() => {
    console.warn("[Redis] Could not connect — caching disabled");
  });
}

export async function getCache(key: string): Promise<string | null> {
  if (!redisClient) return null;
  try {
    return await redisClient.get(key);
  } catch {
    return null;
  }
}

export async function setCache(
  key: string,
  value: string,
  ttlSeconds = 300
): Promise<void> {
  if (!redisClient) return;
  try {
    await redisClient.setex(key, ttlSeconds, value);
  } catch {
    // fail silently
  }
}

export async function invalidateCacheByPattern(
  pattern: string
): Promise<void> {
  if (!redisClient) return;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  } catch {
    // fail silently
  }
}