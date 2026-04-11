const asyncHandler = require("../middleware/asyncHandler");
const Task = require("../models/Task");
const Project = require("../models/Project");
const Habit = require("../models/Habit");
const HabitLog = require("../models/HabitLog");
const JobApplication = require("../models/JobApplication");
const LearningItem = require("../models/LearningItem");
const Activity = require("../models/Activity");
const Budget = require("../models/Budget");
const { normaliseDate } = require("../utils/streakCalculator");

// ── In-memory cache ────────────────────────────────────────────────────────────
// Map<userId:string, { data: object, expiresAt: number }>
const dashboardCache = new Map();
const CACHE_TTL_MS = 30 * 1000; // 30 seconds

const getCached = (userId, dateStr) => {
  const key   = `${userId}:${dateStr}`;
  const entry = dashboardCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    dashboardCache.delete(key);
    return null;
  }
  return entry.data;
};

const setCache = (userId, dateStr, data) => {
  const key = `${userId}:${dateStr}`;
  dashboardCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
};

/**
 * Invalidate a user's dashboard cache.
 * Called externally whenever a mutation should bust stale data.
 * (Optional: cache TTL alone is sufficient for 30s freshness guarantee.)
 */
const invalidateDashboardCache = (userId) => {
  const prefix = String(userId) + ":";
  for (const key of dashboardCache.keys()) {
    if (key.startsWith(prefix)) dashboardCache.delete(key);
  }
};

// ── Controller ─────────────────────────────────────────────────────────────────

/**
 * @desc    Get aggregated dashboard summary
 * @route   GET /api/dashboard
 * @access  Private
 */
const getDashboard = asyncHandler(async (req, res) => {
  const userId    = req.user._id;
  const userIdStr = String(userId);

  // ── Cache hit ──────────────────────────────────────────────────────────────
  const localDateStr = req.query.localDate && /^\d{4}-\d{2}-\d{2}$/.test(req.query.localDate)
    ? req.query.localDate
    : new Date().toISOString().slice(0, 10);

  const cached = getCached(userIdStr, localDateStr);
  if (cached) {
    return res.json({ success: true, cached: true, data: cached });
  }

  // ── Compute today's window using IST midnight boundaries ──────────────────
  // completedDate is stored as midnight IST (= 18:30 UTC previous day) by habitController.
  // The query window must use the same IST midnight boundaries, not UTC midnight.
  const { midnightISTtoUTC } = require("../utils/istUtils");
  const todayMidnight    = midnightISTtoUTC(localDateStr);
  const tomorrowDateStr  = (() => {
    const [y, m, d] = localDateStr.split("-").map(Number);
    const next = new Date(Date.UTC(y, m - 1, d + 1));
    return next.toISOString().slice(0, 10);
  })();
  const tomorrowMidnight = midnightISTtoUTC(tomorrowDateStr);

  const [_y, _m] = localDateStr.split("-").map(Number);
  const startOfMonth = midnightISTtoUTC(`${_y}-${String(_m).padStart(2, "0")}-01`);

  const [
    focusTasks,
    activeProjects,
    habits,
    todayLogs,
    jobStageCounts,
    learningInProgress,
    recentActivity,
    taskStats,
    budgetSummary,
  ] = await Promise.all([
    // Today's high/urgent tasks not yet done
    Task.find({
      userId,
      isDeleted: false,
      status: { $ne: "done" },
      priority: { $in: ["high", "urgent"] },
    })
      .sort({ priority: -1, dueDate: 1 })
      .limit(5)
      .populate("projectId", "title color")
      .lean(),

    // Active projects
    Project.find({ userId, isDeleted: false, status: "active" })
      .sort({ updatedAt: -1 })
      .limit(4)
      .lean(),

    // All active habits with streaks
    Habit.find({ userId, isDeleted: false })
      .sort({ currentStreak: -1 })
      .limit(6)
      .lean(),

    // Today's habit completions
    HabitLog.find({
      userId,
      completedDate: {
        $gte: todayMidnight,
        $lt: tomorrowMidnight,
      },
    })
      .select("habitId")
      .lean(),

    // Job stage breakdown
    JobApplication.aggregate([
      { $match: { userId, isDeleted: false } },
      { $group: { _id: "$stage", count: { $sum: 1 } } },
    ]),

    // In-progress learning items
    LearningItem.find({
      userId,
      isDeleted: false,
      status: "in-progress",
    })
      .sort({ updatedAt: -1 })
      .limit(4)
      .lean(),

    // Last 10 activity events
    Activity.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),

    // Task status breakdown
    Task.aggregate([
      { $match: { userId, isDeleted: false } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),

    // Budget — this month's income vs expense
    Budget.aggregate([
      {
        $match: {
          userId,
          isDeleted: false,
          date: { $gte: startOfMonth },
        },
      },
      { $group: { _id: "$type", total: { $sum: "$amount" } } },
    ]),
  ]);

  // ── Post-process ───────────────────────────────────────────────────────────
  const completedTodaySet = new Set(todayLogs.map((l) => l.habitId.toString()));

  const habitsWithFlag = habits.map((h) => ({
    ...h,
    completedToday: completedTodaySet.has(h._id.toString()),
  }));

  // Normalise job stage counts into a plain object { saved: 2, applied: 5, ... }
  const jobPipeline = jobStageCounts.reduce((acc, { _id, count }) => {
    acc[_id] = count;
    return acc;
  }, {});

  const taskStatusMap = taskStats.reduce((acc, { _id, count }) => {
    acc[_id] = count;
    return acc;
  }, {});

  const budgetIncome  = budgetSummary.find((r) => r._id === "income")?.total  || 0;
  const budgetExpense = budgetSummary.find((r) => r._id === "expense")?.total || 0;

  const dashboardData = {
    greeting: {
      name: req.user.name,
      date: new Date().toISOString(),
    },
    focusTasks,
    activeProjects,
    habits: habitsWithFlag,
    jobPipeline,
    learningInProgress,
    recentActivity,
    taskStats: taskStatusMap,
    budget: {
      income: budgetIncome,
      expense: budgetExpense,
      balance: budgetIncome - budgetExpense,
    },
  };

  // ── Cache and respond ──────────────────────────────────────────────────────
  setCache(userIdStr, localDateStr, dashboardData);

  res.json({ success: true, cached: false, data: dashboardData });
});

module.exports = { getDashboard, invalidateDashboardCache };