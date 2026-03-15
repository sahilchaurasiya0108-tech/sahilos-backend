const express = require("express");
const router = express.Router();
const { queryAI, getSuggestions } = require("../controllers/aiController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.post("/query", queryAI);
router.get("/suggestions", getSuggestions);

module.exports = router;
