const jwt = require("jsonwebtoken");
const asyncHandler = require("../middleware/asyncHandler");
const User = require("../models/User");

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * signToken — creates a signed JWT for a given user id
 */
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

/**
 * sendAuthResponse
 * Unified helper: signs token and sends user + token in response.
 */
const sendAuthResponse = (user, statusCode, res) => {
  const token = signToken(user._id);

  res.status(statusCode).json({
    success: true,
    token,
    user: user.toPublicJSON(),
  });
};

// ── Controllers ────────────────────────────────────────────────────────────────

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.statusCode = 400;
    throw new Error("Please provide name, email, and password");
  }

  // Check duplicate email
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.statusCode = 409;
    throw new Error("An account with this email already exists");
  }

  const user = await User.create({ name, email, password });
  sendAuthResponse(user, 201, res);
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.statusCode = 400;
    throw new Error("Please provide email and password");
  }

  // Explicitly select password (it has select: false on schema)
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password"
  );

  if (!user || !(await user.comparePassword(password))) {
    res.statusCode = 401;
    throw new Error("Invalid email or password");
  }

  sendAuthResponse(user, 200, res);
});

/**
 * @desc    Get currently authenticated user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  // req.user is injected by the protect middleware
  const user = await User.findById(req.user._id);

  if (!user) {
    res.statusCode = 404;
    throw new Error("User not found");
  }

  res.json({
    success: true,
    user: user.toPublicJSON(),
  });
});

/**
 * @desc    Update profile (name, avatar, timezone)
 * @route   PATCH /api/auth/me
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ["name", "avatar", "timezone"];
  const updates = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  if (Object.keys(updates).length === 0) {
    res.statusCode = 400;
    throw new Error("No valid fields provided for update");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    user: user.toPublicJSON(),
  });
});

/**
 * @desc    Change password
 * @route   PATCH /api/auth/change-password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.statusCode = 400;
    throw new Error("Please provide currentPassword and newPassword");
  }

  if (newPassword.length < 6) {
    res.statusCode = 422;
    throw new Error("New password must be at least 6 characters");
  }

  const user = await User.findById(req.user._id).select("+password");

  if (!(await user.comparePassword(currentPassword))) {
    res.statusCode = 401;
    throw new Error("Current password is incorrect");
  }

  user.password = newPassword;
  await user.save(); // triggers bcrypt pre-save hook

  sendAuthResponse(user, 200, res);
});

module.exports = { register, login, getMe, updateProfile, changePassword };
