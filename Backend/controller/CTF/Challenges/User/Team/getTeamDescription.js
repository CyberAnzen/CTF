const TeamModal = require("../../../../../model/TeamModel");
exports.getTeamDescription = async (req, res) => {
  try {
    const { teamId } = req.params;
    const teamDetails = await TeamModal.getDescriptions(teamId);
    if (!teamDetails) {
      return res.status(404).json({ error: "Team not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Team description fetched",
      data: teamDetails,
    });
  } catch (error) {
    console.error("Error fetching team description:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
