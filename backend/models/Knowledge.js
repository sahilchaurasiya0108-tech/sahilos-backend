const mongoose = require("mongoose");

const KNOWLEDGE_CATEGORIES = ["book", "movie", "web_series", "anime", "quote", "person", "article", "other"];

// Accent colours the user can pick to personalise a card
const CARD_ACCENT_COLOURS = [
  "default", "rose", "amber", "emerald", "sky", "violet", "pink", "orange",
];

const knowledgeSchema = new mongoose.Schema(
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
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    category: {
      type: String,
      enum: { values: KNOWLEDGE_CATEGORIES, message: "Invalid category" },
      required: [true, "Category is required"],
    },
    content: {
      type: String,
      default: "",
      maxlength: [20000, "Content cannot exceed 20,000 characters"],
    },
    tags: { type: [String], default: [] },
    // Extra metadata per category
    author:   { type: String, default: "", trim: true },   // books, quotes, articles
    rating:   { type: Number, min: 1, max: 5, default: null }, // books, movies
    status:   {
      type: String,
      enum: { values: ["want", "in-progress", "done"], message: "Invalid status" },
      default: "want",
    },

    // ── Favourites ─────────────────────────────────────────────────────────
    isFavourite: { type: Boolean, default: false, index: true },

    // ── Card customisation ─────────────────────────────────────────────────
    cardStyle: {
      // A single emoji or short label shown prominently on the card
      coverEmoji:   { type: String, default: "", trim: true, maxlength: 8 },
      // Accent colour key (maps to a Tailwind palette on the frontend)
      accentColour: { type: String, enum: CARD_ACCENT_COLOURS, default: "default" },
      // Layout variant: "default" | "compact" | "poster"
      displayStyle: { type: String, enum: ["default", "compact", "poster"], default: "default" },
    },

    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

knowledgeSchema.index({ userId: 1, isDeleted: 1, category: 1 });
knowledgeSchema.index({ userId: 1, isDeleted: 1, createdAt: -1 });
knowledgeSchema.index({ userId: 1, isDeleted: 1, isFavourite: 1 });

module.exports = mongoose.model("Knowledge", knowledgeSchema);
module.exports.KNOWLEDGE_CATEGORIES = KNOWLEDGE_CATEGORIES;
module.exports.CARD_ACCENT_COLOURS  = CARD_ACCENT_COLOURS;