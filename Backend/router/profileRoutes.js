const express = require("express");
const router = express.Router();
const { Auth } = require("../middleware/Auth");
const xssSanitizer = require("../middleware/xssSanitizer");
/* const fileUploader = require('../utilies/FileUploder')
const upload = fileUploader("temp/uploads/images", 
    { allowedTypes: ['image/jpeg', 'image/png', 'image/webp'], 
    maxSize: 5 * 1024 * 1024 }
) */

const getProfile = require("../controller/user/profile/getProfile");
//const updateLink = require("../controller/user/profile/links/updateLink");
//const updateSkill = require("../controller/user/profile/skills/updateSkill");
const updateUserDetails = require("../controller/user/profile/updateUserDetails");
//const createAvator = require("../controller/user/profile/avator/createAvator");
//const checkRegNo = require("../controller/user/profile/checkRegNo");
//const updateAvator = require("../controller/user/profile/avator/updateAvator");
//const getAllDefaultAvator = require("../controller/user/profile/avator/getAllDefaultAvator");

router.get("/data", Auth(), xssSanitizer(), getProfile);
// router.post("/links", Auth(),xssSanitizer(),updateLink);
// router.post("/skills", Auth(),xssSanitizer(), updateSkill);
router.post("/update", Auth(), xssSanitizer(), updateUserDetails);
/* router.post("/avator/create", 
    upload.single("image"), 
    createAvator
); */
// router.get("/checkRegNo",Auth(),xssSanitizer(), checkRegNo);
// router.post("/avator/update",Auth(),xssSanitizer(), updateAvator);
// router.get("/avator/default" ,Auth(), xssSanitizer(), getAllDefaultAvator);

module.exports = router;
