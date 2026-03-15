const express = require("express");
const router = express.Router();
const {
  getLearningItems, getLearningItem, createLearningItem,
  updateLearningItem, patchProgress, deleteLearningItem,
} = require("../controllers/learningController");
const { protect } = require("../middleware/auth");

router.use(protect);
router.route("/").get(getLearningItems).post(createLearningItem);
router.route("/:id").get(getLearningItem).put(updateLearningItem).delete(deleteLearningItem);
router.patch("/:id/progress", patchProgress);

module.exports = router;
