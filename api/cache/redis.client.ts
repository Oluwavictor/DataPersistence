import Redis from "ioredis";

const isTest = process.env.NODE_ENV === "test";

function createRedisClient(): Redis | null {
  if (isTest) return null;

  const host =
    process.env["REDISHOST"] || process.env["REDIS_HOST"];

  if (!host) {
    console.log("[Redis] No REDISHOST configured — caching disabled");
    return null;
  }

  const port = parseInt(
    process.env["REDISPORT"] ||
      process.env["REDIS_PORT"] ||
      "6379",
    10
  );

  const password =
    process.env["REDISPASSWORD"] ||
      process.env["REDIS_PASSWORD"] ||
      undefined;

  console.log(`[Redis] Connecting to ${host}:${port}...`);

  return new Redis({
    host,
    port,
    password,
    maxRetriesPerRequest: 3,
    enableOfflineQueue: false,
    lazyConnect: true,
  });
}

export const redisClient = createRedisClient();

if (redisClient) {
  redisClient.connect()
    .then(() => {
      console.log("[Redis]  Connected successfully");
    })
    .catch(() => {
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