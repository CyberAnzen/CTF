const CTF_progress = require("../../../../model/CTFprogressModel");
const CTF_Teamprogress = require("../../../../model/CTF_TeamModel");
const { User } = require("../../../../model/UserModel");

exports.getProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).lean();
    if (!user)
      return res.status(400).json({ message: "Error fetching User Data" });

    const teamId = user.teamId || null;

    let progress;

    if (teamId) {
      // User is in a team, use team hint
      progress = await CTF_Teamprogress.getProgress(teamId);
    } else {
      // User is not in a team, use individual hint
      progress = await CTF_progress.getProgress(userId);
    }

    if (!progress) return res.status(404).json({ message: "Hint not found" });

    return res.status(200).json({
      message: "progress fetched successfully",
      progress,
    });
  } catch (error) {
    console.error("progress fetching error:", error);
    if (process.env.NODE_ENV !== "production") {
      return res
        .status(500)
        .json({ error: error.message || "Internal server error" });
    }
    return res.status(400).json({
      message: "Error fetching progress",
      //error: error.message || error
    });
  }
};
