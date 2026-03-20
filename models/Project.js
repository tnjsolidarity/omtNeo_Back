const mongoose = require('mongoose');

// ==================== PROJECT SCHEMA ====================

const projectSchema = new mongoose.Schema(
  {
    // Auto-generated unique ID
    projectId: { 
      type: String, 
      unique: true 
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
    
    // Project status
    status: { 
      type: String,
      enum: ["Planning", "In Progress", "On Hold", "Completed", "Cancelled"],
      default: "Planning"
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
    
    // Project manager (reference to Member)
    projectManager: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      default: null 
    },
    
    // Priority level
    priority: { 
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium"
    }
  },
  { timestamps: true }
);

// ==================== INDEXES ====================

// Single field indexes for query optimization
projectSchema.index({ projectManager: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ priority: 1 });
projectSchema.index({ startDate: 1 });
projectSchema.index({ endDate: 1 });

// Text indexes for search functionality
projectSchema.index({ name: 'text', description: 'text', projectId: 'text' });

// ==================== EXPORT ====================

module.exports = mongoose.model("Project", projectSchema);