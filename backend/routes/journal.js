const express = require("express");
const router = express.Router();
const {
  getEntries,
  getEntryByDate,
  upsertEntry,
  deleteEntry,
  getDayInsights,
  reflectOnEntry,
  getWritingStreak,
  getMoodTrend,
} = require("../controllers/journalController");
const { protect } = require("../middleware/auth");

router.use(protect);

// Existing routes — unchanged
router.route("/").get(getEntries).post(upsertEntry);
router.get("/date/:date", getEntryByDate);
router.delete("/:id", deleteEntry);

// New routes
router.get("/streak", getWritingStreak);
router.get("/mood-trend", getMoodTrend);
router.get("/insights/:date", getDayInsights);
router.post("/reflect", reflectOnEntry);

module.exports = router;