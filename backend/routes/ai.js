const express = require("express");
const router  = express.Router();
const { queryAI, getSuggestions, getDailyQuote } = require("../controllers/aiController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.post("/query",        queryAI);
router.get("/suggestions",   getSuggestions);
router.get("/daily-quote",   getDailyQuote);

module.exports = router;