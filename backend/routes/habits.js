const express = require("express");
const router = express.Router();
const {
  getHabits, createHabit, updateHabit, deleteHabit,
  logToday, unlogToday, getStats,
} = require("../controllers/habitController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.route("/").get(getHabits).post(createHabit);
router.route("/:id").put(updateHabit).delete(deleteHabit);
router.route("/:id/log").post(logToday).delete(unlogToday);
router.get("/:id/stats", getStats);

module.exports = router;
