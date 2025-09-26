const csrf = require("csurf");

const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none", // Use Strict for better CSRF protection
  },
});

module.exports = csrfProtection;
