const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  createIncome,
  getIncomes,
  getIncome,
  updateIncome,
  deleteIncome,
  createExpense,
  getExpenses,
  getExpense,
  updateExpense,
  deleteExpense,
  createDue,
  getDues,
  getDue,
  updateDue,
  deleteDue,
  getAccountsSummary
} = require("../controllers/accountsController");

// ==================== INCOME ROUTES ====================
router.post("/incomes", auth, createIncome);
router.get("/incomes", auth, getIncomes);
router.get("/incomes/:id", auth, getIncome);
router.put("/incomes/:id", auth, updateIncome);
router.delete("/incomes/:id", auth, deleteIncome);

// ==================== EXPENSE ROUTES ====================
router.post("/expenses", auth, createExpense);
router.get("/expenses", auth, getExpenses);
router.get("/expenses/:id", auth, getExpense);
router.put("/expenses/:id", auth, updateExpense);
router.delete("/expenses/:id", auth, deleteExpense);

// ==================== DUE ROUTES ====================
router.post("/dues", auth, createDue);
router.get("/dues", auth, getDues);
router.get("/dues/:id", auth, getDue);
router.put("/dues/:id", auth, updateDue);
router.delete("/dues/:id", auth, deleteDue);

// ==================== SUMMARY ROUTE ====================
router.get("/summary", auth, getAccountsSummary);

module.exports = router;
