const jwt = require("jsonwebtoken");
const asyncHandler = require("./asyncHandler");
const User = require("../models/User");

/**
 * protect
 * Verifies the JWT in the Authorization header.
 * Injects req.user (lean user document) on success.
 *
 * Header format expected:
 *   Authorization: Bearer <token>
 */
const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.statusCode = 401;
    throw new Error("Not authenticated — no token provided");
  }

  const token = authHeader.split(" ")[1];

  // Verify and decode
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Fetch user (exclude password); confirm account still exists
  const user = await User.findById(decoded.id).select("-password").lean();

  if (!user) {
    res.statusCode = 401;
    throw new Error("User belonging to this token no longer exists");
  }

  req.user = user;
  next();
});

module.exports = { protect };
