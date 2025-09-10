const mongoose = require("mongoose");
const { Schema } = mongoose;
const CTF_challenges = require("./CTFchallengeModel");
//const { writeLeaderboardEntry } = require("../redis/writeLeaderboardEntry");
const customError = require("../utilies/customError");

const CTF_LeaderBoardSchema = new Schema(
  {
    identifierName: {
      type: String,
      required: [true, "identifierName is required"],
      index: true,
    },
    identifierId: {
      type: Schema.Types.ObjectId,
      required: [true, "identifierId is required"],
      index: true,
    },
    total_score: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    identifier: {
      type: String,
      enum: ["solo", "team"],
      required: true,
    },
    challengesCompleted: [
      {
        ChallengeId: {
          type: Schema.Types.ObjectId,
          ref: "CTF_challenges",
          required: [true, "ChallengeId is required"],
        },
        ObtainedScore: {
          type: Number,
          required: true,
          min: 0,
          default: 0,
        },
      },
    ],
  },
  { timestamps: true }
);

// Compound indexes
CTF_LeaderBoardSchema.index(
  { identifierId: 1, identifier: 1 },
  { unique: true }
);
// one leaderboard entry per user/team

CTF_LeaderBoardSchema.index({ total_score: -1, updatedAt: 1 });
// optimized for ranking queries

// Text index for searching by name
CTF_LeaderBoardSchema.index({ identifierName: "text" });

// Dynamic validation: ensure identifierId points to correct model
CTF_LeaderBoardSchema.pre("save", async function (next) {
  try {
    if (this.identifier === "team") {
      const exists = await mongoose
        .model("Teams")
        .exists({ _id: this.identifierId });
      if (!exists) throw new Error("Invalid teamId reference");
    } else if (this.identifier === "solo") {
      const exists = await mongoose
        .model("Users")
        .exists({ _id: this.identifierId });
      if (!exists) throw new Error("Invalid userId reference");
    }

    // ✅ Validation: recalc total_score before saving
    const sumScores = this.challengesCompleted.reduce(
      (acc, c) => acc + (c.ObtainedScore || 0),
      0
    );

    if (this.total_score !== sumScores) {
      this.total_score = sumScores;
    }

    next();
  } catch (err) {
    next(err);
  }
});

CTF_LeaderBoardSchema.statics.updateScore = async function (
  identifierId,
  isTeam,
  scoreGained,
  ChallengeId,
  identifierName
) {
  try {
    const Model = isTeam ? mongoose.model("Teams") : mongoose.model("Users");

    // Make sure the team/user exists
    const exist = await Model.findById(identifierId);
    if (!exist) throw new Error(isTeam ? "Team not found" : "User not found");

    // Fetch or create leaderboard entry
    let leaderboard = await this.findOne({ identifierId });
    if (!leaderboard) {
      leaderboard = await this.create({
        identifierId,
        identifierName,
        identifier: isTeam ? "team" : "solo",
        total_score: 0,
        challengesCompleted: [],
      });
    }

    // Check if challenge already completed
    const alreadyCompleted = leaderboard.challengesCompleted.some(
      (c) => c.ChallengeId.toString() === ChallengeId.toString()
    );
    if (alreadyCompleted) {
      throw new Error("Challenge already completed. Cannot attempt again.");
    }

    // Add new challenge result
    leaderboard.challengesCompleted.push({
      ChallengeId,
      ObtainedScore: scoreGained,
    });

    // Always recalc total score from all challenges
    leaderboard.total_score = leaderboard.challengesCompleted.reduce(
      (acc, c) => acc + (c.ObtainedScore || 0),
      0
    );

    //reddis update#########################
/*     try {
      const res = await writeLeaderboardEntry(
        leaderboard.identifierName,
        leaderboard.identifierId,
        leaderboard.total_score,
        isTeam
      );
      if (!res.success) {
        throw new customError("Failed to update Redis leaderboard", 500);
      }
    } catch (error) {
      console.error("Redis update error:", error);
      throw new customError("Failed to update Redis leaderboard", 500);
    } */
   

    await leaderboard.save();
    return leaderboard;
  } catch (error) {
    throw error;
  }
};

module.exports = mongoose.model("CTF_LeaderBoard", CTF_LeaderBoardSchema);
