const asyncHandler = require("../middleware/asyncHandler");
const Knowledge = require("../models/Knowledge");
const { logActivity } = require("../utils/activityLogger");
const { getPagination } = require("../utils/pagination");
const { evaluateAchievements } = require("../utils/achievementEngine");

const getCounts = asyncHandler(async (req, res) => {
  const base = { userId: req.user._id, isDeleted: false };
  const [total, grouped, favouriteCount] = await Promise.all([
    Knowledge.countDocuments(base),
    Knowledge.aggregate([
      { $match: base },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]),
    Knowledge.countDocuments({ ...base, isFavourite: true }),
  ]);
  const counts = grouped.reduce((acc, { _id, count }) => { acc[_id] = count; return acc; }, {});
  res.json({ success: true, data: { total, counts, favouriteCount } });
});

const getEntries = asyncHandler(async (req, res) => {
  const { skip, limit, getPaginationMeta } = getPagination(req.query);
  const { category, search, tag, favourites } = req.query;

  const filter = { userId: req.user._id, isDeleted: false };
  if (category)          filter.category = category;
  if (tag)               filter.tags = { $in: [tag] };
  if (favourites === "1") filter.isFavourite = true;
  if (search)            filter.$or = [
    { title:   { $regex: search, $options: "i" } },
    { content: { $regex: search, $options: "i" } },
    { tags:    { $in: [new RegExp(search, "i")] } },
  ];

  const [entries, total] = await Promise.all([
    Knowledge.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Knowledge.countDocuments(filter),
  ]);

  res.json({ success: true, pagination: getPaginationMeta(total), data: entries });
});

const getEntry = asyncHandler(async (req, res) => {
  const entry = await Knowledge.findOne({
    _id: req.params.id, userId: req.user._id, isDeleted: false,
  }).lean();
  if (!entry) { res.statusCode = 404; throw new Error("Entry not found"); }
  res.json({ success: true, data: entry });
});

const createEntry = asyncHandler(async (req, res) => {
  const { title, category, content, tags, author, rating, status, isFavourite, cardStyle } = req.body;
  if (!title || !category) {
    res.statusCode = 400;
    throw new Error("Title and category are required");
  }

  const entry = await Knowledge.create({
    userId: req.user._id,
    title, category, content,
    tags: tags || [],
    author, rating, status,
    isFavourite: isFavourite || false,
    cardStyle: cardStyle || {},
  });

  logActivity(req.user._id, "knowledge_added", entry._id, entry.title, { category });
  evaluateAchievements(req.user._id);
  res.status(201).json({ success: true, data: entry });
});

const updateEntry = asyncHandler(async (req, res) => {
  const entry = await Knowledge.findOne({
    _id: req.params.id, userId: req.user._id, isDeleted: false,
  });
  if (!entry) { res.statusCode = 404; throw new Error("Entry not found"); }

  ["title", "category", "content", "tags", "author", "rating", "status", "isFavourite"].forEach((f) => {
    if (req.body[f] !== undefined) entry[f] = req.body[f];
  });

  // Merge cardStyle sub-fields instead of replacing the whole object
  if (req.body.cardStyle && typeof req.body.cardStyle === "object") {
    entry.cardStyle = { ...((entry.cardStyle || {}).toObject?.() ?? entry.cardStyle ?? {}), ...req.body.cardStyle };
  }

  await entry.save();
  res.json({ success: true, data: entry });
});

// Dedicated favourite toggle — PATCH /knowledge/:id/favourite
const toggleFavourite = asyncHandler(async (req, res) => {
  const entry = await Knowledge.findOne({
    _id: req.params.id, userId: req.user._id, isDeleted: false,
  });
  if (!entry) { res.statusCode = 404; throw new Error("Entry not found"); }

  entry.isFavourite = !entry.isFavourite;
  await entry.save();
  res.json({ success: true, data: { isFavourite: entry.isFavourite } });
});

const deleteEntry = asyncHandler(async (req, res) => {
  const entry = await Knowledge.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!entry) { res.statusCode = 404; throw new Error("Entry not found"); }
  res.json({ success: true, message: "Entry deleted" });
});

module.exports = { getCounts, getEntries, getEntry, createEntry, updateEntry, deleteEntry, toggleFavourite };