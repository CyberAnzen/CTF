// controllers/auth/signup.js
const bcrypt = require("bcryptjs");
const { User } = require("../../../model/UserModel");

// minimal required fields list (flat names we accept from frontend)
const REQUIRED = [
  "username",
  "password",
  "fullName",
  "dept",
  "email",
  "officialEmail",
  "mobile",
  "regNumber",
  "section",
  "year",
  "gender",
];

// helper: find missing or empty fields (works with nested userDetails too)
function findMissingFields(obj) {
  const missing = [];
  for (const k of REQUIRED) {
    // accept nested userDetails fields too (frontend may send either flat or nested)
    const flat = obj[k];
    const nested =
      obj.userDetails && obj.userDetails[k === "fullName" ? "name" : k];
    if (
      flat === undefined ||
      flat === null ||
      (typeof flat === "string" && flat.trim() === "") ||
      (flat === "" && flat !== 0 && flat !== false) // treat empty string as missing
    ) {
      if (
        nested === undefined ||
        nested === null ||
        (typeof nested === "string" && nested.trim() === "")
      ) {
        missing.push(k);
      }
    }
  }
  return missing;
}

// helper: build info object expected by your schema (normalize nested/flat)
function buildInfoFromBody(body, hashedPassword) {
  const {
    username,
    email,
    officialEmail,
    fullName,
    regNumber,
    dept,
    section,
    year,
    gender,
    mobile,
    phoneNo,
  } = body;

  // prefer top-level mobile then phoneNo
  const phone = mobile ?? phoneNo;

  const userDetails = body.userDetails || {
    name: fullName,
    dept,
    section,
    gender,
    year,
  };

  return {
    username,
    password: hashedPassword,
    phoneNo: Number(phone),
    email,
    regNumber,
    officialEmail,
    userDetails,
  };
}

// Hash helper (you can reduce saltRounds during load-testing)
async function hashPassword(password) {
  const saltRounds = process.env.NODE_ENV === "test" ? 8 : 10;
  return bcrypt.hash(password, saltRounds);
}

exports.signup = async (req, res) => {
  try {
    // quick missing fields check BEFORE hashing
    const missing = findMissingFields(req.body);
    if (missing.length > 0) {
      return res
        .status(400)
        .json({ error: "Missing fields", missingFields: missing });
    }

    // optional: extra sanity checks
    if (req.body.password !== req.body.confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    // hash password (after basic validation)
    const hashed = await hashPassword(req.body.password);

    // build user doc (normalized)
    const info = buildInfoFromBody(req.body, hashed);

    // create user
    const user = await User.create(info);

    return res
      .status(201)
      .json({ message: "User created", username: user.username });
  } catch (err) {
    // ---------- Duplicate key (E11000) ----------
    // err.keyValue is the most reliable to fetch offending field/value
    // Example err.keyValue -> { email: "a@b.com" } or { phoneNo: 9123456789 }
    if (err && err.code === 11000) {
      const keyValue = err.keyValue || {};
      const field = Object.keys(keyValue)[0] || "duplicate";
      const value = keyValue[field];

      // friendly message mapping (you can expand)
      const friendly = {
        username: "Username already taken",
        email: "Email already registered",
        officialEmail: "Official email already registered",
        phoneNo: "Mobile number already registered",
        regNumber: "Registration number already registered",
        usernameLower: "Username already taken", // in case you use normalized field
      };

      const message = friendly[field] || `${field} already exists`;

      return res.status(409).json({
        error: "Duplicate",
        field,
        value,
        message,
      });
    }

    // ---------- Mongoose validation errors ----------
    // err.errors contains field-specific ValidatorError objects
    if (err && err.name === "ValidationError" && err.errors) {
      const details = Object.keys(err.errors).map((k) => {
        const e = err.errors[k];
        return {
          field: k,
          message: e.message,
          kind: e.kind,
          path: e.path,
        };
      });
      return res.status(422).json({ error: "Validation failed", details });
    }

    // unexpected
    console.error("Signup error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
