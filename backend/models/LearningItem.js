const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    url: { type: String, default: "", trim: true },
  },
  { _id: true }
);

const learningItemSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Learning item title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    category: {
      type: String,
      enum: {
        values: ["skill", "course", "book", "other"],
        message: "Category must be skill, course, book, or other",
      },
      default: "skill",
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    status: {
      type: String,
      enum: {
        values: ["not-started", "in-progress", "completed"],
        message: "Status must be not-started, in-progress, or completed",
      },
      default: "not-started",
    },
    resources: {
      type: [resourceSchema],
      default: [],
    },
    notes: {
      type: String,
      default: "",
      maxlength: [3000, "Notes cannot exceed 3000 characters"],
    },
    tags: {
      type: [String],
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

learningItemSchema.index({ userId: 1, isDeleted: 1, status: 1 });

module.exports = mongoose.model("LearningItem", learningItemSchema);
