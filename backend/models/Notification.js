const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["important", "info", "fun"],
      default: "info",
    },
    category: {
      type: String,
      enum: [
        "task", "habit", "journal", "project", "learning",
        "budget", "achievement", "idea", "activity", "ai",
        "system", "fun",
      ],
      default: "system",
    },
    read: { type: Boolean, default: false, index: true },
    actionLink: { type: String, default: null },
    scheduledFor: { type: Date, default: null },
    sent: { type: Boolean, default: false },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// Auto-expire fun/info notifications after 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

module.exports = mongoose.model("Notification", notificationSchema);
