/**
 * asyncHandler
 * Wraps an async controller function and forwards any thrown errors
 * to Express's next(err) — eliminating repetitive try/catch blocks.
 *
 * Usage:
 *   router.get('/', asyncHandler(async (req, res) => { ... }));
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
