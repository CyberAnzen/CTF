const mongoose = require("mongoose");
require("dotenv").config();

const connectDataBase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_DB, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 15,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
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

    // Optional: log slow queries
    mongoose.set("debug", (collectionName, method, query, doc, options) => {
      console.log(
        `🐢 Mongoose: ${collectionName}.${method}(${JSON.stringify(query)})`
      );
    });
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

module.exports = connectDataBase;
