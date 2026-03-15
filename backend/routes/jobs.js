const express = require("express");
const router = express.Router();
const {
  getJobs, getJob, createJob, updateJob, patchStage, deleteJob,
} = require("../controllers/jobController");
const { protect } = require("../middleware/auth");

router.use(protect);
router.route("/").get(getJobs).post(createJob);
router.route("/:id").get(getJob).put(updateJob).delete(deleteJob);
router.patch("/:id/stage", patchStage);

module.exports = router;
