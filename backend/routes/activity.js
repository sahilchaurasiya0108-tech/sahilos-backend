const express = require("express");
const router = express.Router();
const { getActivity } = require("../controllers/activityController");
const { protect } = require("../middleware/auth");

router.use(protect);
router.get("/", getActivity);

module.exports = router;
