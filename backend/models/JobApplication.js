const mongoose = require("mongoose");

const JOB_STAGES = ["saved", "applied", "interview", "offer", "rejected"];

const jobApplicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    company: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      maxlength: [100, "Company name cannot exceed 100 characters"],
    },
    role: {
      type: String,
      required: [true, "Role is required"],
      trim: true,
      maxlength: [150, "Role cannot exceed 150 characters"],
    },
    stage: {
      type: String,
      enum: {
        values: JOB_STAGES,
        message: `Stage must be one of: ${JOB_STAGES.join(", ")}`,
      },
      default: "saved",
    },
    notes: {
      type: String,
      default: "",
      maxlength: [3000, "Notes cannot exceed 3000 characters"],
    },
    contactPerson: {
      type: String,
      default: "",
      trim: true,
    },
    salary: {
      type: String,
      default: "",
      trim: true,
    },
    jobUrl: {
      type: String,
      default: "",
      trim: true,
    },
    followUpDate: {
      type: Date,
      default: null,
    },
    appliedDate: {
      type: Date,
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

jobApplicationSchema.index({ userId: 1, isDeleted: 1, stage: 1 });

module.exports = mongoose.model("JobApplication", jobApplicationSchema);
module.exports.JOB_STAGES = JOB_STAGES;
