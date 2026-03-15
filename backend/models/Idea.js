const mongoose = require("mongoose");

const ideaSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Idea title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      default: "",
      maxlength: [3000, "Description cannot exceed 3000 characters"],
    },
    tags: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
    },
    status: {
      type: String,
      enum: {
        values: ["raw", "refined", "converted"],
        message: "Status must be raw, refined, or converted",
      },
      default: "raw",
    },
    // Populated when "Convert to Project" is triggered
    convertedProjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
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

ideaSchema.index({ userId: 1, isDeleted: 1, rating: -1 });

module.exports = mongoose.model("Idea", ideaSchema);
