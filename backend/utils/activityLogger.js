const Activity = require("../models/Activity");

/**
 * logActivity
 * Fire-and-forget activity record creation.
 * Intentionally non-blocking — controller response is never delayed by this.
 *
 * @param {string} userId       - The user performing the action
 * @param {string} type         - Must match Activity.type enum
 * @param {string} entityId     - MongoDB ObjectId of the affected document
 * @param {string} entityTitle  - Human-readable label for the feed
 * @param {object} meta         - Optional extra context (stage, mood, etc.)
 */
const logActivity = (userId, type, entityId, entityTitle, meta = {}) => {
  Activity.create({ userId, type, entityId, entityTitle, meta }).catch((err) =>
    console.error("⚠️  Activity log failed:", err.message)
  );
};

module.exports = { logActivity };
