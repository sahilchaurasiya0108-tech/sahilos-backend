const mongoose = require("mongoose");

const habitLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    habitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Habit",
      required: true,
    },
    // Stored as midnight UTC for reliable date-only comparisons
    completedDate: {
      type: Date,
      required: true,
    },
    note: {
      type: String,
      default: "",
      maxlength: [300, "Note cannot exceed 300 characters"],
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate log for same habit on same day
habitLogSchema.index(
  { habitId: 1, completedDate: 1 },
  { unique: true }
);

habitLogSchema.index({ userId: 1, completedDate: -1 });

module.exports = mongoose.model("HabitLog", habitLogSchema);
