const express = require("express");
const router = express.Router();
const {
  getProjects, getProject, createProject,
  updateProject, toggleMilestone, deleteProject,
} = require("../controllers/projectController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.route("/").get(getProjects).post(createProject);
router.route("/:id").get(getProject).put(updateProject).delete(deleteProject);
router.patch("/:id/milestones/:milestoneId", toggleMilestone);

module.exports = router;
