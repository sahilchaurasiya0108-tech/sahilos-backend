const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { handleJarvis } = require("../controllers/jarvisController");

router.use(protect);

router.post("/", handleJarvis);

module.exports = router;