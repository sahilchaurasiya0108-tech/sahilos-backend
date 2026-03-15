const mongoose = require("mongoose");

const BUDGET_CATEGORIES = [
  "food", "transport", "housing", "utilities", "entertainment",
  "health", "education", "shopping", "salary", "freelance",
  "investment", "other",
];

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    type: {
      type: String,
      enum: {
        values: ["income", "expense"],
        message: "Type must be income or expense",
      },
      required: [true, "Type is required"],
    },
    category: {
      type: String,
      enum: {
        values: BUDGET_CATEGORIES,
        message: `Category must be one of: ${BUDGET_CATEGORIES.join(", ")}`,
      },
      default: "other",
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      default: Date.now,
    },
    notes: {
      type: String,
      default: "",
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
    // Soft delete — consistent with rest of project
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

budgetSchema.index({ userId: 1, isDeleted: 1, date: -1 });
budgetSchema.index({ userId: 1, isDeleted: 1, type: 1 });

module.exports = mongoose.model("Budget", budgetSchema);
module.exports.BUDGET_CATEGORIES = BUDGET_CATEGORIES;
