const asyncHandler = require("../middleware/asyncHandler");
const Activity = require("../models/Activity");
const { getPagination } = require("../utils/pagination");

/**
 * @desc    Get activity feed for current user (paginated, newest first)
 * @route   GET /api/activity
 * @access  Private
 */
const getActivity = asyncHandler(async (req, res) => {
  const { skip, limit, getPaginationMeta } = getPagination(req.query);
  const { type } = req.query;

  const filter = { userId: req.user._id };
  if (type) filter.type = type;

  const [activities, total] = await Promise.all([
    Activity.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Activity.countDocuments(filter),
  ]);

  res.json({
    success: true,
    pagination: getPaginationMeta(total),
    data: activities,
  });
});

module.exports = { getActivity };
