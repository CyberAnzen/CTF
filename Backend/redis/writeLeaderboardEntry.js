const { redis } = require("./config/connectRedis");
const LeaderboardManager=require("../controller/CTF/LeaderBoard/leaderBoardManager")


const LEADERBOARD_KEY = process.env.LEADERBOARD_KEY || "ctf:leaderboard"; 
const TEAM_META_KEY = process.env.TEAM_META_KEY || "ctf:team"; 
/**
 * Write or update a leaderboard entry in Redis
 * @param {string} teamName - Name of the team
 * @param {number} score - Score to set
 * @param {Date} updatedAt - Last updated time
 */
async function writeLeaderboardEntry(teamName, teamId, score, isTeam = true, updatedAt = new Date(), init = false) {
  try {
    // Validate required parameters
    if (teamName === undefined || teamId === undefined || score === undefined) {
      throw new Error(`Missing required parameters: teamName=${teamName}, teamId=${teamId}, score=${score}`);
    }

    const member = String(teamId);
    const ts = updatedAt.getTime(); // ms timestamp
    const compositeScore = (score * 1e13) + (1e13 - ts);

    const pipeline = redis.multi();

    // 1. Sorted set → store composite score
    pipeline.zAdd(LEADERBOARD_KEY, {
      score: compositeScore,
      value: member,
    });

    // 2. Hash → store metadata
    pipeline.hSet(`${TEAM_META_KEY}:${member}`, {
      teamName: String(teamName),
      isTeam: isTeam ? "team" : "solo",
      teamId: member,
      score: score,
      updatedAt: ts,
    });

    await pipeline.exec();

    console.log(`✅ Leaderboard updated: ${teamName} -> ${score} (at ${updatedAt})`);
    
    if (!init) {
      await redis.publish('leaderboard-update', 'score-changed');
    }
    
    return { success: true };
  } catch (error) {
    console.error(`❌ Error writing leaderboard entry for ${teamName}:`, error.message);
    return { success: false, message: error.message };
  }
}

module.exports = { writeLeaderboardEntry };