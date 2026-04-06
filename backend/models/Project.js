const mongoose = require("mongoose");

const milestoneSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    done: { type: Boolean, default: false },
    dueDate: { type: Date, default: null },
  },
  { _id: true }
);

const projectSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Project title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    description: {
      type: String,
      default: "",
      maxlength: [3000, "Description cannot exceed 3000 characters"],
    },
    status: {
      type: String,
      enum: {
        values: ["active", "paused", "completed"],
        message: "Status must be active, paused, or completed",
      },
      default: "active",
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    repoLink: {
      type: String,
      default: "",
      trim: true,
    },
    liveUrl: {
      type: String,
      default: "",
      trim: true,
    },
    milestones: {
      type: [milestoneSchema],
      default: [],
    },
    notes: {
      type: String,
      default: "",
      maxlength: [5000, "Notes cannot exceed 5000 characters"],
    },
    color: {
      type: String,
      default: "#6366f1", // indigo-500
    },
    categories: {
      type: [String],
      enum: {
        values: ["personal", "freelance", "office", "learning", "experiment"],
        message: "Invalid category value",
      },
      default: [],
    },
    // ── Soft delete ──────────────────────────────────────────────────────────
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

projectSchema.index({ userId: 1, isDeleted: 1, status: 1 });

module.exports = mongoose.model("Project", projectSchema);