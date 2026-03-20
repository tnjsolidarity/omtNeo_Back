const mongoose = require('mongoose');

// ==================== ACTIVITY SCHEMA ====================

const activitySchema = new mongoose.Schema(
  {
    // Auto-generated unique ID (same format as project)
    activityId: { 
      type: String, 
      unique: true 
    },
    
    // Reference to parent project
    projectId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Project',
      required: true 
    },
    
    // Basic information
    name: { 
      type: String, 
      required: true 
    },
    description: { 
      type: String, 
      default: "" 
    },
    
    // Priority level
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium"
    },
    
    // Date range
    startDate: { 
      type: Date, 
      default: null 
    },
    endDate: { 
      type: Date, 
      default: null 
    },
    
    // Assigned person (reference to Member)
    incharge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      default: null
    }
  },
  { timestamps: true }
);

// ==================== INDEXES ====================

// Single field indexes for query optimization
activitySchema.index({ projectId: 1 });
activitySchema.index({ priority: 1 });
activitySchema.index({ startDate: 1 });
activitySchema.index({ endDate: 1 });
activitySchema.index({ incharge: 1 });
activitySchema.index({ activityId: 1 });

// Text indexes for search functionality
activitySchema.index({ name: 'text', description: 'text' });

// ==================== EXPORT ====================

module.exports = mongoose.model("Activity", activitySchema);