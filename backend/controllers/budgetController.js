const asyncHandler = require("../middleware/asyncHandler");
const Budget = require("../models/Budget");
const { getPagination } = require("../utils/pagination");
const { invalidateDashboardCache } = require("./dashboardController");
const { notifyBudgetWarning } = require("../utils/notificationService");

// ── Budget warning thresholds (% of monthly spend per category) ───────────────
const WARN_THRESHOLDS = { food: 5000, transport: 3000, entertainment: 3000, shopping: 5000, other: 10000 };

async function checkBudgetWarning(userId, category, type) {
  if (type !== "expense") return;
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const result = await Budget.aggregate([
      { $match: { userId, type: "expense", category, isDeleted: false, date: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const total = result[0]?.total || 0;
    const threshold = WARN_THRESHOLDS[category] || WARN_THRESHOLDS.other;
    const pct = Math.round((total / threshold) * 100);
    if (pct >= 80) {
      notifyBudgetWarning(userId, category, pct);
    }
  } catch (_) {}
}

/**
 * @desc    Get all budget entries (paginated, filterable)
 * @route   GET /api/budget
 * @access  Private
 */
const getBudgetEntries = asyncHandler(async (req, res) => {
  const { skip, limit, getPaginationMeta } = getPagination(req.query);
  const { type, category, month } = req.query;

  const filter = { userId: req.user._id, isDeleted: false };
  if (type) filter.type = type;
  if (category) filter.category = category;

  // Filter by month: ?month=2025-01
  if (month) {
    const [year, mon] = month.split("-").map(Number);
    filter.date = {
      $gte: new Date(year, mon - 1, 1),
      $lt:  new Date(year, mon, 1),
    };
  }

  const [entries, total] = await Promise.all([
    Budget.find(filter).sort({ date: -1 }).skip(skip).limit(limit).lean(),
    Budget.countDocuments(filter),
  ]);

  res.json({
    success: true,
    pagination: getPaginationMeta(total),
    data: entries,
  });
});

/**
 * @desc    Get summary totals (income, expense, balance) — optionally filtered by month
 * @route   GET /api/budget/summary
 * @access  Private
 */
const getBudgetSummary = asyncHandler(async (req, res) => {
  const { month } = req.query;
  const filter = { userId: req.user._id, isDeleted: false };

  if (month) {
    const [year, mon] = month.split("-").map(Number);
    filter.date = {
      $gte: new Date(year, mon - 1, 1),
      $lt:  new Date(year, mon, 1),
    };
  }

  const result = await Budget.aggregate([
    { $match: filter },
    {
      $group: {
        _id: "$type",
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ]);

  const income  = result.find((r) => r._id === "income")?.total  || 0;
  const expense = result.find((r) => r._id === "expense")?.total || 0;

  // Category breakdown for expense chart
  const categoryBreakdown = await Budget.aggregate([
    { $match: { ...filter, type: "expense" } },
    { $group: { _id: "$category", total: { $sum: "$amount" } } },
    { $sort: { total: -1 } },
  ]);

  res.json({
    success: true,
    data: {
      income,
      expense,
      balance: income - expense,
      categoryBreakdown,
    },
  });
});

/**
 * @desc    Create budget entry
 * @route   POST /api/budget
 * @access  Private
 */
const createBudgetEntry = asyncHandler(async (req, res) => {
  const { title, amount, type, category, date, notes } = req.body;

  if (!title || amount === undefined || !type) {
    res.statusCode = 400;
    throw new Error("Title, amount, and type are required");
  }

  const entry = await Budget.create({
    userId: req.user._id,
    title,
    amount: Number(amount),
    type,
    category: category || "other",
    date: date ? new Date(date) : new Date(),
    notes,
  });

  invalidateDashboardCache(req.user._id);
  checkBudgetWarning(req.user._id, entry.category, entry.type);
  res.status(201).json({ success: true, data: entry });
});

/**
 * @desc    Update budget entry
 * @route   PUT /api/budget/:id
 * @access  Private
 */
const updateBudgetEntry = asyncHandler(async (req, res) => {
  const entry = await Budget.findOne({
    _id: req.params.id,
    userId: req.user._id,
    isDeleted: false,
  });

  if (!entry) {
    res.statusCode = 404;
    throw new Error("Budget entry not found");
  }

  ["title", "amount", "type", "category", "date", "notes"].forEach((f) => {
    if (req.body[f] !== undefined) entry[f] = req.body[f];
  });

  await entry.save();
  invalidateDashboardCache(req.user._id);
  res.json({ success: true, data: entry });
});

/**
 * @desc    Soft delete budget entry
 * @route   DELETE /api/budget/:id
 * @access  Private
 */
const deleteBudgetEntry = asyncHandler(async (req, res) => {
  const entry = await Budget.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );

  if (!entry) {
    res.statusCode = 404;
    throw new Error("Budget entry not found");
  }

  invalidateDashboardCache(req.user._id);
  res.json({ success: true, message: "Budget entry deleted" });
});

module.exports = {
  getBudgetEntries,
  getBudgetSummary,
  createBudgetEntry,
  updateBudgetEntry,
  deleteBudgetEntry,
};
