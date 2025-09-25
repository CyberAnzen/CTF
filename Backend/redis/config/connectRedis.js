const { createClient } = require("redis");

// Hardcoded Redis connection
const REDIS_URI = "redis://:mysecretpassword@redis:6379";

// Normal Redis client
let redis;
if (!global._redisClient) {
  redis = createClient({ url: REDIS_URI });
  redis.on("error", (err) => console.error("[Redis Error]", err));
  global._redisClient = redis;
} else {
  redis = global._redisClient;
}

// Subscriber client
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

// Connect with retries
const connectRedis = async (retries = 5, delay = 2000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (!redis.isOpen) await redis.connect();
      if (!redisSubscriber.isOpen) await redisSubscriber.connect();
      console.log("[connectRedis] 🛢️ Redis connected");
      return;
    } catch (err) {
      console.error(`[connectRedis] Attempt ${attempt} failed:`, err.message);
      if (attempt < retries) await new Promise((res) => setTimeout(res, delay));
      else throw err;
    }
  }
};

module.exports = { connectRedis, redis, redisSubscriber };
