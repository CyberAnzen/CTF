const CTF_progress = require("../../../../model/CTFprogressModel");
const CTF_Teamprogress = require("../../../../model/CTF_TeamModel");
const { User } = require("../../../../model/UserModel");

// 1) Get progress for logged-in user (self)
exports.getProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).lean();
    if (!user)
      return res.status(400).json({ message: "Error fetching User Data" });

    const teamId = user.teamId || null;

    let progress;

    if (teamId) {
      progress = await CTF_Teamprogress.getProgress(teamId);
    } else {
      progress = await CTF_progress.getProgress(userId);
    }

    if (!progress)
      return res.status(404).json({ message: "Progress not found" });

    return res.status(200).json({
      message: "Progress fetched successfully",
      progress,
    });
  } catch (error) {
    console.error("progress fetching error:", error);
    return handleError(res, error, "Error fetching progress");
  }
};

// 2) Get progress by User ID (req.params.userId)
exports.getProgressByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).lean();
    if (!user) return res.status(400).json({ message: "Invalid User ID" });

    const progress = await CTF_progress.getProgress(userId);
    if (!progress)
      return res.status(404).json({ message: "Progress not found" });

    return res.status(200).json({
      message: "Progress fetched successfully",
      progress,
    });
  } catch (error) {
    console.error("progress fetching error:", error);
    return handleError(res, error, "Error fetching user progress");
  }
};

// 3) Get progress by Team ID (req.params.teamId)
exports.getProgressByTeamId = async (req, res) => {
  try {
    const { teamId } = req.params;

    const progress = await CTF_Teamprogress.getProgress(teamId);
    if (!progress)
      return res.status(404).json({ message: "Progress not found" });

    return res.status(200).json({
      message: "Progress fetched successfully",
      progress,
    });
  } catch (error) {
    console.error("progress fetching error:", error);
    return handleError(res, error, "Error fetching team progress");
  }
};

// 🔹 Helper for cleaner error handling
function handleError(res, error, defaultMessage) {
  if (process.env.NODE_ENV !== "production") {
    return res
      .status(500)
      .json({ error: error.message || "Internal server error" });
  }
  return res.status(400).json({ message: defaultMessage });
}
