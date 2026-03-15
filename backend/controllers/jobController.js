const asyncHandler = require("../middleware/asyncHandler");
const JobApplication = require("../models/JobApplication");
const { logActivity } = require("../utils/activityLogger");
const { getPagination } = require("../utils/pagination");
const { invalidateDashboardCache } = require("./dashboardController");

const getJobs = asyncHandler(async (req, res) => {
  const { skip, limit, getPaginationMeta } = getPagination(req.query);
  const { stage, search } = req.query;

  const filter = { userId: req.user._id, isDeleted: false };
  if (stage) filter.stage = stage;
  if (search) {
    filter.$or = [
      { company: { $regex: search, $options: "i" } },
      { role: { $regex: search, $options: "i" } },
    ];
  }

  const [jobs, total] = await Promise.all([
    JobApplication.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    JobApplication.countDocuments(filter),
  ]);

  res.json({ success: true, pagination: getPaginationMeta(total), data: jobs });
});

const getJob = asyncHandler(async (req, res) => {
  const job = await JobApplication.findOne({
    _id: req.params.id, userId: req.user._id, isDeleted: false,
  }).lean();
  if (!job) { res.statusCode = 404; throw new Error("Job application not found"); }
  res.json({ success: true, data: job });
});

const createJob = asyncHandler(async (req, res) => {
  const { company, role, stage, notes, contactPerson, salary, jobUrl, followUpDate, appliedDate } = req.body;
  if (!company || !role) {
    res.statusCode = 400;
    throw new Error("Company and role are required");
  }

  const job = await JobApplication.create({
    userId: req.user._id, company, role, stage, notes,
    contactPerson, salary, jobUrl, followUpDate, appliedDate,
  });

  logActivity(req.user._id, "job_added", job._id, `${job.role} at ${job.company}`, {
    stage: job.stage,
  });
  invalidateDashboardCache(req.user._id);
  res.status(201).json({ success: true, data: job });
});

const updateJob = asyncHandler(async (req, res) => {
  const job = await JobApplication.findOne({
    _id: req.params.id, userId: req.user._id, isDeleted: false,
  });
  if (!job) { res.statusCode = 404; throw new Error("Job application not found"); }

  const allowedFields = [
    "company", "role", "stage", "notes", "contactPerson",
    "salary", "jobUrl", "followUpDate", "appliedDate",
  ];
  allowedFields.forEach((f) => { if (req.body[f] !== undefined) job[f] = req.body[f]; });

  const prevStage = job.stage;
  await job.save();

  if (req.body.stage && req.body.stage !== prevStage) {
    logActivity(req.user._id, "job_stage_changed", job._id, `${job.role} at ${job.company}`, {
      from: prevStage, to: job.stage,
    });
  }

  res.json({ success: true, data: job });
});

/**
 * @desc    Patch job stage only (kanban drag-drop)
 * @route   PATCH /api/jobs/:id/stage
 */
const patchStage = asyncHandler(async (req, res) => {
  const { stage } = req.body;
  const validStages = ["saved", "applied", "interview", "offer", "rejected"];

  if (!stage || !validStages.includes(stage)) {
    res.statusCode = 400;
    throw new Error(`Stage must be one of: ${validStages.join(", ")}`);
  }

  const job = await JobApplication.findOne({
    _id: req.params.id, userId: req.user._id, isDeleted: false,
  });
  if (!job) { res.statusCode = 404; throw new Error("Job application not found"); }

  const prevStage = job.stage;
  job.stage = stage;
  await job.save();

  if (stage !== prevStage) {
    logActivity(req.user._id, "job_stage_changed", job._id, `${job.role} at ${job.company}`, {
      from: prevStage, to: stage,
    });
  }

  res.json({ success: true, data: job });
});

const deleteJob = asyncHandler(async (req, res) => {
  const job = await JobApplication.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!job) { res.statusCode = 404; throw new Error("Job application not found"); }
  res.json({ success: true, message: "Job application deleted" });
});

module.exports = { getJobs, getJob, createJob, updateJob, patchStage, deleteJob };
