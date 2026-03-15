const mongoose = require("mongoose");

const habitSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Habit title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      default: "",
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    frequency: {
      type: String,
      enum: {
        values: ["daily", "weekly"],
        message: "Frequency must be daily or weekly",
      },
      default: "daily",
    },
    color: {
      type: String,
      default: "#10b981", // emerald-500
    },
    icon: {
      type: String,
      default: "⚡",
    },
    // Denormalised counters — updated after each log/recalculation
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
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

habitSchema.index({ userId: 1, isDeleted: 1 });

module.exports = mongoose.model("Habit", habitSchema);
