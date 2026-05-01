const express = require("express");
const router = express.Router();
const {
  getProjects, getProject, createProject,
  updateProject, toggleMilestone, deleteProject,
  pinProject, reorderPins, getProjectTasks,
} = require("../controllers/projectController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.route("/").get(getProjects).post(createProject);
router.patch("/reorder-pins", reorderPins);
router.route("/:id").get(getProject).put(updateProject).delete(deleteProject);
router.patch("/:id/milestones/:milestoneId", toggleMilestone);
router.patch("/:id/pin", pinProject);
router.get("/:id/tasks", getProjectTasks);

module.exports = router;