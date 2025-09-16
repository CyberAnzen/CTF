const mongoose = require("mongoose");
const { Schema } = mongoose;
const Flag_attempt = Number(process.env.Flag_Attemtps) || 5;
const CTF_challenges = require("./CTFchallengeModel");
const CTF_LeaderBoardSchema = require("./CTF_LeaderBoardModel");
const moment = require("moment-timezone");

const CTFprogress = new Schema(
  {
    challengeId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "CTF_challenges",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: [true, "userId is required"],
      validate: {
        validator: (v) => v != null,
        message: "userId cannot be null",
      },
      index: true,
    },
    attempt: {
      type: Number,
      required: true,
      min: 0,
      max: Flag_attempt,
      default: 0,
    },

    score: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    Flag_Submitted: {
      type: Boolean,
      default: false,
    },
    hints: [
      {
        hintId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        used: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

CTFprogress.index({ userId: 1, challengeId: 1 }, { unique: true });

// // Static methods for CTFprogress model
// CTFprogress.statics.getHint = async (userId, challengeId, hintId) => {
//   // Try to find existing progress
//   const exist = await this.findOne({ userId, challengeId }).lean();
//   if (!exist) throw new Error("Progress not found");
//   if (exist.Flag_Submitted) {
//   }
// };
CTFprogress.statics.getHint = async function (userId, challengeId, hintId) {
  const progress = await this.findOne({ userId, challengeId });
  if (!progress) throw new Error("Progress not found");

  const Challenge = await CTF_challenges.findById(challengeId).lean();
  if (!Challenge) throw new Error("Challenge not found");

  // ensure progress.hints initialized from Challenge if missing/empty
  if (!Array.isArray(progress.hints) || progress.hints.length === 0) {
    const initialHints = Array.isArray(Challenge.hints)
      ? Challenge.hints.map((h) => ({ hintId: h._id, used: false }))
      : [];
    await this.updateOne(
      { userId, challengeId },
      { $set: { hints: initialHints } },
      { upsert: true }
    );
    progress.hints = initialHints;
  }

  // Case 1: Flag already submitted -> always unlock, do NOT reduce score
  if (progress.Flag_Submitted) {
    const hintExists = progress.hints.some(
      (h) => String(h.hintId) === String(hintId)
    );

    if (hintExists) {
      await this.updateOne(
        { userId, challengeId, "hints.hintId": hintId },
        { $set: { "hints.$.used": true } }
      );
    } else {
      await this.updateOne(
        { userId, challengeId },
        { $push: { hints: { hintId, used: true } } }
      );
    }

    return this.fetchProgress(userId, challengeId);
  }

  // Case 2: Flag not submitted -> can only unlock first locked hint and reduce score by hint.cost
  const firstLockedHint = progress.hints.find((h) => !h.used);
  if (!firstLockedHint) return this.fetchProgress(userId, challengeId); // all used already

  if (String(firstLockedHint.hintId) !== String(hintId)) {
    return this.fetchProgress(userId, challengeId); // only first locked hint may be unlocked
  }

  // find cost from Challenge.hints
  let cost = 0;
  if (Array.isArray(Challenge.hints)) {
    const hd = Challenge.hints.find((h) => String(h._id) === String(hintId));
    if (hd && typeof hd.cost === "number") cost = hd.cost;
  }

  const update = { $set: { "hints.$.used": true } };
  if (cost && typeof cost === "number")
    update.$inc = { score: -Math.abs(cost) };

  await this.updateOne({ userId, challengeId, "hints.hintId": hintId }, update);

  return this.fetchProgress(userId, challengeId);
};

CTFprogress.statics.fetchProgress = async function (userId, challengeId) {
  const populateHints = async (doc, challenge) => {
    if (!doc) return doc;
    const hintsArr = Array.isArray(doc.hints) ? doc.hints : [];

    // If progress has no hint entries, synthesize them from the challenge.hints
    let effectiveHints = hintsArr;
    if (!effectiveHints.length && challenge && Array.isArray(challenge.hints)) {
      effectiveHints = challenge.hints.map((h) => ({
        hintId: h._id,
        used: false,
      }));
    }

    // Build map of hint subdocs by _id from the challenge (fast lookup)
    const hintMap = {};
    if (challenge && Array.isArray(challenge.hints)) {
      challenge.hints.forEach((h) => {
        if (h && h._id) hintMap[String(h._id)] = h;
      });
    }

    const hints = effectiveHints.map((h) => {
      const id = String(h.hintId);
      const hd = hintMap[id] || null;
      const cost = hd ? hd.cost : null;

      return h.used
        ? { used: true, id, hint: hd ? hd.text ?? null : null, cost }
        : { used: false, id, cost }; // No hint text if not used
    });

    return { ...doc, hints };
  };

  // Load challenge once
  const Challenge = await CTF_challenges.findById(challengeId).lean();
  if (!Challenge) throw new Error("Challenge not found");

  // Try to find existing progress
  let exist = await this.findOne({ userId, challengeId }).lean();

  if (exist) {
    // Build canonical hints array from Challenge (preserves challenge order)
    const canonicalHints = Array.isArray(Challenge.hints)
      ? Challenge.hints.map((h) => ({ hintId: h._id, used: false }))
      : [];

    // Map existing used flags by hintId for preservation
    const usedMap = {};
    if (Array.isArray(exist.hints)) {
      exist.hints.forEach((h) => {
        if (h && h.hintId) usedMap[String(h.hintId)] = !!h.used;
      });
    }

    // Merge: preserve used=true where hintId still present, default false for new ones
    const mergedHints = canonicalHints.map((h) => ({
      hintId: h.hintId,
      used: !!usedMap[String(h.hintId)],
    }));

    // Detect difference between stored exist.hints and mergedHints
    const normalize = (arr) =>
      (arr || [])
        .map((x) => `${String(x.hintId)}|${x.used ? "1" : "0"}`)
        .join(",");
    const storedNormalized = normalize(exist.hints);
    const mergedNormalized = normalize(mergedHints);

    if (storedNormalized !== mergedNormalized) {
      // Update DB with the merged hints atomically
      await this.updateOne(
        { userId, challengeId },
        { $set: { hints: mergedHints } }
      );
      // Refresh exist with updated hints
      exist = await this.findOne({ userId, challengeId }).lean();
    }

    const doc = await populateHints(exist, Challenge);
    const data = {
      ...doc,
      title: Challenge.title,
      description: Challenge.description,
      category: Challenge.category,
      difficulty: Challenge.difficulty,
      tags: Challenge.tags || [],
      attachments: Challenge.attachments || [],
      Author: Challenge.Author || null,

      challengeNumber: Challenge.challengeNumber,
    };
    return { Flag_Submitted: !!exist.Flag_Submitted, Visited: true, ...data };
  }

  // Create new progress and initialize hints from Challenge.hints
  const initialHints = Array.isArray(Challenge.hints)
    ? Challenge.hints.map((h) => ({ hintId: h._id, used: false }))
    : [];

  const newProgress = await this.findOneAndUpdate(
    { userId, challengeId },
    {
      $setOnInsert: {
        attempt: 0,
        score: Challenge.score || 0,
        Flag_Submitted: false,
        hints: initialHints,
      },
    },
    { new: true, upsert: true }
  ).lean();

  const doc = await populateHints(newProgress, Challenge);
  const data = {
    ...doc,
    title: Challenge.title,
    description: Challenge.description,
    category: Challenge.category,
    difficulty: Challenge.difficulty,
    tags: Challenge.tags || [],
    attachments: Challenge.attachments || [],
    Author: Challenge.Author || null,

    challengeNumber: Challenge.challengeNumber,
  };

  return { Flag_Submitted: false, Visited: false, ...data };
};

CTFprogress.statics.validateFlag = async function (userId, challengeId, Flag) {
  const model = this;

  // Helper: canonicalize a flag
  const canonicalize = (v) =>
    String(v ?? "")
      .normalize("NFKC")
      .replace(/[\u200B-\u200D\uFEFF]/g, "") // strip zero-width & BOM
      .trim();

  // Defensive: handle Flag_attempt
  const MAX_ATTEMPTS =
    Number.isFinite(Number(Flag_attempt)) && Number(Flag_attempt) >= 0
      ? Number(Flag_attempt)
      : Infinity;

  // 1) fetch challenge
  const challenge = await CTF_challenges.findById(challengeId).lean();
  if (!challenge) {
    return { updated: false, created: false, correct: false, Challenge: false };
  }

  // 2) normalize flags
  let submittedFlag = canonicalize(Flag);
  let correctFlag = canonicalize(challenge.flag);

  // Uncomment below if your flags are case-insensitive
  // submittedFlag = submittedFlag.toLowerCase();
  // correctFlag = correctFlag.toLowerCase();

  if (process.env.DEBUG_FLAGS) {
    console.log("Flag check", {
      rawSubmitted: Flag,
      rawStored: challenge.flag,
      submittedFlag,
      correctFlag,
    });
  }

  // 3) get existing progress (create if not exists)
  let progress = await model.findOne({ userId, challengeId });
  let created = false;
  if (!progress) {
    created = true;
    const initialHints = Array.isArray(challenge.hints)
      ? challenge.hints.map((h) => ({ hintId: h._id, used: false }))
      : [];
    progress = await model.findOneAndUpdate(
      { userId, challengeId },
      {
        $setOnInsert: {
          score: challenge.score || 0,
          Flag_Submitted: false,
          hints: initialHints,
          attempt: 0,
        },
      },
      { new: true, upsert: true }
    );
  }

  // 4) attempts / already submitted guard
  if ((progress.attempt || 0) >= MAX_ATTEMPTS || progress.Flag_Submitted) {
    const locked = await model.findById(progress._id).lean();
    return {
      updated: false,
      created,
      correct: false,
      Challenge: locked,
    };
  }

  // 5) correct flag path
  if (submittedFlag === correctFlag) {
    const updatedDoc = await model
      .findOneAndUpdate(
        { _id: progress._id },
        {
          $set: { Flag_Submitted: true },
          $inc: { attempt: 1 }, // count correct attempts too
        },
        { new: true }
      )
      .lean();

    // 6) leaderboard update (safe)
    try {
      let identifierName = "";
      let UsersModel = null;
      try {
        UsersModel = mongoose.model("Users");
      } catch (_) {}
      if (UsersModel) {
        const u = await UsersModel.findById(userId)
          .select("username name email")
          .lean()
          .catch(() => null);
        identifierName = u ? u.username || u.name || u.email || "" : "";
      }

      const LB =
        typeof CTF_LeaderBoard !== "undefined" &&
        CTF_LeaderBoard &&
        typeof CTF_LeaderBoard.updateScore === "function"
          ? CTF_LeaderBoard
          : mongoose.modelNames().includes("CTF_LeaderBoard")
          ? mongoose.model("CTF_LeaderBoard")
          : null;

      if (LB) {
        await LB.updateScore(
          userId,
          false, // isTeam = false
          progress.score || 0,
          challengeId,
          identifierName
        );
      } else {
        console.warn("Leaderboard model not available; skipping update.");
      }
    } catch (err) {
      console.error("Leaderboard update error (user):", err);
    }

    return {
      updated: true,
      created,
      correct: true,
      Challenge: updatedDoc,
    };
  }

  // 7) wrong flag path
  const updatedDoc = await model
    .findOneAndUpdate(
      { _id: progress._id },
      { $inc: { attempt: 1 } },
      { new: true }
    )
    .lean();

  return {
    updated: true,
    created,
    correct: false,
    Challenge: updatedDoc,
  };
};

CTFprogress.statics.getProgress = async function (userId) {
  const progresses = await this.find({ userId }).lean();

  const result = [];
  let completedCount = 0;

  for (const prog of progresses) {
    const challenge = await CTF_challenges.findById(prog.challengeId).lean();
    if (!challenge) continue;

    const totalHints = Array.isArray(challenge.hints)
      ? challenge.hints.length
      : 0;
    const unlockedHints = Array.isArray(prog.hints)
      ? prog.hints.filter((h) => h.used).length
      : 0;

    let completionTime = null;
    if (prog.Flag_Submitted) {
      completedCount++;
      completionTime = moment(prog.updatedAt)
        .tz("Asia/Kolkata")
        .format("YYYY-MM-DD HH:mm:ss");
    }

    result.push({
      ...prog,
      title: challenge.title,
      description: challenge.description,
      category: challenge.category,
      difficulty: challenge.difficulty,
      tags: challenge.tags || [],
      challengeNumber: challenge.challengeNumber,
      totalHints,
      unlockedHints,
      completionTime,
    });
  }

  // ✅ use total challenges count from DB
  const totalChallenges = await CTF_challenges.countDocuments();

  return {
    totalChallenges,
    completedChallenges: completedCount,
    challenges: result,
  };
};

module.exports = mongoose.model("CTF_progress", CTFprogress);
