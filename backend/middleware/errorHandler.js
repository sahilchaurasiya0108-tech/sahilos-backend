/**
 * errorHandler
 * Central Express error-handling middleware.
 * Must be registered LAST (after all routes).
 *
 * Handles:
 *  - Mongoose CastError (bad ObjectId)
 *  - Mongoose ValidationError
 *  - Mongoose duplicate key (code 11000)
 *  - JWT errors
 *  - Generic errors
 */

const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // ── Mongoose: Bad ObjectId ─────────────────────────────────────────────────
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // ── Mongoose: Validation errors ────────────────────────────────────────────
  if (err.name === "ValidationError") {
    statusCode = 422;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  // ── Mongoose: Duplicate key ────────────────────────────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    statusCode = 409;
    message = `${field} already exists`;
  }

  // ── JWT: Invalid token ─────────────────────────────────────────────────────
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }

  // ── JWT: Expired token ─────────────────────────────────────────────────────
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired — please log in again";
  }

  // ── Development: include stack trace ──────────────────────────────────────
  const response = {
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
