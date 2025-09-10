const mongoose = require("mongoose");
require("dotenv").config();

const connectDataBase = async () => {
  try {
    const uri =
      process.env.MONGO_DB ||
      "mongodb://127.0.0.1:27017/CyberAnzen?authSource=admin";

    await mongoose.connect(uri, {
      maxPoolSize: 20,   // lower per worker if using many cluster instances
      minPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: "majority",
      autoIndex: false,  // ✅ prevents duplicate schema index warnings in cluster
    });

    console.log("✅ MongoDB connected & pool ready");

    mongoose.connection.on("connected", () =>
      console.log("ℹ️ MongoDB connection established")
    );
    mongoose.connection.on("reconnected", () =>
      console.log("♻️ MongoDB reconnected")
    );
    mongoose.connection.on("disconnected", () =>
      console.warn("⚠️ MongoDB disconnected")
    );
    mongoose.connection.on("close", () =>
      console.warn("⚠️ MongoDB connection closed")
    );
    mongoose.connection.on("error", (err) =>
      console.error("❌ MongoDB connection error:", err)
    );
    mongoose.connection.on("timeout", () =>
      console.warn("⏱️ MongoDB socket timeout")
    );

    // Optional: log slow queries (> 100ms)
    mongoose.set("debug", (collectionName, method, query, doc, options) => {
      const start = Date.now();
      const originalCallback = options?.callback;
      if (originalCallback) {
        options.callback = function (...args) {
          const duration = Date.now() - start;
          if (duration > 100) {
            console.warn(
              `🐢 Slow query: ${collectionName}.${method}(${JSON.stringify(
                query
              )}) took ${duration}ms`
            );
          }
          originalCallback.apply(this, args);
        };
      }
    });
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

module.exports = connectDataBase;
