// controllers/user/checkusername.js
const { User } = require("../../../model/UserModel");

// sanitize input
function sanitizeUsername(raw) {
  if (!raw || typeof raw !== "string") return "";
  return raw.trim();
}

// escape user input for safe regex usage
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function checkUsernameInDb(username) {
  const unameLower = username.toLowerCase();

  // 1) If you added usernameLower in schema (recommended), do a fast index lookup
  if (User.schema.path("usernameLower")) {
    return await User.findOne({ usernameLower: unameLower })
      .select("_id")
      .lean();
  }

  // 2) Otherwise try collation (case-insensitive exact match) - fast if index/collation exists
  try {
    return await User.findOne({ username: username })
      .collation({ locale: "en", strength: 2 })
      .select("_id")
      .lean();
  } catch (err) {
    // 3) Fallback to a safe anchored regex search (slower, but safe)
    const escaped = escapeRegex(username);
    return await User.findOne({
      username: { $regex: `^${escaped}$`, $options: "i" },
    })
      .select("_id")
      .lean();
  }
}

exports.checkusername = async (req, res) => {
  try {
    const raw = req.query.username;
    const username = sanitizeUsername(raw);

    if (!username || username.length < 3) {
      return res
        .status(400)
        .json({
          error: "Username is required and must be at least 3 characters",
        });
    }

    // Query DB
    const user = await checkUsernameInDb(username);

    // available = true when NOT found
    const available = !user;

    return res.json({ available });
  } catch (error) {
    console.error("checkusername error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};
