const mongoose = require("mongoose");

const journalEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Stored as YYYY-MM-DD string for easy lookup + unique-per-user constraint
    date: {
      type: String,
      required: [true, "Journal date is required"],
      match: [/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"],
    },
    content: {
      type: String,
      default: "",
      maxlength: [50000, "Journal entry cannot exceed 50,000 characters"],
    },
    mood: {
      type: String,
      enum: {
        values: ["great", "good", "neutral", "bad", "awful"],
        message: "Mood must be great, good, neutral, bad, or awful",
      },
      default: "neutral",
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

// One entry per user per day
journalEntrySchema.index({ userId: 1, date: 1 }, { unique: true });
journalEntrySchema.index({ userId: 1, isDeleted: 1, date: -1 });

module.exports = mongoose.model("JournalEntry", journalEntrySchema);
