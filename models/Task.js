const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  taskId: {
    type: String,
    unique: true  // This automatically creates an index - no need for separate index
  },
  name: {
    type: String,
    required: [true, 'Task name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ["Assigned", "Planning", "In Progress", "On Hold", "Completed", "Cancelled", "Failed"],
    default: 'Planning'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member'
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  dependencies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  attachments: [{
    name: String,
    url: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    text: String,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member'
  }
}, {
  timestamps: true
});

// Only keep indexes for fields that don't have unique: true
taskSchema.index({ event: 1, status: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ priority: 1 });
// REMOVED: taskSchema.index({ taskId: 1 }); // Not needed because unique: true creates it automatically

// Virtual for completion percentage
taskSchema.virtual('completionPercentage').get(function() {
  if (this.status === 'Failed') return 100;
  if (this.status === 'Completed') return 100;
  if (this.status === 'Cancelled') return 100;
  if (this.status === 'On Hold') return 0;
  if (this.status === 'In Progress') return 50;
  if (this.status === 'Assigned') return 25;
  if (this.status === 'Planning') return 10;
  return 0;
});

module.exports = mongoose.model('Task', taskSchema);