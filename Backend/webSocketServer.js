require("dotenv").config();
const initLeaderboard = require("./redis/initLeaderboard");
const LeaderboardManager = require("./controller/CTF/LeaderBoard/leaderBoardManager");
const {
  connectRedis,
  redis,
  redisSubscriber,
} = require("./redis/config/connectRedis");
const http = require("http");
const ConnectDataBase = require("./config/connectDataBase");

async function initializeServer() {
  try {
    await ConnectDataBase();
    await connectRedis();
    await initLeaderboard(); // Initialize leaderboard from MongoDB
    LeaderboardManager.attachToServer(server);
  } catch (err) {
    console.error("❌ Initialization error:", err);
    throw err; // Re-throw to be caught by the caller
  }
}

const server = http.createServer();

// Async initialization
(async () => {
  try {
    await initializeServer();

    const wsPort = process.env.WS_PORT || 5000;

    redisSubscriber.subscribe("leaderboard-update", (message) => {
      if (message === "score-changed") {
        LeaderboardManager.broadcastAllRanks().catch((err) => {
          console.error(
            "❌ Failed to broadcast leaderboard after update:",
            err
          );
        });
      }
    });

    server.listen(wsPort, "127.0.0.1", () => {
      console.log(`WebSocket server running on ws://localhost:${wsPort}`);
    });
  } catch (err) {
    console.error("❌ Failed to initialize WebSocket server:", err);
    process.exit(1);
  }
})();
