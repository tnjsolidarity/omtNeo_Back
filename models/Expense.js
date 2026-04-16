const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    expenseId: { type: String, unique: true },
    expenseType: {
      type: String,
      enum: ['General', 'Project', 'Due'],
      required: true
    },
    
    // Common fields for all types
    date: { type: Date, required: true },
    description: { type: String, default: '' },
    paymentSentTo: { type: String, default: '' },
    paymentSentToMemberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', default: null }, // ← ADD THIS
    paymentSentToNonMemberInfo: {
      name: { type: String, default: '' },
      contactNumber: { type: String, default: '' },
      description: { type: String, default: '' }
    },
    paymentMode: { type: String, default: '' },
    paymentId: { type: String, default: '' },
    
    // Member who did the expense
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', default: null },
    nonMemberInfo: {
      name: { type: String, default: '' },
      contactNumber: { type: String, default: '' },
      description: { type: String, default: '' }
    },
    
    // General expense fields
    expenseName: { type: String, default: '' },
    expenseAmount: { type: Number, default: 0 },
    
    // Project expense fields
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
    activityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity', default: null },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: null },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
    
    // Due-related expense fields
    dueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Due', default: null },
    duePaymentAmount: { type: Number, default: 0 },
    
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Cancelled'],
      default: 'Pending'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Expense', expenseSchema);