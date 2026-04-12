const mongoose = require('mongoose');

const inviteeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true
  },
  status: {
    type: String,
    enum: ['absent', 'invited', 'permission', 'present', 'not_available', 'not_invited', 'not_reachable', 'not_responded'],
    default: 'invited'
  },
  checkInTime: Date,
  checkOutTime: Date,
  remarks: String,
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  statusUpdatedAt: Date
});

const inchargeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true
  },
  invitees: [inviteeSchema],
  role: String,
  notes: String
});

const attendanceSchema = new mongoose.Schema({
  // Auto-generated unique ID
  attendanceId: { 
    type: String, 
    unique: true 
  },
  
  description: {
    type: String,
    trim: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  activity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    required: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  incharges: [inchargeSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'cancelled'],
    default: 'active'
  },
  date: {
    type: Date,
    default: Date.now
  },
  location: String,
  // Individual attendance status counts only
  totalInvitees: {
    type: Number,
    default: 0
  },
  totalPresent: {
    type: Number,
    default: 0
  },
  totalAbsent: {
    type: Number,
    default: 0
  },
  totalInvited: {
    type: Number,
    default: 0
  },
  totalPermission: {
    type: Number,
    default: 0
  },
  totalNotAvailable: {
    type: Number,
    default: 0
  },
  totalNotInvited: {
    type: Number,
    default: 0
  },
  totalNotReachable: {
    type: Number,
    default: 0
  },
  totalNotResponded: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Function to calculate stats based on individual attendance statuses only
function calculateStats(doc) {
  let totalInvitees = 0;
  let totalPresent = 0;
  let totalAbsent = 0;
  let totalInvited = 0;
  let totalPermission = 0;
  let totalNotAvailable = 0;
  let totalNotInvited = 0;
  let totalNotReachable = 0;
  let totalNotResponded = 0;
  
  if (doc.incharges && Array.isArray(doc.incharges)) {
    doc.incharges.forEach(incharge => {
      if (incharge.invitees && Array.isArray(incharge.invitees)) {
        incharge.invitees.forEach(invitee => {
          totalInvitees++;
          
          switch(invitee.status) {
            case 'present':
              totalPresent++;
              break;
            case 'absent':
              totalAbsent++;
              break;
            case 'invited':
              totalInvited++;
              break;
            case 'permission':
              totalPermission++;
              break;
            case 'not_available':
              totalNotAvailable++;
              break;
            case 'not_invited':
              totalNotInvited++;
              break;
            case 'not_reachable':
              totalNotReachable++;
              break;
            case 'not_responded':
              totalNotResponded++;
              break;
          }
        });
      }
    });
  }
  
  doc.totalInvitees = totalInvitees;
  doc.totalPresent = totalPresent;
  doc.totalAbsent = totalAbsent;
  doc.totalInvited = totalInvited;
  doc.totalPermission = totalPermission;
  doc.totalNotAvailable = totalNotAvailable;
  doc.totalNotInvited = totalNotInvited;
  doc.totalNotReachable = totalNotReachable;
  doc.totalNotResponded = totalNotResponded;
}

// Add calculateStats as a schema method
attendanceSchema.methods.calculateStats = function() {
  calculateStats(this);
};

// Pre-save middleware to calculate stats
attendanceSchema.pre('save', function() {
  calculateStats(this);
});

module.exports = mongoose.model('Attendance', attendanceSchema);