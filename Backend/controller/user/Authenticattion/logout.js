exports.logout = (req, res) => {
  // Clear the token cookie
  res.cookie("access_token", "", {
    expires: new Date(0),
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" ? true : false,
    sameSite: "none",
  });

  // Clear the rememberMe cookie
  res.cookie("refresh_token", "", {
    expires: new Date(0),
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" ? true : false,
    sameSite: "none",
  });
  // Clear the CSRF token
  res.cookie("_csrf", "", {
    expires: new Date(0),
    path: "/",
    httpOnly: false, // CSRF tokens are usually accessible by JS
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
  });

  return res.status(200).json({ message: "Logout successful" });
};
