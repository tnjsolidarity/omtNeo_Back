const mongoose = require('mongoose');

// Due schema update - add sentToMemberId
const dueSchema = new mongoose.Schema(
  {
    dueId: { type: String, unique: true },
    dueType: {
      type: String,
      enum: ['General', 'Project'],
      required: true
    },
    
    // Common fields
    dueName: { type: String, required: true },
    dueAmount: { type: Number, required: true },
    date: { type: Date, required: true },
    description: { type: String, default: '' },
    dueTransferMode: { type: String, default: '' },
    dueTransferId: { type: String, default: '' },
    sentTo: { type: String, default: '' },
    sentToMemberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', default: null }, // ← ADD THIS
    sentToNonMemberInfo: {
      name: { type: String, default: '' },
      contactNumber: { type: String, default: '' },
      description: { type: String, default: '' }
    },
    
    // Member info
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', default: null },
    nonMemberInfo: {
      name: { type: String, default: '' },
      contactNumber: { type: String, default: '' },
      description: { type: String, default: '' }
    },
    
    // Project-related fields
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
    activityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity', default: null },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: null },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
    
    // Due tracking
    totalDueAmount: { type: Number, required: true },
    settledAmount: { type: Number, default: 0 },
    pendingAmount: {
      type: Number,
      get: function() {
        return this.totalDueAmount - this.settledAmount;
      }
    },
    
    dueStatus: {
      type: String,
      enum: ['Pending', 'PartiallySettled', 'FullySettled', 'Overdue'],
      default: 'Pending'
    },
    
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Cancelled'],
      default: 'Active'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Due', dueSchema);