const express = require("express");
const router = express.Router();
const { dynamicFileUpload } = require("../middleware//dynamicFileUploadPath");
const randomPathName = require("../middleware/randomPathName");
const updateRandomPath = require("../middleware/updateRandomPath");
const fileUploader = require("../utilies/FileUploder");
const upload = fileUploader("public/CTF/Challenges/");
const { Auth } = require("../middleware/Auth");
const xssSanitizer = require("../middleware/xssSanitizer");
const Path = require("path");

//controllers
const {
  CreateChallenges,
} = require("../controller/CTF/Challenges/Admin/CreateChallenges");
const {
  getChallengeAdmin,
} = require("../controller/CTF/Challenges/Admin/getChallengeAdmin");
const {
  updateChallenge,
} = require("../controller/CTF/Challenges/Admin/updateChallenge");
const {
  getallChallenge,
} = require("../controller/CTF/Challenges/User/getallChallenge");
const {
  getChallenge,
} = require("../controller/CTF/Challenges/User/getChallenge");
const {
  deleteChallenge,
} = require("../controller/CTF/Challenges/Admin/deleteChallenge");
const { getHint } = require("../controller/CTF/Challenges/User/getHints");
const {
  getProgress,
} = require("../controller/CTF/Challenges/User/getProgress");

//Admin Routes
router.get(
  "/admin/:ChallengeId",
  xssSanitizer(),
  Auth({ requireAdmin: true }),
  getChallengeAdmin
);

router.post(
  "/admin/create",
  Auth({ requireAdmin: true }),
  dynamicFileUpload({
    type: "multi",
    tempPath: Path.join("temp", "CTF_Challenges"),
    para: "attachments",
    maxCount: 10,
    randomFileName: false,
    randomPathName: true,
  }),
  xssSanitizer(),
  randomPathName(Path.join("public", "CTF", "Challenges"), "title"),
  CreateChallenges
);

router.patch(
  "/admin/update/:ChallengeId",
  xssSanitizer(),
  Auth({ requireAdmin: true }),
  dynamicFileUpload({
    type: "multi",
    tempPath: Path.join("temp", "CTF_Challenges"),
    para: "attachments",
    maxCount: 10,
    randomFileName: false,
    randomPathName: true,
  }),
  updateRandomPath(
    Path.join("public", "CTF", "Challenges"),
    "existingAttachments",
    "title"
  ),
  updateChallenge
);

router.delete(
  "/admin/delete/:ChallengeId",
  Auth({ requireAdmin: true }),
  xssSanitizer(),
  deleteChallenge
);

//User
router.get("/", xssSanitizer(), getallChallenge);
router.get("/progress", xssSanitizer(), Auth(), getProgress);
router.get("/:ChallengeId", xssSanitizer(), Auth(), getChallenge);
router.get("/:ChallengeId/hint/:hintId", xssSanitizer(), Auth(), getHint);
router.post(
  "/:ChallengeId/validateFlag",
  xssSanitizer(),
  Auth(),
  require("../controller/CTF/Challenges/User/validateFlag").validateFlag
);
module.exports = router;
