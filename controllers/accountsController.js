const Income = require("../models/Income");
const Expense = require("../models/Expense");
const Due = require("../models/Due");
const Member = require("../models/Member");
const Counter = require("../models/Counter");

// ==================== ID GENERATION HELPERS ====================

// Helper function to generate income ID
async function generateIncomeId() {
  const year = new Date().getFullYear();

  const counter = await Counter.findOneAndUpdate(
    { name: `incomeId-${year}` },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return `INC-${year}-${String(counter.seq).padStart(4, "0")}`;
}

// Helper function to generate expense ID
async function generateExpenseId() {
  const year = new Date().getFullYear();

  const counter = await Counter.findOneAndUpdate(
    { name: `expenseId-${year}` },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return `EXP-${year}-${String(counter.seq).padStart(4, "0")}`;
}

// Helper function to generate due ID
async function generateDueId() {
  const year = new Date().getFullYear();

  const counter = await Counter.findOneAndUpdate(
    { name: `dueId-${year}` },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return `DUE-${year}-${String(counter.seq).padStart(4, "0")}`;
}

// ==================== INCOME CONTROLLERS ====================

exports.createIncome = async (req, res) => {
  try {
    const {
      incomeType,
      date,
      description,
      memberId,
      nonMemberInfo,
      serviceName,
      serviceValue,
      sentTo,
      sentToMemberId,
      sentToNonMemberInfo,
      incomeName,
      donatingAmount,
      paymentSentTo,
      paymentMode,
      paymentId
    } = req.body;

    if (!incomeType || !date) {
      return res.status(400).json({ error: "Income type and date are required" });
    }

    // Validate income type specific fields
    if (incomeType === 'Service' && (!serviceName || !serviceValue)) {
      return res.status(400).json({ error: "Service name and value are required for Service type" });
    }
    if (incomeType === 'Money' && (!incomeName || !donatingAmount)) {
      return res.status(400).json({ error: "Income name and amount are required for Money type" });
    }

    // Generate income ID
    const incomeId = await generateIncomeId();

    const income = await Income.create({
      incomeId,
      incomeType,
      date,
      description,
      memberId: memberId || null,
      nonMemberInfo: nonMemberInfo || {},
      serviceName,
      serviceValue: serviceValue ? Number(serviceValue) : 0,
      sentTo,
      sentToMemberId: sentToMemberId || null,
      sentToNonMemberInfo: sentToNonMemberInfo || {},
      incomeName,
      donatingAmount: donatingAmount ? Number(donatingAmount) : 0,
      paymentSentTo,
      paymentMode,
      paymentId
    });

    res.status(201).json(income);
  } catch (err) {
    console.error("Create Income Error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getIncomes = async (req, res) => {
  try {
    const incomes = await Income.find()
      .populate('memberId', 'name phone')
      .populate('sentToMemberId', 'name phone')
      .sort({ createdAt: -1 });
    res.json(incomes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getIncome = async (req, res) => {
  try {
    const income = await Income.findById(req.params.id)
      .populate('memberId', 'name phone')
      .populate('sentToMemberId', 'name phone');
    if (!income) {
      return res.status(404).json({ error: "Income not found" });
    }
    res.json(income);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateIncome = async (req, res) => {
  try {
    const income = await Income.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('memberId', 'name phone');
    
    if (!income) {
      return res.status(404).json({ error: "Income not found" });
    }
    res.json(income);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteIncome = async (req, res) => {
  try {
    const income = await Income.findByIdAndDelete(req.params.id);
    if (!income) {
      return res.status(404).json({ error: "Income not found" });
    }
    res.json({ message: "Income deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==================== EXPENSE CONTROLLERS ====================

exports.createExpense = async (req, res) => {
  try {
    const {
      expenseType,
      date,
      description,
      paymentSentTo,
      paymentSentToMemberId,  // ← ADD THIS
      paymentSentToNonMemberInfo,
      paymentMode,
      paymentId,
      memberId,
      nonMemberInfo,
      expenseName,
      expenseAmount,
      projectId,
      activityId,
      eventId,
      taskId,
      dueId,
      duePaymentAmount
    } = req.body;

    if (!expenseType || !date) {
      return res.status(400).json({ error: "Expense type and date are required" });
    }

    // Validate expense type specific fields
    if (expenseType === 'General' && (!expenseName || !expenseAmount)) {
      return res.status(400).json({ error: "Expense name and amount are required for General type" });
    }
    if (expenseType === 'Project' && (!expenseName || !expenseAmount || !projectId)) {
      return res.status(400).json({ error: "Expense name, amount and project are required for Project type" });
    }
    if (expenseType === 'Due' && (!dueId || !duePaymentAmount)) {
      return res.status(400).json({ error: "Due and payment amount are required for Due type" });
    }

    // Generate expense ID
    const expenseId = await generateExpenseId();

    // If Due type, update the due record
    if (expenseType === 'Due' && dueId) {
      const due = await Due.findById(dueId);
      if (due) {
        due.settledAmount = (due.settledAmount || 0) + Number(duePaymentAmount);
        if (due.settledAmount >= due.totalDueAmount) {
          due.dueStatus = 'FullySettled';
        } else if (due.settledAmount > 0) {
          due.dueStatus = 'PartiallySettled';
        }
        await due.save();
      }
    }

    const expense = await Expense.create({
      expenseId,
      expenseType,
      date,
      description,
      paymentSentTo,
      paymentSentToMemberId: paymentSentToMemberId || null,  // ← ADD THIS
      paymentSentToNonMemberInfo: paymentSentToNonMemberInfo || {},
      paymentMode,
      paymentId,
      memberId: memberId || null,
      nonMemberInfo: nonMemberInfo || {},
      expenseName,
      expenseAmount: expenseAmount ? Number(expenseAmount) : 0,
      projectId: projectId || null,
      activityId: activityId || null,
      eventId: eventId || null,
      taskId: taskId || null,
      dueId: dueId || null,
      duePaymentAmount: duePaymentAmount ? Number(duePaymentAmount) : 0
    });

    res.status(201).json(expense);
  } catch (err) {
    console.error("Create Expense Error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find()
      .populate('memberId', 'name phone')
      .populate('paymentSentToMemberId', 'name phone')  // ← ADD THIS
      .populate('projectId', 'name')
      .populate('dueId', 'dueName dueAmount settledAmount totalDueAmount dueStatus')
      .sort({ createdAt: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('memberId', 'name phone')
      .populate('paymentSentToMemberId', 'name phone')  // ← ADD THIS
      .populate('projectId', 'name')
      .populate('dueId', 'dueName dueAmount settledAmount totalDueAmount dueStatus');
    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }
    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('memberId', 'name phone')
      .populate('paymentSentToMemberId', 'name phone')  // ← ADD THIS
      .populate('projectId', 'name');
    
    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }
    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }
    res.json({ message: "Expense deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==================== DUE CONTROLLERS ====================

exports.createDue = async (req, res) => {
  try {
    const {
      dueType,
      dueName,
      dueAmount,
      date,
      description,
      dueTransferMode,
      dueTransferId,
      sentTo,
      sentToMemberId,
      sentToNonMemberInfo,
      memberId,
      nonMemberInfo,
      projectId,
      activityId,
      eventId,
      taskId
    } = req.body;

    if (!dueType || !dueName || !dueAmount || !date) {
      return res.status(400).json({ error: "Due type, name, amount and date are required" });
    }

    if (dueType === 'Project' && !projectId) {
      return res.status(400).json({ error: "Project is required for Project type due" });
    }

    // Generate due ID
    const dueId = await generateDueId();

    const due = await Due.create({
      dueId,
      dueType,
      dueName,
      dueAmount: Number(dueAmount),
      date,
      description,
      dueTransferMode,
      dueTransferId,
      sentTo,
      sentToMemberId: sentToMemberId || null,
      sentToNonMemberInfo: sentToNonMemberInfo || {},
      memberId: memberId || null,
      nonMemberInfo: nonMemberInfo || {},
      projectId: projectId || null,
      activityId: activityId || null,
      eventId: eventId || null,
      taskId: taskId || null,
      totalDueAmount: Number(dueAmount),
      settledAmount: 0,
      dueStatus: 'Pending'
    });

    res.status(201).json(due);
  } catch (err) {
    console.error("Create Due Error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getDues = async (req, res) => {
  try {
    const dues = await Due.find()
      .populate('memberId', 'name phone')
      .populate('projectId', 'name')
      .sort({ createdAt: -1 });
    res.json(dues);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDue = async (req, res) => {
  try {
    const due = await Due.findById(req.params.id)
      .populate('memberId', 'name phone')
      .populate('projectId', 'name');
    if (!due) {
      return res.status(404).json({ error: "Due not found" });
    }
    res.json(due);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateDue = async (req, res) => {
  try {
    const due = await Due.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('memberId', 'name phone')
      .populate('projectId', 'name');
    
    if (!due) {
      return res.status(404).json({ error: "Due not found" });
    }
    res.json(due);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteDue = async (req, res) => {
  try {
    const due = await Due.findByIdAndDelete(req.params.id);
    if (!due) {
      return res.status(404).json({ error: "Due not found" });
    }
    res.json({ message: "Due deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==================== SUMMARY CONTROLLERS ====================

exports.getAccountsSummary = async (req, res) => {
  try {
    const incomes = await Income.find();
    const expenses = await Expense.find();
    const dues = await Due.find();

    const totalIncome = incomes.reduce((sum, inc) => {
      if (inc.incomeType === 'Money') return sum + inc.donatingAmount;
      return sum;
    }, 0);

    const totalServices = incomes.reduce((sum, inc) => {
      if (inc.incomeType === 'Service') return sum + inc.serviceValue;
      return sum;
    }, 0);

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.expenseAmount, 0);

    const totalDue = dues.reduce((sum, due) => sum + due.totalDueAmount, 0);
    const totalDueSettled = dues.reduce((sum, due) => sum + due.settledAmount, 0);
    const totalDuePending = totalDue - totalDueSettled;

    res.json({
      totalIncome,
      totalServices,
      totalExpenses,
      totalDue,
      totalDueSettled,
      totalDuePending,
      incomeCount: incomes.length,
      expenseCount: expenses.length,
      dueCount: dues.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
