const asyncHandler = require("../middleware/asyncHandler");
const LearningItem = require("../models/LearningItem");
const { logActivity } = require("../utils/activityLogger");
const { getPagination } = require("../utils/pagination");
const { invalidateDashboardCache } = require("./dashboardController");

const getLearningItems = asyncHandler(async (req, res) => {
  const { skip, limit, getPaginationMeta } = getPagination(req.query);
  const { status, category, search } = req.query;

  const filter = { userId: req.user._id, isDeleted: false };
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (search) filter.title = { $regex: search, $options: "i" };

  const [items, total] = await Promise.all([
    LearningItem.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
    LearningItem.countDocuments(filter),
  ]);

  res.json({ success: true, pagination: getPaginationMeta(total), data: items });
});

const getLearningItem = asyncHandler(async (req, res) => {
  const item = await LearningItem.findOne({
    _id: req.params.id, userId: req.user._id, isDeleted: false,
  }).lean();
  if (!item) { res.statusCode = 404; throw new Error("Learning item not found"); }
  res.json({ success: true, data: item });
});

const createLearningItem = asyncHandler(async (req, res) => {
  const { title, category, progress, status, resources, notes, tags } = req.body;
  if (!title) { res.statusCode = 400; throw new Error("Title is required"); }

  const item = await LearningItem.create({
    userId: req.user._id, title, category, progress, status, resources, notes, tags,
  });

  logActivity(req.user._id, "learning_updated", item._id, item.title, { action: "created" });
  invalidateDashboardCache(req.user._id);
  res.status(201).json({ success: true, data: item });
});

const updateLearningItem = asyncHandler(async (req, res) => {
  const item = await LearningItem.findOne({
    _id: req.params.id, userId: req.user._id, isDeleted: false,
  });
  if (!item) { res.statusCode = 404; throw new Error("Learning item not found"); }

  ["title", "category", "progress", "status", "resources", "notes", "tags"].forEach((f) => {
    if (req.body[f] !== undefined) item[f] = req.body[f];
  });

  // Auto-sync status with progress
  if (req.body.progress !== undefined) {
    if (item.progress === 0) item.status = "not-started";
    else if (item.progress === 100) item.status = "completed";
    else item.status = "in-progress";
  }

  await item.save();

  logActivity(req.user._id, "learning_updated", item._id, item.title, {
    progress: item.progress,
  });
  invalidateDashboardCache(req.user._id);
  res.json({ success: true, data: item });
});

const patchProgress = asyncHandler(async (req, res) => {
  const { progress } = req.body;
  if (progress === undefined || progress < 0 || progress > 100) {
    res.statusCode = 400;
    throw new Error("Progress must be a number between 0 and 100");
  }

  const status =
    progress === 0 ? "not-started" : progress === 100 ? "completed" : "in-progress";

  const item = await LearningItem.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id, isDeleted: false },
    { progress, status },
    { new: true }
  );
  if (!item) { res.statusCode = 404; throw new Error("Learning item not found"); }

  logActivity(req.user._id, "learning_updated", item._id, item.title, { progress });
  invalidateDashboardCache(req.user._id);
  res.json({ success: true, data: item });
});

const deleteLearningItem = asyncHandler(async (req, res) => {
  const item = await LearningItem.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!item) { res.statusCode = 404; throw new Error("Learning item not found"); }
  invalidateDashboardCache(req.user._id);
  res.json({ success: true, message: "Learning item deleted" });
});

module.exports = {
  getLearningItems, getLearningItem, createLearningItem,
  updateLearningItem, patchProgress, deleteLearningItem,
};
