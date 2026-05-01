const express = require("express");
const router  = express.Router();
const {
  getCounts, getEntries, getEntry,
  createEntry, updateEntry, deleteEntry,
  toggleFavourite,
} = require("../controllers/knowledgeController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/counts", getCounts);
router.route("/").get(getEntries).post(createEntry);
router.route("/:id").get(getEntry).put(updateEntry).delete(deleteEntry);

// Dedicated lightweight toggle — avoids sending the whole document
router.patch("/:id/favourite", toggleFavourite);

module.exports = router;