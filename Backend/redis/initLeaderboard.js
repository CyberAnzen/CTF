// initLeaderboard.js
const { redis } = require("./config/connectRedis");
const CTF_LeaderBoard = require("../model/CTF_LeaderBoardModel");
const { writeLeaderboardEntry } = require("./writeLeaderboardEntry");
const { clearLeaderboard } = require("./clearLeaderboard");
async function initLeaderboard() {
  console.log("🔄 Initializing leaderboard from MongoDB...");

  try {
    // Clear old Redis data
    await clearLeaderboard();

    // Get all leaderboard entries from MongoDB
    const allEntries = await CTF_LeaderBoard.find().lean();

    if (!allEntries.length) {
      console.log("⚠️ No leaderboard data found in MongoDB.");
      return;
    }

    // Rebuild Redis data
    for (const entry of allEntries) {
      const score = entry.total_score || 0;
      const teamName = entry.identifierName;
      const identifierId = entry.identifierId;

      if (!teamName || !identifierId) {
        console.warn(
          `⚠️ Skipping leaderboard entry due to missing values:`,
          entry
        );
        continue;
      }

      console.log(`  - Loading: ${teamName} -> ${score}`);

      await writeLeaderboardEntry(
        teamName,
        identifierId,
        score,
        entry.identifier === "team",
        entry.updatedAt || new Date(),
        true // init flag to skip publish
      );
    }

    console.log(`✅ Leaderboard initialized with ${allEntries.length} entries`);
  } catch (err) {
    console.error("❌ Failed to initialize leaderboard:", err);
    throw err; // block startup if init fails
  }
}

module.exports = initLeaderboard;
