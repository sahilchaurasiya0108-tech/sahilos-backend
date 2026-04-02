const User = require("../models/User");

/**
 * trackActivity
 * Updates user's lastActiveAt timestamp on every authenticated request.
 * Fire-and-forget — never blocks the response.
 * Must be used AFTER the protect middleware.
 */
const trackActivity = (req, _res, next) => {
  if (req.user?._id) {
    User.findByIdAndUpdate(req.user._id, { lastActiveAt: new Date() }).catch(() => {});
  }
  next();
};

module.exports = { trackActivity };
