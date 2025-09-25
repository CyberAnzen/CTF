// redis/config/connectRedis.js
const { createClient } = require("redis");

const REDIS_HOST =  "127.0.0.1";
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || "";

// Build safe URI (include password only if present)
const passwordPart = REDIS_PASSWORD
  ? `:${encodeURIComponent(REDIS_PASSWORD)}@`
  : "";
const REDIS_URI = `redis://${passwordPart}${REDIS_HOST}:${REDIS_PORT}`;

// Normal Redis client (for get/set/zrange/publish)
let redis;
if (!global._redisClient) {
  redis = createClient({ url: REDIS_URI });
  redis.on("error", (err) => console.error("[Redis Error]", err));
  global._redisClient = redis;
} else {
  redis = global._redisClient;
}

// Subscriber client (for subscribe only)
let redisSubscriber;
if (!global._redisSubscriber) {
  redisSubscriber = createClient({ url: REDIS_URI });
  redisSubscriber.on("error", (err) =>
    console.error("[RedisSubscriber Error]", err)
  );
  global._redisSubscriber = redisSubscriber;
} else {
  redisSubscriber = global._redisSubscriber;
}

/**
 * Connect to Redis with retries
 */
const connectRedis = async (retries = 5, delay = 2000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (!redis.isOpen) await redis.connect();
      if (!redisSubscriber.isOpen) await redisSubscriber.connect();
      console.log(
        "[connectRedis] 🛢️ Redis connected ->",
        `${REDIS_HOST}:${REDIS_PORT}`
      );
      return;
    } catch (err) {
      console.error(`[connectRedis] Attempt ${attempt} failed:`, err.message);
      if (attempt < retries) await new Promise((res) => setTimeout(res, delay));
      else throw err;
    }
  }
};

module.exports = { connectRedis, redis, redisSubscriber };
