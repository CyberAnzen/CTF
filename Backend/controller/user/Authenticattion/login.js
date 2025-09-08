const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const ACCESS_SECRET = process.env.ACCESS_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;
const RefreshToken = require("../../../model/RefreshTokenModel");
const { User } = require("../../../model/UserModel");
exports.login = async (req, res, next) => {
  // console.log(ipAddress, userAgent);
  try {
    const { identifier, password, rememberMe, fp } = req.body;
    const userAgent = req.headers["user-agent"];
    const ipAddress =
      req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;

    if (!fp) return res.status(404).json({ message: "Not Found" });

    // Input validation
    if (!identifier || !password) {
      return res.status(404).json({ message: "Not Found" });
    }
    
    const user = await User.findOne({
      $or: [
        { username: identifier },
        { regNumber: identifier },
        { email: identifier },
        { officialEmail: identifier },
      ],
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const payload = {
      id: user._id,
      username: user.username,
      role: user.userRole,
    };

    const access_token = jwt.sign(payload, ACCESS_SECRET, {
      expiresIn: "15m",
    });
    const refresh_token = jwt.sign(payload, REFRESH_SECRET, {
      expiresIn: rememberMe ? "20d" : "1h",
    });
    await RefreshToken.deleteOne({ userId: user._id, fp });

    await RefreshToken.create({
      token: refresh_token,
      userId: user._id,
      ip: ipAddress,
      ua: userAgent,
      rememberMe,
      fp,
      expiresAt: new Date(
        Date.now() + (rememberMe ? 20 : 1) * 24 * 3600 * 1000
      ),
    });
    res.cookie("refresh_token", refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" ? true : false,
      sameSite: "strict",
      maxAge: rememberMe ? 20 * 24 * 60 * 60 * 1000 : 3600000,
    });

    res.cookie("access_token", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 10 * 365 * 24 * 60 * 60 * 1000, // 10 years
    });

    return res.status(200).json({ message: "Login successful" });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
