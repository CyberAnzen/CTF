const {User} = require('../../../model/UserModel'); // Adjust the path as necessary
const customError = require('../../../utilies/customError');


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



const updateUserDetails = async (req, res) => {
    try {
        const userId = req.user.id; // Assuming user ID is stored in req.user
        if (!userId) {
            throw new customError('User ID is required', 400, {}, `User ID is required`);
        }
        const {  email,section, fullName,dept,regNumber,gender,year,username } = req.body; // Destructure to get the user details
        const userData = await User.findById(userId);
        if (!userData) {
            throw new customError('User not found', 404, { userId }, `User with ID ${userId} not found`);
        }
        if (!fullName || !email || !section || !dept || !regNumber || !year ||!gender) {
            throw new customError('All fields are required', 400, {}, `All fields are required`);
        }
        const updatedData = {};
        if (fullName) updatedData.name =fullName;
        if (email) updatedData.email = email;
        if (section) updatedData.section = section;
        if (dept) updatedData.dept = dept;
        if (regNumber) updatedData.regNumber = regNumber;
        if (year) updatedData.year = year;
        if (gender) updatedData.gender =gender;
        if (username && username !== userData.username) {
            const sanitizedUsername = sanitizeUsername(username);
            if (sanitizedUsername.length < 3) {
                throw new customError('Username must be at least 3 characters long', 400, { username }, `Username must be at least 3 characters long`);
            }
            const existingUser = await checkUsernameInDb(sanitizedUsername);
            if (existingUser) {
                throw new customError('Username is already taken', 400, { username: sanitizedUsername }, `Username ${sanitizedUsername} is already taken`);
            }
            updatedData.username = sanitizedUsername;
           
        }



        const response = await User.findByIdAndUpdate(userId,{
            email: updatedData.email,
            regNumber: updatedData.regNumber,
            username: updatedData.username,
            "userDetails.name": updatedData.name,
            "userDetails.dept": updatedData.dept,
            "userDetails.section": updatedData.section,
            "userDetails.year": updatedData.year,
            "userDetails.gender": updatedData.gender
        }
            , { new: true , runValidators: true });
        
        if (!response) {
            throw new customError('Failed to update user details', 500, {}, `Failed to update user details for user ID ${userId}`);
        }

        return res.status(200).json({
            success: true,
            message: 'User details updated successfully',
        });
    } catch (err) {
        // ---------- Duplicate key (E11000) ----------
    if (err && err.code === 11000) {
      const keyValue = err.keyValue || {};
      const field = Object.keys(keyValue)[0] || "duplicate";
      const value = keyValue[field];

      const friendly = {
        username: "Username already taken",
        email: "Email already registered",
        officialEmail: "Official email already registered",
        phoneNo: "Mobile number already registered",
        regNumber: "Registration number already registered",
        usernameLower: "Username already taken",
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
      return res.status(422).json({
        success: false,
        error: "Validation failed",
        details,
      });
    }

    // ---------- Custom errors ----------
    if (err instanceof customError) {
      console.error('[updateUserDetails] [customError] Error in updateUserDetails:', err.message);
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
        //data: err.data,
      });
    }

    // ---------- Unexpected errors ----------
    console.error('[updateUserDetails] [Error] Error in updateUserDetails:', err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}


module.exports = updateUserDetails;