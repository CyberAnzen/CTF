const express = require("express");
const router = express.Router();
const { Auth } = require("../middleware/Auth");
const xssSanitizer = require("../middleware/xssSanitizer");
const {
  createTeam,
} = require("../controller/CTF/Challenges/User/Team/Leader/createTeam");
const {
  updateMembers,
} = require("../controller/CTF/Challenges/User/Team/Leader/updateMembers");
const {
  deleteTeam,
} = require("../controller/CTF/Challenges/User/Team/Leader/deleteTeam");
const {
  generateInvite,
} = require("../controller/CTF/Challenges/User/Team/Leader/generateInvite");

router.get(
  "/",
  Auth(),
  require("../controller/CTF/Challenges/User/Team/getteamDetails")
    .getTeamDetails
);
router.get(
  "/description/:teamId",
  Auth(),
  require("../controller/CTF/Challenges/User/Team/getTeamDescription")
    .getTeamDescription
);
router.post(
  "/createTeam",
  //xssSanitizer(),
  Auth(),
  createTeam
);
// router.patch("/updateMembers", Auth(), updateMembers);
router.delete("/deleteTeam", xssSanitizer(), Auth(), deleteTeam);
router.post("/generateInvite", xssSanitizer(), Auth(), generateInvite);
router.post(
  "/revokeInvite",
  xssSanitizer(),
  Auth(),
  require("../controller/CTF/Challenges/User/Team/Leader/revokeInvite")
    .revokeInvite
);
router.post(
  "/acceptInvite",
  xssSanitizer(),
  Auth(),
  require("../controller/CTF/Challenges/User/Team/Members/acceptInvite")
    .acceptInvite
);
router.patch(
  "/updateTeam",
  xssSanitizer(),
  Auth(),
  require("../controller/CTF/Challenges/User/Team/Leader/updateTeam").updateTeam
);
router.put(
  "/changeLeader",
  xssSanitizer(),
  Auth(),
  require("../controller/CTF/Challenges/User/Team/Leader/changeLeader")
    .changeLeader
);
router.post(
  "/leaveTeam",
  xssSanitizer(),
  Auth(),
  require("../controller/CTF/Challenges/User/Team/leaveTeam").leaveTeam
);
router.delete(
  "/removeMember",
  xssSanitizer(),
  Auth(),
  require("../controller/CTF/Challenges/User/Team/Leader/removeMember")
    .removeMember
);
module.exports = router;
