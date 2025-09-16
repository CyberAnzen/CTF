const CTF_challenges = require("../../../../model/CTFchallengeModel");
const customError = require("../../../../utilies/customError");
const Path = require("path");
const fs = require("fs");
const { User } = require("../../../../model/UserModel");

exports.CreateChallenges = async (req, res) => {
  let attachments = []; // define here to ensure it's in scope for the catch block
  try {
    const userId = req.user.id;
    let Author ="Anonymous hacker from cyberayans"; // fallback

    try {
        const user = await User.findById(userId).select("userDetails.name").lean();
        Author = user?.userDetails?.name || "Anonymous hacker from cyberayans"; // fallback
     }catch(err){
        Author ="Anonymous hacker from cyberayans"; // fallback
    }
   
    const {
      title,
      description,
      score,
      category,

      //attachments,
      flag,
      difficulty,
    } = req.body;
    const pathName = req.customFileUpload.randomPathName;
    attachments = (req.files || []).map((f) => {
      const filePath = Path.join(pathName, f.filename);
      return filePath.replace(/\\/g, "/").replace(/^public\//, "");
    });
    // 1) Validate required fields
    // validate the files name for the attachments
    if (!attachments || !Array.isArray(attachments)) {
      return res.status(400).json({ message: "attachments must be an array" });
    }
    // 2) Tags come in as either a string or an array of strings
    //    Because you did `formData.append("tags", tag)` for each tag,
    //    multer will expose req.body.tags as an array if >1, or a string if just 1.
    let tags = req.body.tags || [];
    if (typeof tags === "string") {
      tags = [tags];
    }

    // 3) Hints arrives as a JSON string: '[{"text":"foo","cost":123}, …]'
    let hints = [];
    if (req.body.hints) {
      try {
        hints = JSON.parse(req.body.hints);
        if (!Array.isArray(hints)) {
          return res
            .status(400)
            .json({ message: "hints must be a JSON array" });
        }
      } catch (err) {
        return res.status(400).json({ message: "Invalid hints JSON" });
      }
    }

    // 6) create & save
    payload = {
      title,
      description,
      score,
      category,
      tags,
      hints,
      attachments,
      flag,
      difficulty,
      Author,
    };
    const Challenge = await CTF_challenges.create(payload);
    if (!Challenge) {
      return res.status(500).json({ message: "Failed to create Challenge" });
    }

    // 7) respond
    res
      .status(200)
      .json({ message: "Challenge created successfully", Challenge });
  } catch (error) {
    console.error("Challenge creation error:", error);

    try {
      attachments.forEach((filePath) => {
        const fullPath = Path.join(process.cwd(), "public",filePath);
        console.log(`Attempting to delete file: ${fullPath}`);

        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          console.log(`Deleted file: ${fullPath}`);
        } else {
          console.warn(`File not found for deletion: ${fullPath}`);
        }
      });
    } catch (error) {
      throw new customError(
        "Error deleting ctf challemges: ",
        500,
        {},
        error.message
      );
    }
     // ---------- Duplicate key (E11000) ----------
    if (error && error.code === 11000) {
      const keyValue = error.keyValue || {};
      const field = Object.keys(keyValue)[0] || "duplicate";
      const value = keyValue[field];

      const friendly = {
        title: "Challenge title must be unique",
        challengeNumber: "Challenge number already exists",
      };

      const message = friendly[field] || `${field} already exists`;

      return res.status(409).json({
        success: false,
        error: "Duplicate",
        field,
        value,
        message,
      });
    }

    // ---------- Mongoose validation errors ----------
    if (error && error.name === "ValidationError" && error.errors) {
      const details = Object.keys(err.errors).map((k) => {
        const e = error.errors[k];
        return {
          field: k,
          message: e.message,
          kind: e.kind,
          path: e.path,
        };
      });
      return res.status(422).json({
        success: false,
        error: "Validation failed",
        details,
      });
    }

    if (process.env.NODE_ENV !== "production") {
      return res
        .status(500)
        .json({ message: "Internal server error", error: error.message });
    }
    return res.status(400).json({ message: "Challenge Not Created" });
  }
};
