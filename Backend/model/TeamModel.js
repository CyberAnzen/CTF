const mongoose = require("mongoose");
const { Schema } = mongoose;
const { v4: uuidv4 } = require("uuid");

// generateInviteCode(length = 10)
// - returns a shorter, still-random code derived from a UUID (hex, no dashes).
// - default length 10 (you can change to 8, 12, etc.)
// - using part of a uuid keeps randomness high while making the string shorter.
function generateInviteCode(length = 10) {
  const hex = uuidv4().replace(/-/g, ""); // 32 hex chars
  if (typeof length !== "number" || length <= 0) return hex; // fallback to full hex
  return hex.slice(0, Math.min(length, hex.length));
}
// - using part of a uuid keeps randomness high while making the string shorter.

// Standalone async function
async function generateUniqueTeamCode(model, length = 8, attempt = 1) {
  const maxAttempts = 10; // Increased from 5 for better reliability
  if (attempt > maxAttempts) {
    throw new Error(
      "Failed to generate unique team code after multiple attempts"
    );
  }

  // Generate random alphanumeric string (not just UUID segments)
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  // Check for existing code
  const existing = await model.findOne({ teamCode: code });
  return existing ? generateUniqueTeamCode(model, length, attempt + 1) : code;
}

// Helper: Throw if any user in userIds is already in a different team.
// teamIdToIgnore is optional: pass the current team's id when checking updates so the check doesn't consider the current team a conflict.
async function ensureUsersNotInOtherTeams(userIds = [], teamIdToIgnore = null) {
  if (!Array.isArray(userIds) || userIds.length === 0) return;
  const Team = mongoose.model("Teams");

  // normalize ids to strings to avoid type mismatch
  const normalized = userIds.map((id) => String(id));

  // cast to ObjectId instances for the query $in (use new)
  const objectIds = normalized.map(
    (id) => new mongoose.Types.ObjectId(String(id))
  );

  const query = {
    $or: [
      { teamLeader: { $in: objectIds } },
      { "teamMembers.userId": { $in: objectIds } },
    ],
  };
  if (teamIdToIgnore)
    query._id = { $ne: new mongoose.Types.ObjectId(String(teamIdToIgnore)) };

  // project only necessary fields (performance)
  const conflict = await Team.findOne(query, {
    teamLeader: 1,
    "teamMembers.userId": 1,
  }).lean();
  if (conflict) {
    const conflictIds = new Set();
    if (conflict.teamLeader) conflictIds.add(String(conflict.teamLeader));
    (conflict.teamMembers || []).forEach((m) =>
      conflictIds.add(String(m.userId))
    );
    const clashing = normalized.filter((id) => conflictIds.has(String(id)));
    throw new Error(`User(s) already in another team: ${clashing.join(", ")}`);
  }
}

const TeamSchema = new Schema(
  {
    teamName: { type: String, required: true, unique: true, index: true },
    teamCode: {
      type: String,
      required: true,
      unique: true,
      match: [
        /^[A-Z0-9]{8}$/,
        "Team code must be an 8-character alphanumeric string",
      ],
    },
    description: {
      type: String,
      required: true,
      validate: {
        validator: function (value) {
          // Count words by splitting on whitespace and filtering out empties
          const wordCount = value.trim().split(/\s+/).length;
          return wordCount <= 200;
        },
        message: "Description must not exceed 200 words.",
      },
    },
    teamLeader: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: [true, "teamLeader is required"],
      // removed cross-document "already in another team" validator; keep existence check
      validate: {
        validator: async function (value) {
          const User = mongoose.model("Users");
          const userExists = await User.exists({ _id: value });
          return !!userExists;
        },
        message: "User does not exist.",
      },
    },
    invites: [
      {
        memberId: {
          type: Schema.Types.ObjectId,
          ref: "Users",
          required: [true, "Member ID is required"],
          // replaced cross-document validator with simple existence check
          validate: {
            validator: async function (value) {
              const User = mongoose.model("Users");
              const userExists = await User.exists({ _id: value });
              return !!userExists;
            },
            message: "User does not exist.",
          },
        },
        code: {
          type: String,
          default: () => generateInviteCode(10),
          required: true,
          // index: true, // non-unique index if you prefer to rely on app-level uniqueness plus partial unique index
        },
      },
    ],
    teamMembers: {
      type: [
        new Schema(
          {
            userId: {
              type: Schema.Types.ObjectId,
              ref: "Users",
              required: [true, "userId is required"],
              index: true,
              validate: [
                {
                  validator: async function (value) {
                    const User = mongoose.model("Users");
                    const userExists = await User.exists({ _id: value });
                    return !!userExists;
                  },
                  message: "User does not exist.",
                },
                // removed cross-document "already in another team" validator here
              ],
            },
            timestamp: { type: Date, default: Date.now },
          },
          { _id: false }
        ),
      ],
      validate: [
        {
          validator: (v) => v.length >= 1,
          message: "Team must have at least 1 member.",
        },
        {
          validator: (v) => v.length <= 4,
          message: "Team members cannot exceed 4.",
        },
        {
          validator: (v) =>
            v.length === new Set(v.map((m) => m.userId.toString())).size,
          message: "Duplicate members are not allowed in the same team.",
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to generate unique code (MUST be defined before model compilation)
// Change this from pre("save") to pre("validate")
TeamSchema.pre("validate", async function (next) {
  // Only generate code for new documents or if code is missing
  if (this.isNew && !this.teamCode) {
    try {
      this.teamCode = await generateUniqueTeamCode(this.constructor);
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

// TeamSchema.index({ teamName: 1 }, { unique: true });
// ensure uniqueness for invites.code only when code is a string
// Indexes
// TeamSchema.index({ teamName: 1 }, { unique: true });
// TeamSchema.index(
//   { "invites.code": 1 },
//   {
//     unique: true,
//     partialFilterExpression: { "invites.code": { $exists: true, $ne: null } },
//   }
// );

// generateUniqueInviteCode(maxAttempts = 5, length = 10)
// - tries up to maxAttempts to find a code not already present in the collection.
// - length is forwarded to generateInviteCode so you control code size.
async function generateUniqueInviteCode(maxAttempts = 5, length = 10) {
  const Team = mongoose.model("Teams");
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateInviteCode(length);
    const found = await Team.findOne({ "invites.code": code }).lean();
    if (!found) return code;
  }
  throw new Error(
    "Failed to generate unique invite code after multiple attempts"
  );
}

TeamSchema.statics.createTeam = async function (teamName, description, UserId) {
  const User = mongoose.model("Users");

  const leader = await User.findById(UserId);
  if (!leader) throw new Error("Leader user not found");
  // if (leader.teamId != null)
  //   // covers both null and undefined
  //   throw new Error("Leader already belongs to a team");

  // ensure leader is not in another team (application-level check)
  await ensureUsersNotInOtherTeams([UserId]);

  const team = await this.create({
    teamName,
    teamMembers: [{ userId: UserId }],
    description,
    teamLeader: UserId,
  });

  // rollback if User.UpdateTeamId fails
  try {
    await User.UpdateTeamId(team._id, UserId, true);
  } catch (err) {
    try {
      await this.findByIdAndDelete(team._id);
    } catch (cleanupErr) {
      // include both errors
      throw new Error(
        `Failed to set user's teamId: ${err.message}. Cleanup failed: ${cleanupErr.message}`
      );
    }
    throw new Error(`Failed to set user's teamId: ${err.message}`);
  }

  return await this.findById(team._id).populate(
    "teamMembers.userId teamLeader"
  );
};

TeamSchema.statics.deleteTeam = async function (teamId, userId) {
  const User = mongoose.model("Users");
  if (!mongoose.Types.ObjectId.isValid(teamId)) {
    throw new Error("Invalid team ID");
  }
  const team = await this.findById(teamId);
  if (!team) throw new Error("Team not found");

  if (team.teamLeader.toString() !== userId.toString()) {
    throw new Error("Only the team leader can delete the team");
  }

  await User.updateMany({ teamId }, { $unset: { teamId: "" } });
  await this.findByIdAndDelete(teamId);

  return { message: "Team deleted successfully" };
};

// TeamSchema.statics.updateMembers = async function (teamId, leaderId, members) {
//   if (!teamId || !members || !Array.isArray(members)) {
//     throw new Error("Invalid request data");
//   }

//   // normalize leaderId to string for consistent comparisons
//   const leaderIdStr = String(leaderId);

//   const team = await this.findById(teamId);
//   if (!team) {
//     throw new Error("Team not found");
//   }

//   if (team.teamLeader.toString() !== leaderIdStr) {
//     throw new Error("Only team leader can update members");
//   }

//   const normalizedMembers = members.map((m) =>
//     typeof m === "string" ? { userId: m } : { userId: m.userId }
//   );

//   const cleanedUpdatedMembers = normalizedMembers
//     .filter((m) => m.userId && mongoose.Types.ObjectId.isValid(m.userId))
//     .map((m) => ({ userId: new mongoose.Types.ObjectId(m.userId) }));

//   if (cleanedUpdatedMembers.length < 1) {
//     throw new Error("Team must have at least 1 member");
//   }

//   const newMemberIds = cleanedUpdatedMembers.map((m) => m.userId.toString());

//   if (!newMemberIds.includes(team.teamLeader.toString())) {
//     throw new Error("Team leader must be in the team");
//   }

//   // ensure new members are not in another team (except this team)
//   await ensureUsersNotInOtherTeams(newMemberIds, teamId);

//   const prevMemberIds = (team.teamMembers || []).map((m) =>
//     m.userId.toString()
//   );

//   const toAdd = newMemberIds.filter((id) => !prevMemberIds.includes(id));
//   const toRemove = prevMemberIds.filter((id) => !newMemberIds.includes(id));

//   team.teamMembers = cleanedUpdatedMembers;
//   await team.save();

//   if (toAdd.length > 0) {
//     await mongoose.model("Users").updateMany(
//       { _id: { $in: toAdd }, teamId: null }, // only update if teamId is null
//       { $set: { teamId: team._id } }
//     );
//   }

//   if (toRemove.length > 0) {
//     await mongoose.model("Users").updateMany(
//       { _id: { $in: toRemove }, teamId: team._id }, // only clear if they belong to this team
//       { $set: { teamId: null } }
//     );
//   }

//   // ensure team leader has teamId set to this team (use newMemberIds check)
//   if (!newMemberIds.includes(String(team.teamLeader))) {
//     // if leader not in new members (shouldn't happen due to earlier guard) ensure update
//     await mongoose
//       .model("Users")
//       .updateOne({ _id: team.teamLeader }, { $set: { teamId: team._id } });
//   } else {
//     // leader is in new members: ensure teamId is set
//     await mongoose
//       .model("Users")
//       .updateOne({ _id: team.teamLeader }, { $set: { teamId: team._id } });
//   }

//   // populate properly (use array or space-separated string)
//   return await this.findById(teamId).populate("teamMembers.userId teamLeader");
// };
// Static method to update team details
TeamSchema.statics.updateTeamDetails = async function (
  teamId,
  leaderId,
  updates
) {
  if (!teamId || !leaderId || !updates) {
    throw new Error("Team ID, Leader ID, and updates are required");
  }

  // Ensure only allowed fields are updated
  const allowedUpdates = ["teamName", "description"];
  const invalidFields = Object.keys(updates).filter(
    (f) => !allowedUpdates.includes(f)
  );
  if (invalidFields.length) {
    throw new Error(`Invalid update fields: ${invalidFields.join(", ")}`);
  }

  // Check leader permission
  const team = await this.findById(teamId).select("teamLeader");
  if (!team) throw new Error("Team not found");
  if (String(team.teamLeader) !== String(leaderId)) {
    throw new Error("Only the team leader can update team details");
  }

  // Unique name check (case-insensitive)
  if (updates.teamName) {
    const existingTeam = await this.findOne({
      teamName: { $regex: new RegExp(`^${updates.teamName}$`, "i") },
      _id: { $ne: teamId },
    });
    if (existingTeam) {
      throw new Error("Team name already exists");
    }
  }

  // Atomic update with validation
  return this.findOneAndUpdate(
    { _id: teamId },
    { $set: updates },
    { new: true, runValidators: true }
  )
    .populate("teamLeader", "username email")
    .populate("teamMembers.userId", "username email");
};

// Static method to invite a member
// This method generates an invite code for a member to join the team
TeamSchema.statics.inviteMember = async function (teamId, leaderId, memberId) {
  if (!teamId || !leaderId || !memberId) {
    throw new Error("Team ID, Leader ID, and Member ID are required");
  }

  // normalize leaderId for comparison
  const leaderIdStr = String(leaderId);

  const team = await this.findById(teamId);
  if (!team) throw new Error("Team not found");

  if (team.teamLeader.toString() !== leaderIdStr) {
    throw new Error("Only the team leader can invite members");
  }

  // don't invite if they're already a member of this team
  const alreadyMember = (team.teamMembers || []).some(
    (m) => String(m.userId) === String(memberId)
  );
  if (alreadyMember) {
    throw new Error("User is already a member of this team");
  }

  // ensure member is not already in another team (except this team)
  await ensureUsersNotInOtherTeams(
    [memberId],
    new mongoose.Types.ObjectId(teamId)
  );

  // Remove old invite if exists
  team.invites = team.invites.filter(
    (invite) => String(invite.memberId) !== String(memberId)
  );

  // Generate and add new code with uniqueness check (retry loop)
  let inviteCode;
  try {
    inviteCode = await generateUniqueInviteCode(6);
  } catch (err) {
    throw new Error("Failed to generate unique invite code: " + err.message);
  }

  team.invites.push({ memberId, code: inviteCode });

  try {
    await team.save();
  } catch (err) {
    // Handle potential duplicate-key race (very unlikely with full UUID, but safe)
    if (err && err.code === 11000) {
      // attempt one more time
      const fallbackCode = await generateUniqueInviteCode(3);
      team.invites = team.invites.filter(
        (i) => String(i.memberId) !== String(memberId)
      );
      team.invites.push({ memberId, code: fallbackCode });
      await team.save();
      inviteCode = fallbackCode;
    } else {
      throw err;
    }
  }

  return { memberId, inviteCode };
};

// Method for the leader to revoke a user
TeamSchema.statics.revokeInvite = async function (teamId, leaderId, memberId) {
  if (!teamId || !leaderId || !memberId) {
    throw new Error("Team ID, Leader ID, and Member ID are required");
  }

  const team = await this.findById(teamId);
  if (!team) throw new Error("Team not found");

  if (team.teamLeader.toString() !== leaderId.toString()) {
    throw new Error("Only the team leader can revoke invites");
  }

  // Remove all invites for that member
  const originalLength = team.invites.length;
  team.invites = team.invites.filter(
    (invite) => String(invite.memberId) !== String(memberId)
  );

  if (team.invites.length === originalLength) {
    throw new Error("Invite not found for this member");
  }

  await team.save();

  return { memberId, revoked: true };
};

// Static method to accept an invite
// This method allows a user to accept an invite using the invite code
TeamSchema.statics.acceptInvite = async function (
  userId,
  teamCode,
  inviteCode
) {
  if (!userId || !teamCode || !inviteCode) {
    throw new Error("User ID, Team Code, and Invite Code are required");
  }

  const User = mongoose.model("Users");
  const Team = this;

  // normalize inputs
  inviteCode = String(inviteCode).trim();
  teamCode = String(teamCode).trim();
  let userObjId;
  try {
    userObjId = new mongoose.Types.ObjectId(userId);
  } catch (e) {
    throw new Error("Invalid userId format");
  }

  // 1. Load user
  const user = await User.findById(userObjId);
  if (!user) throw new Error("User not found");

  const prevTeamId = user.teamId ? user.teamId.toString() : null;

  // 2. Quick diagnostic: show invites for this team (use in logs)
  const rawTeam = await Team.findOne({ teamCode }).lean();
  if (!rawTeam) throw new Error("Target team not found (check teamCode)");
  console.log(
    "DEBUG team.invites:",
    JSON.stringify(rawTeam.invites || [], null, 2)
  );

  // 3. Try to locate invite in-memory with defensive equality checks
  const foundInvite = (rawTeam.invites || []).find((i) => {
    if (!i || !i.code) return false;
    const codeMatch = String(i.code).trim() === inviteCode;
    // i.memberId might be an ObjectId or string
    const memberIdStr = i.memberId ? String(i.memberId) : null;
    const userIdStr = String(userObjId);
    const memberMatch = memberIdStr === userIdStr;
    // also allow match if invite code matches and memberId is missing (for debugging)
    return codeMatch && memberMatch;
  });

  if (!foundInvite) {
    // helpful diagnostic: is code present but for different user?
    const inviteByCode = (rawTeam.invites || []).find(
      (i) => String(i.code).trim() === inviteCode
    );
    if (inviteByCode) {
      console.log(
        "Invite code found but memberId differs. invite.memberId:",
        String(inviteByCode.memberId),
        "expected userId:",
        String(userObjId)
      );
      throw new Error(
        "Invalid invite code or user (code exists but for different member)."
      );
    }
    // no invite at all for given code
    throw new Error("Invalid invite code or user (no matching invite found).");
  }

  // 4. Do an atomic update on the team: remove invite + add member.
  // Also ensure team size limit (max 5) is not exceeded in the same atomic operation.
  const inviteBackup = {
    memberId: foundInvite.memberId,
    code: foundInvite.code,
  };

  const updateQuery = {
    teamCode: teamCode,
    "invites.code": inviteCode,
    "invites.memberId": userObjId,
    $expr: { $lt: [{ $size: "$teamMembers" }, 4] }, // ensure team has space
  };

  const updatedTeam = await Team.findOneAndUpdate(
    updateQuery,
    {
      $pull: { invites: { code: inviteCode, memberId: userObjId } },
      $addToSet: { teamMembers: { userId: userObjId, timestamp: new Date() } },
    },
    { new: true }
  );

  if (!updatedTeam) {
    // race, team full, or type mismatch — give diagnostic
    // check if team full
    const teamDoc = await Team.findOne({ teamCode }).lean();
    if (teamDoc && (teamDoc.teamMembers || []).length >= 4) {
      throw new Error("Team is full (maximum 4 members).");
    }
    console.log(
      "Atomic update failed: invite may have been removed or memberId type mismatch."
    );
    throw new Error("Invalid invite code or user (atomic update failed).");
  }

  // 5. Remove user from previous team if needed
  try {
    if (prevTeamId && prevTeamId !== updatedTeam._id.toString()) {
      await Team.updateOne(
        { _id: new mongoose.Types.ObjectId(prevTeamId) },
        { $pull: { teamMembers: { userId: userObjId } } }
      );
    }
  } catch (e) {
    // rollback team change
    await Team.updateOne(
      { _id: updatedTeam._id },
      { $pull: { teamMembers: { userId: userObjId } } }
    );
    await Team.updateOne(
      { _id: updatedTeam._id },
      { $addToSet: { invites: inviteBackup } }
    );
    throw new Error("Failed removing user from previous team: " + e.message);
  }

  // 6. Update user's teamId
  try {
    const updated = await User.findByIdAndUpdate(
      userObjId,
      { $set: { teamId: updatedTeam._id } },
      { new: true }
    );
    if (!updated) throw new Error("Failed to update user's teamId");
  } catch (userErr) {
    // rollback: remove member from new team, restore invite, restore prev team membership
    const rollbackErrors = [];
    try {
      await Team.updateOne(
        { _id: updatedTeam._id },
        { $pull: { teamMembers: { userId: userObjId } } }
      );
      await Team.updateOne(
        { _id: updatedTeam._id },
        { $addToSet: { invites: inviteBackup } }
      );
    } catch (e) {
      rollbackErrors.push("Failed to restore new team: " + e.message);
    }
    if (prevTeamId && prevTeamId !== updatedTeam._id.toString()) {
      try {
        await Team.updateOne(
          { _id: new mongoose.Types.ObjectId(prevTeamId) },
          {
            $addToSet: {
              teamMembers: { userId: userObjId, timestamp: new Date() },
            },
          }
        );
      } catch (e) {
        rollbackErrors.push(
          "Failed to restore previous team membership: " + e.message
        );
      }
    }
    // attempt revert user.teamId to previous
    try {
      await User.findByIdAndUpdate(userObjId, {
        $set: {
          teamId: prevTeamId ? new mongoose.Types.ObjectId(prevTeamId) : null,
        },
      });
    } catch (e) {
      rollbackErrors.push("Failed to revert user's teamId: " + e.message);
    }

    if (rollbackErrors.length) {
      throw new Error(
        `Failed updating user: ${
          userErr.message
        }. Rollback issues: ${rollbackErrors.join(" | ")}`
      );
    }
    throw new Error("Failed updating user: " + userErr.message);
  }

  // 7. Return populated team
  return await Team.findById(updatedTeam._id)
    .select("-invites")
    .populate("teamMembers.userId teamLeader");
};

//  Static method to change the leader
TeamSchema.statics.changeLeader = async function (
  teamId,
  leaderId,
  newLeaderId
) {
  const Team = mongoose.model("Teams");
  const User = mongoose.model("Users");

  // basic param validation
  if (!teamId || !leaderId || !newLeaderId) {
    throw new Error("Team ID, Leader ID, and newLeader ID are required");
  }
  if (
    !mongoose.Types.ObjectId.isValid(teamId) ||
    !mongoose.Types.ObjectId.isValid(leaderId) ||
    !mongoose.Types.ObjectId.isValid(newLeaderId)
  ) {
    throw new Error("Invalid ObjectId format for teamId/leaderId/newLeaderId");
  }

  const teamObjId = new mongoose.Types.ObjectId(teamId);
  const leaderObjId = new mongoose.Types.ObjectId(leaderId);
  const newLeaderObjId = new mongoose.Types.ObjectId(newLeaderId);

  // 1) Atomic check+update: ensure team exists, caller is current leader, and newLeader is already a member
  const updated = await Team.findOneAndUpdate(
    {
      _id: teamObjId,
      teamLeader: leaderObjId,
      "teamMembers.userId": newLeaderObjId, // ensures newLeader is a member
    },
    {
      $set: { teamLeader: newLeaderObjId },
    },
    { new: true, runValidators: true }
  )
    .select("-invites")
    .populate("teamMembers.userId teamLeader");

  if (!updated) {
    throw new Error(
      "Team not found, you are not the current leader, or the new leader is not a member of this team"
    );
  }

  let addedPrevLeader = false;
  try {
    // 2) Ensure previous leader exists in teamMembers (if not, add them)
    const prevIsMember = (updated.teamMembers || []).some(
      (m) => String(m.userId) === String(leaderObjId)
    );
    if (!prevIsMember) {
      const pushResult = await Team.updateOne(
        { _id: teamObjId, "teamMembers.userId": { $ne: leaderObjId } },
        {
          $push: {
            teamMembers: { userId: leaderObjId, timestamp: new Date() },
          },
        }
      );
      // if modifiedCount === 1 then we added them
      addedPrevLeader = !!(
        pushResult &&
        (pushResult.modifiedCount || pushResult.nModified)
      );
    }

    // 3) Ensure user documents are consistent: both old leader and new leader should have teamId set to this team
    await User.updateMany(
      { _id: { $in: [leaderObjId, newLeaderObjId] } },
      { $set: { teamId: teamObjId } }
    );

    // 4) Return current populated team (fetch fresh in case we added prev leader)
    const finalTeam = await Team.findById(teamObjId)
      .select("-invites")
      .populate("teamMembers.userId teamLeader");
    return finalTeam;
  } catch (err) {
    // Attempt rollback: set leader back to old leader if we already changed it
    try {
      await Team.findOneAndUpdate(
        { _id: teamObjId, teamLeader: newLeaderObjId },
        { $set: { teamLeader: leaderObjId } },
        { new: true }
      );
      if (addedPrevLeader) {
        // remove the prev leader object we added
        await Team.updateOne(
          { _id: teamObjId },
          { $pull: { teamMembers: { userId: leaderObjId } } }
        );
      }
    } catch (rbErr) {
      // if rollback fails, include that info in the thrown error
      throw new Error(
        `Failed updating user records (${err.message}). Rollback failed: ${rbErr.message}`
      );
    }
    throw new Error(`Failed updating user records: ${err.message}`);
  }
};
TeamSchema.statics.getTeamByUserId = async function (userId) {
  const logPrefix = "[Team.getTeamByUserId]";

  try {
    if (!userId) {
      console.error(`${logPrefix} Missing userId`);
      throw new Error("User ID is required");
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error(`${logPrefix} Invalid ObjectId: ${userId}`);
      throw new Error("Invalid user ID format");
    }

    const User = mongoose.model("Users");
    const UserData = await User.findById(userId).lean();

    if (!UserData) {
      console.error(`${logPrefix} No user found with id: ${userId}`);
      throw new Error("User not found");
    }

    if (!UserData.teamId) {
      console.warn(`${logPrefix} User ${userId} is not in any team`);
      throw new Error("User is not part of any team");
    }

    let query = this.findById(UserData.teamId).populate(
      "teamMembers.userId teamLeader"
    );

    // Only populate invites if leader
    const teamTemp = await query.exec();

    if (!teamTemp) {
      console.error(
        `${logPrefix} Team not found for user ${userId}, teamId: ${UserData.teamId}`
      );
      throw new Error("Team not found for the given user ID");
    }

    const isLeader =
      String(teamTemp.teamLeader?._id || teamTemp.teamLeader) ===
      String(userId);

    let team;
    if (isLeader) {
      // repopulate including invites with user details
      team = await this.findById(UserData.teamId)
        .populate("teamMembers.userId teamLeader")
        .populate(
          "invites.memberId",
          "username email regNumber userDetails profile"
        )
        .lean();
    } else {
      team = teamTemp.toObject();
      delete team.invites;
    }

    const teamWithRole = { ...team, leader: isLeader };

    console.info(
      `${logPrefix} Successfully fetched team ${teamWithRole._id} for user ${userId}, leader: ${isLeader}`
    );

    return teamWithRole;
  } catch (err) {
    console.error(`${logPrefix} Error: ${err.message}`, { stack: err.stack });
    throw err;
  }
};

TeamSchema.statics.leaveTeam = async function (userId) {
  const MAX_RETRIES = 6;
  if (!userId) throw new Error("User ID is required");
  if (!mongoose.Types.ObjectId.isValid(userId))
    throw new Error("Invalid user ID format");
  const User = mongoose.model("Users");
  const userObjId = new mongoose.Types.ObjectId(userId);

  // confirm user exists and has a team
  const user = await User.findById(userObjId).lean();
  if (!user) throw new Error("User not found");
  if (!user.teamId) throw new Error("User is not part of any team");

  const teamId = new mongoose.Types.ObjectId(user.teamId);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    // reload fresh team snapshot
    const team = await this.findById(teamId).lean();
    if (!team) throw new Error("Team not found for the given user ID");

    const isMember = (team.teamMembers || []).some(
      (m) => String(m.userId) === String(userObjId)
    );
    if (!isMember) throw new Error("User is not a member of this team");

    const isLeader = String(team.teamLeader) === String(userObjId);

    try {
      if (isLeader) {
        // leader leaving
        if (!team.teamMembers || team.teamMembers.length <= 1) {
          // attempt atomic delete only if no other members remain
          const del = await this.deleteOne({
            _id: team._id,
            teamLeader: userObjId,
            "teamMembers.1": { $exists: false }, // ensures members length <= 1
          });
          if (del && (del.deletedCount === 1 || del.n === 1)) {
            await User.updateOne(
              { _id: userObjId, teamId: team._id },
              { $unset: { teamId: "" } }
            );
            return { message: "Successfully team deleted", teamId: team._id };
          }
          // if delete didn't succeed, retry
          continue;
        } else {
          // choose next leader (first member that's not the current leader)
          const next = (team.teamMembers || []).find(
            (m) => String(m.userId) !== String(userObjId)
          );
          if (!next) {
            // rare: no candidate, retry loop
            continue;
          }
          const newLeaderId = new mongoose.Types.ObjectId(next.userId);

          // atomically set new leader and remove old leader from members
          const updated = await this.findOneAndUpdate(
            {
              _id: team._id,
              teamLeader: userObjId,
              "teamMembers.userId": userObjId,
            },
            {
              $set: { teamLeader: newLeaderId },
              $pull: { teamMembers: { userId: userObjId } },
            },
            { new: true }
          ).lean();

          if (updated) {
            await User.updateOne(
              { _id: userObjId, teamId: team._id },
              { $unset: { teamId: "" } }
            );
            return {
              message: "Successfully leader transferred",
              teamId: team._id,
            };
          }
          // otherwise retry
          continue;
        }
      } else {
        // normal member leaving: atomically remove member
        const res = await this.updateOne(
          { _id: team._id, "teamMembers.userId": userObjId },
          { $pull: { teamMembers: { userId: userObjId } } }
        );

        const modified =
          typeof res.modifiedCount !== "undefined"
            ? res.modifiedCount
            : res.nModified;
        const matched =
          typeof res.matchedCount !== "undefined" ? res.matchedCount : res.n;

        if (matched && modified) {
          await User.updateOne(
            { _id: userObjId, teamId: team._id },
            { $unset: { teamId: "" } }
          );
          return { message: "Successfully left", teamId: team._id };
        }

        // If matched but not modified -> maybe already removed; ensure user's teamId is cleared
        if (matched && !modified) {
          const u = await User.findById(userObjId).lean();
          if (!u || !u.teamId || String(u.teamId) !== String(team._id)) {
            return {
              message: "Already removed or inconsistent (treated as left)",
              teamId: team._id,
            };
          }
        }

        // not matched -> race, retry
        continue;
      }
    } catch (e) {
      // on transient errors, retry a few times
      if (attempt === MAX_RETRIES) throw e;
      continue;
    }
  }

  // after retries, give a helpful diagnostic
  const finalTeam = await this.findById(teamId).lean();
  const stillMember =
    finalTeam &&
    (finalTeam.teamMembers || []).some(
      (m) => String(m.userId) === String(userObjId)
    );
  if (stillMember)
    throw new Error(
      "Failed to leave team after multiple attempts due to concurrent updates"
    );
  // best-effort: unset user's teamId if it still points to this team
  await User.updateOne(
    { _id: userObjId, teamId: teamId },
    { $unset: { teamId: "" } }
  );
  return { message: "Leave processed (post-retry cleanup)", teamId };
};

TeamSchema.statics.removeMember = async function (teamId, leaderId, memberId) {
  if (!teamId || !leaderId || !memberId) {
    throw new Error("Team ID, Leader ID, and Member ID are required");
  }

  const team = await this.findById(teamId);
  if (!team) throw new Error("Team not found");

  if (team.teamLeader.toString() !== String(leaderId)) {
    throw new Error("Only the team leader can remove members");
  }

  // ensure member is in this team
  const memberIndex = team.teamMembers.findIndex(
    (m) => String(m.userId) === String(memberId)
  );
  if (memberIndex === -1) {
    throw new Error("Member not found in this team");
  }

  // remove from teamMembers
  team.teamMembers.splice(memberIndex, 1);

  // also clear user's teamId
  await mongoose
    .model("Users")
    .updateOne({ _id: memberId }, { $unset: { teamId: "" } });

  await team.save();

  return await this.findById(teamId).populate("teamMembers.userId teamLeader");
};

TeamSchema.statics.getallProgress = async (teamId) => {
  try {
    const progresses = this.findById(teamId);
    if (!progresses) {
      throw new Error("Team not found");
    }
  } catch (error) {}
};
module.exports = mongoose.model("Teams", TeamSchema);
