const express = require("express");
const router = express.Router();
const {
  getTasks, getTask, createTask, updateTask,
  patchStatus, toggleSubtask, deleteTask,
} = require("../controllers/taskController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.route("/").get(getTasks).post(createTask);
router.route("/:id").get(getTask).put(updateTask).delete(deleteTask);
router.patch("/:id/status", patchStatus);
router.patch("/:id/subtasks/:subtaskId", toggleSubtask);

module.exports = router;
