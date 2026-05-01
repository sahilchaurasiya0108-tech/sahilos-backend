const asyncHandler = require("../middleware/asyncHandler");
const Project = require("../models/Project");
const Task = require("../models/Task");
const { logActivity } = require("../utils/activityLogger");
const { getPagination } = require("../utils/pagination");
const { invalidateDashboardCache } = require("./dashboardController");

/**
 * Recalculate project progress based on milestone completion.
 * Falls back to 0 if no milestones exist.
 */
const recalcProgress = (milestones) => {
  if (!milestones || milestones.length === 0) return 0;
  const done = milestones.filter((m) => m.done).length;
  return Math.round((done / milestones.length) * 100);
};

/**
 * @desc    Get all projects (paginated)
 * @route   GET /api/projects
 * @access  Private
 */
const getProjects = asyncHandler(async (req, res) => {
  const { skip, limit, getPaginationMeta } = getPagination(req.query);
  const { status, search } = req.query;

  const filter = { userId: req.user._id, isDeleted: false };
  if (status) filter.status = status;
  if (search) filter.title = { $regex: search, $options: "i" };
  if (req.query.category) filter.categories = req.query.category;

  const [projects, total] = await Promise.all([
    Project.find(filter).sort({ pinned: -1, pinOrder: 1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    Project.countDocuments(filter),
  ]);

  res.json({
    success: true,
    pagination: getPaginationMeta(total),
    data: projects,
  });
});

/**
 * @desc    Get single project with linked task summary
 * @route   GET /api/projects/:id
 * @access  Private
 */
const getProject = asyncHandler(async (req, res) => {
  const project = await Project.findOne({
    _id: req.params.id,
    userId: req.user._id,
    isDeleted: false,
  }).lean();

  if (!project) {
    res.statusCode = 404;
    throw new Error("Project not found");
  }

  // Attach linked task stats
  const taskStats = await Task.aggregate([
    {
      $match: {
        projectId: project._id,
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  res.json({ success: true, data: { ...project, taskStats } });
});

/**
 * @desc    Create project
 * @route   POST /api/projects
 * @access  Private
 */
const createProject = asyncHandler(async (req, res) => {
  const { title, description, status, repoLink, liveUrl, milestones, notes, color, categories } = req.body;

  if (!title) {
    res.statusCode = 400;
    throw new Error("Project title is required");
  }

  const project = await Project.create({
    userId: req.user._id,
    title, description, status, repoLink, liveUrl,
    milestones: milestones || [],
    notes, color,
    categories: categories || [],
    progress: recalcProgress(milestones),
  });

  logActivity(req.user._id, "project_created", project._id, project.title);
  invalidateDashboardCache(req.user._id);
  res.status(201).json({ success: true, data: project });
});

/**
 * @desc    Update project
 * @route   PUT /api/projects/:id
 * @access  Private
 */
const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findOne({
    _id: req.params.id,
    userId: req.user._id,
    isDeleted: false,
  });

  if (!project) {
    res.statusCode = 404;
    throw new Error("Project not found");
  }

  const allowedFields = [
    "title", "description", "status", "repoLink", "liveUrl",
    "milestones", "notes", "color", "categories",
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) project[field] = req.body[field];
  });

  // Auto-recalculate progress whenever milestones change
  if (req.body.milestones !== undefined) {
    project.progress = recalcProgress(project.milestones);
  }

  await project.save();

  logActivity(req.user._id, "project_updated", project._id, project.title);
  invalidateDashboardCache(req.user._id);
  res.json({ success: true, data: project });
});

/**
 * @desc    Toggle a single milestone's done state
 * @route   PATCH /api/projects/:id/milestones/:milestoneId
 * @access  Private
 */
const toggleMilestone = asyncHandler(async (req, res) => {
  const project = await Project.findOne({
    _id: req.params.id,
    userId: req.user._id,
    isDeleted: false,
  });

  if (!project) {
    res.statusCode = 404;
    throw new Error("Project not found");
  }

  const milestone = project.milestones.id(req.params.milestoneId);
  if (!milestone) {
    res.statusCode = 404;
    throw new Error("Milestone not found");
  }

  milestone.done = !milestone.done;
  project.progress = recalcProgress(project.milestones);

  await project.save();

  logActivity(req.user._id, "project_updated", project._id, project.title, {
    milestone: milestone.title,
    done: milestone.done,
  });

  res.json({ success: true, data: project });
});

/**
 * @desc    Soft delete project
 * @route   DELETE /api/projects/:id
 * @access  Private
 */
const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );

  if (!project) {
    res.statusCode = 404;
    throw new Error("Project not found");
  }
  invalidateDashboardCache(req.user._id);
  res.json({ success: true, message: "Project deleted" });
});

/**
 * @desc    Toggle pin state and optionally set order for a project
 * @route   PATCH /api/projects/:id/pin
 * @access  Private
 */
const pinProject = asyncHandler(async (req, res) => {
  const project = await Project.findOne({
    _id: req.params.id,
    userId: req.user._id,
    isDeleted: false,
  });

  if (!project) {
    res.statusCode = 404;
    throw new Error("Project not found");
  }

  project.pinned = !project.pinned;

  // If pinning, assign a pinOrder so it sorts after existing pinned projects
  if (project.pinned) {
    const highestPinned = await Project.findOne({
      userId: req.user._id,
      isDeleted: false,
      pinned: true,
      _id: { $ne: project._id },
    }).sort({ pinOrder: -1 }).lean();
    project.pinOrder = highestPinned ? highestPinned.pinOrder + 1 : 0;
  } else {
    project.pinOrder = 0;
  }

  await project.save();
  res.json({ success: true, data: project });
});

/**
 * @desc    Reorder pinned projects
 * @route   PATCH /api/projects/reorder-pins
 * @access  Private
 */
const reorderPins = asyncHandler(async (req, res) => {
  // orderedIds: array of project _id strings in desired order
  const { orderedIds } = req.body;
  if (!Array.isArray(orderedIds)) {
    res.statusCode = 400;
    throw new Error("orderedIds must be an array");
  }

  await Promise.all(
    orderedIds.map((id, idx) =>
      Project.updateOne(
        { _id: id, userId: req.user._id, isDeleted: false },
        { pinOrder: idx }
      )
    )
  );

  res.json({ success: true });
});

/**
 * @desc    Get tasks linked to a project
 * @route   GET /api/projects/:id/tasks
 * @access  Private
 */
const getProjectTasks = asyncHandler(async (req, res) => {
  const project = await Project.findOne({
    _id: req.params.id,
    userId: req.user._id,
    isDeleted: false,
  }).lean();

  if (!project) {
    res.statusCode = 404;
    throw new Error("Project not found");
  }

  const tasks = await Task.find({
    projectId: project._id,
    isDeleted: false,
  })
    .sort({ createdAt: -1 })
    .lean();

  res.json({ success: true, data: tasks });
});

module.exports = {
  getProjects,
  getProject,
  createProject,
  updateProject,
  toggleMilestone,
  deleteProject,
  pinProject,
  reorderPins,
  getProjectTasks,
};