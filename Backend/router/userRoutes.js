const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { Auth } = require("../middleware/Auth");
// Importing the user controllers
const userManager = require("../controller/manager/userManager");
const { TimeStamp } = require("../middleware/TimeStamp");
// Importing the OTP controllers
const OtpManager = require("../controller/manager/OtpManager");
const xssSanitizer = require("../middleware/xssSanitizer");
// IMPORTANT: import the middleware with the middleware signature (req,res,next)
const { requireTurnstile } = require("../middleware/VerifyTurnStile");

// -------------------- Rate limiters (standardized / updated) --------------------

// Signup: 5 attempts per hour (unchanged)
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 25,
  message:
    "Too many signup attempts from this IP, please try again after 1 hour",
  standardHeaders: true,
  legacyHeaders: false,
});

// Login: stricter window to reduce brute force (10 attempts per 15 minutes)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 25,
  message:
    "Too many login attempts from this IP, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});

// Username check: allow more frequent checks but still limited (100 per hour)
const checkUsernameLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 200,
  message: "Too many username check requests, please try again after 1 hour",
  standardHeaders: true,
  legacyHeaders: false,
});

// Email sending: reduce allowed attempts (6 per hour)
const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 6,
  message:
    "Too many email requests from this IP, please try again after 1 hour",
  standardHeaders: true,
  legacyHeaders: false,
});

// OTP generation (forgot password): 5 per hour
const otpGeneratorLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: "Too many forgot password attempts, please try again after 1 hour",
  standardHeaders: true,
  legacyHeaders: false,
});

// OTP verification: 10 per hour
const otpVerifyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: "Too many OTP verification attempts, please try again after 1 hour",
  standardHeaders: true,
  legacyHeaders: false,
});

// Password reset attempts: 5 per hour
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: "Too many password reset attempts, please try again after 1 hour",
  standardHeaders: true,
  legacyHeaders: false,
});

// -------------------- Route definitions --------------------
router.get("/logout", userManager.logout);

// Compose a single middleware chain for login (keeps router clean)
const loginOnly = [
  TimeStamp(2),
  loginLimiter,
  xssSanitizer(),
  // requireTurnstile, // verifies Turnstile token, calls next() on success
];

// Routes with applied rate limiters
router.post(
  "/signup",
  TimeStamp(2),
  // signupLimiter,
  xssSanitizer(),
  // requireTurnstile, // verifies Turnstile token, calls next() on success
  userManager.signup
);

router.post("/login", ...loginOnly, userManager.login);

router.get(
  "/check-username",
  TimeStamp(2),
  checkUsernameLimiter,
  xssSanitizer(),
  userManager.checkusername
);

//router.post("/send-email", emailLimiter, SMTP);
// router.post(
//   "/forgot-password",
//   TimeStamp(2),
//   otpGeneratorLimiter,
//   xssSanitizer(),
//   OtpManager.OtpGenerator
// );
// router.post(
//   "/verify-otp",
//   TimeStamp(2),
//   otpVerifyLimiter,
//   xssSanitizer(),
//   OtpManager.OtpVerification
// );
// router.post(
//   "/reset-password",
//   TimeStamp(2),
//   passwordResetLimiter,
//   xssSanitizer(),
//   userManager.PasswordReset
// );

module.exports = router;
