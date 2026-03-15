const asyncHandler = require("../middleware/asyncHandler");
const Idea = require("../models/Idea");
const Project = require("../models/Project");
const { logActivity } = require("../utils/activityLogger");
const { getPagination } = require("../utils/pagination");

const getIdeas = asyncHandler(async (req, res) => {
  const { skip, limit, getPaginationMeta } = getPagination(req.query);
  const { status, tag, search } = req.query;

  const filter = { userId: req.user._id, isDeleted: false };
  if (status) filter.status = status;
  if (tag) filter.tags = { $in: [tag] };
  if (search) filter.title = { $regex: search, $options: "i" };

  const [ideas, total] = await Promise.all([
    Idea.find(filter)
      .sort({ rating: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Idea.countDocuments(filter),
  ]);

  res.json({ success: true, pagination: getPaginationMeta(total), data: ideas });
});

const getIdea = asyncHandler(async (req, res) => {
  const idea = await Idea.findOne({
    _id: req.params.id,
    userId: req.user._id,
    isDeleted: false,
  }).lean();

  if (!idea) { res.statusCode = 404; throw new Error("Idea not found"); }
  res.json({ success: true, data: idea });
});

const createIdea = asyncHandler(async (req, res) => {
  const { title, description, tags, rating } = req.body;
  if (!title) { res.statusCode = 400; throw new Error("Idea title is required"); }

  const idea = await Idea.create({
    userId: req.user._id, title, description, tags, rating,
  });

  logActivity(req.user._id, "idea_saved", idea._id, idea.title);
  res.status(201).json({ success: true, data: idea });
});

const updateIdea = asyncHandler(async (req, res) => {
  const idea = await Idea.findOne({
    _id: req.params.id, userId: req.user._id, isDeleted: false,
  });
  if (!idea) { res.statusCode = 404; throw new Error("Idea not found"); }

  ["title", "description", "tags", "rating", "status"].forEach((f) => {
    if (req.body[f] !== undefined) idea[f] = req.body[f];
  });

  await idea.save();
  res.json({ success: true, data: idea });
});

/**
 * @desc    Convert idea into a new Project
 * @route   POST /api/ideas/:id/convert
 * @access  Private
 */
const convertToProject = asyncHandler(async (req, res) => {
  const idea = await Idea.findOne({
    _id: req.params.id, userId: req.user._id, isDeleted: false,
  });
  if (!idea) { res.statusCode = 404; throw new Error("Idea not found"); }
  if (idea.status === "converted") {
    res.statusCode = 400;
    throw new Error("Idea has already been converted to a project");
  }

  const project = await Project.create({
    userId: req.user._id,
    title: idea.title,
    description: idea.description,
    status: "active",
  });

  idea.status = "converted";
  idea.convertedProjectId = project._id;
  await idea.save();

  logActivity(req.user._id, "project_created", project._id, project.title, {
    fromIdea: idea._id,
  });

  res.status(201).json({ success: true, data: { idea, project } });
});

const deleteIdea = asyncHandler(async (req, res) => {
  const idea = await Idea.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!idea) { res.statusCode = 404; throw new Error("Idea not found"); }
  res.json({ success: true, message: "Idea deleted" });
});

module.exports = { getIdeas, getIdea, createIdea, updateIdea, convertToProject, deleteIdea };
