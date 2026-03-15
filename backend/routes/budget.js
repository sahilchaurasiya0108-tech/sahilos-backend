const express = require("express");
const router = express.Router();
const {
  getBudgetEntries,
  getBudgetSummary,
  createBudgetEntry,
  updateBudgetEntry,
  deleteBudgetEntry,
} = require("../controllers/budgetController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/summary", getBudgetSummary);
router.route("/").get(getBudgetEntries).post(createBudgetEntry);
router.route("/:id").put(updateBudgetEntry).delete(deleteBudgetEntry);

module.exports = router;
