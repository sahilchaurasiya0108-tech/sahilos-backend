// ideas.js
const express = require("express");
const router = express.Router();
const {
  getIdeas, getIdea, createIdea, updateIdea, convertToProject, deleteIdea,
} = require("../controllers/ideaController");
const { protect } = require("../middleware/auth");

router.use(protect);
router.route("/").get(getIdeas).post(createIdea);
router.route("/:id").get(getIdea).put(updateIdea).delete(deleteIdea);
router.post("/:id/convert", convertToProject);

module.exports = router;
