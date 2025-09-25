const port = 3000;
require("dotenv").config();
const express = require("express");
const http = require("http");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const rateLimit = require("express-rate-limit");
const ConnectDataBase = require("./config/connectDataBase");
const { connectRedis } = require("./redis/config/connectRedis");
const initializeCaches = require("./cache/initCache");
const { Auth } = require("./middleware/Auth");
const csrfProtection = require("./middleware/CSRFprotection");
const requestLogger = require("./middleware/requestLogger");
const errorLogger = require("./middleware/errorLogger");
const gracefulShutdown = require("./utilies/gracefulShutdown");
const { Worker } = require("worker_threads");
const createLogWorker = require("./logger/controller/workerLog");

const app = express();
const server = http.createServer(app);
const FRONTEND_URL = "https://cyberanzen.icu";

async function startServer() {
  try {
    // --- Initialize DB & Redis ---
    await ConnectDataBase();
    await connectRedis();

    // --- Initialize caches ---
    await initializeCaches();

    // --- Logger worker ---
    const loggerWorker = new Worker("./logger/controller/logger.js");
    const logInBackground = createLogWorker(loggerWorker);

    // --- Middleware ---
    app.use(cookieParser());
    app.use(express.json());
    app.use(bodyParser.json());
    app.use(requestLogger(logInBackground));

    // --- CORS ---
    const corsOptions = {
      origin: true,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-CSRF-Token",
        "User-Agent",
        "Timestamp",
        "timestamp",
        "x-client-fp",
        "csrf-token",
      ],
      optionsSuccessStatus: 200,
    };
    app.use("/api", cors(corsOptions));
    app.options("/api/*", cors(corsOptions));

    // --- Static public files ---
    app.use(
      "/public",
      express.static(path.join(__dirname, "public/"), {
        dotfiles: "deny",
        index: false,
        maxAge: "1h",
        setHeaders: (res, filePath) => {
          const fileName = path.basename(filePath);
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="${fileName}"`
          );
          res.setHeader("X-Content-Type-Options", "nosniff");
          res.setHeader("Access-Control-Allow-Origin", FRONTEND_URL);
          res.setHeader("Access-Control-Allow-Credentials", "true");
          res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
          res.setHeader(
            "Access-Control-Allow-Headers",
            "Authorization, X-CSRF-Token, Content-Type"
          );
        },
      })
    );

    // --- Routes ---
    app.use("/api/user", require("./router/userRoutes"));
    app.use("/api/profile", require("./router/profileRoutes"));
    app.use("/api/challenge", require("./router/CTFRoutes"));
    app.use("/api/team", require("./router/TeamRoutes"));
    app.get(
      "/api/auth/csrf-token",
      Auth({ _CSRF: false }),
      csrfProtection,
      (req, res) => {
        res.json({ csrfToken: req.csrfToken() });
      }
    );

    // --- Error logging ---
    app.use(errorLogger(logInBackground));
    app.use((err, req, res, next) => {
      console.error("❌ Express error:", err);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    });

    // --- Start server ---
    server.listen(port, "0.0.0.0", () => {
      console.log(`CTF platform running on http://127.0.0.1:${port}`);
    });

    // --- Graceful shutdown ---
    process.on("SIGINT", () => gracefulShutdown(loggerWorker));
    process.on("SIGTERM", () => gracefulShutdown(loggerWorker));
  } catch (err) {
    console.error("❌ Server initialization failed:", err);
    process.exit(1);
  }
}

// Start the server
startServer();
