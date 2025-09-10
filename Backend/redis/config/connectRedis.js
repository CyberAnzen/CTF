const { createClient } = require("redis");

const REDIS_URI = process.env.REDIS_URI || "redis://localhost:6379";
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || "REDIS_PASSWORD";

// Normal Redis client (for get/set/zrange/publish)
let redis;
if (!global._redisClient) {
  redis = createClient({
    url: REDIS_URI,
    password: REDIS_PASSWORD,
  });
  redis.on("error", (err) => console.error("[Redis Error]", err));
  global._redisClient = redis;
} else {
  redis = global._redisClient;
}

// Subscriber client (for subscribe only)
let redisSubscriber;
if (!global._redisSubscriber) {
  redisSubscriber = createClient({
    url: REDIS_URI,
    password: REDIS_PASSWORD,
  });
  redisSubscriber.on("error", (err) => console.error("[RedisSubscriber Error]", err));
  global._redisSubscriber = redisSubscriber;
} else {
  redisSubscriber = global._redisSubscriber;
}

/**
 * Connect to Redis with retries
 */
const connectRedis = async (retries = 5, delay = 2000) => {
  let attempt = 0;
  while (attempt < retries) {
    try {
      if (!redis.isOpen) await redis.connect();
      if (!redisSubscriber.isOpen) await redisSubscriber.connect();
      console.log("[connectRedis] 🛢️ Redis connection established");
      return; // success
    } catch (error) {
      attempt++;
      console.error(
        `[connectRedis] ❌ Failed attempt ${attempt}/${retries}:`,
        error.message
      );
      if (attempt < retries) {
        console.log(`[connectRedis] ⏳ Retrying in ${delay / 1000}s...`);
        await new Promise((res) => setTimeout(res, delay));
      } else {
        console.error(
          "[connectRedis] ❌ Max retries reached. Could not connect to Redis."
        );
        throw error;
      }
    }
  }
};

module.exports = { connectRedis, redis, redisSubscriber };
// ...existing code...