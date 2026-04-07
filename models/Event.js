const mongoose = require('mongoose');

// ==================== EVENT SCHEMA ====================

const eventSchema = new mongoose.Schema(
  {
    // Auto-generated unique ID
    eventId: { 
      type: String, 
      unique: true 
    },
    
    // Reference to parent activity
    activityId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Activity',
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
    
    // Place/Location for the event
    place: {
      type: String,
      default: "",
      trim: true
    },
    
    // Priority level
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium"
    },
    
    // Event status
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
    
    // Assigned person (reference to Member)
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      default: null
    },
    tasks: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    }]
  },
  { timestamps: true }
);

// ==================== INDEXES ====================

// Single field indexes for query optimization
eventSchema.index({ activityId: 1 });
eventSchema.index({ priority: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ startDate: 1 });
eventSchema.index({ endDate: 1 });
eventSchema.index({ assignedTo: 1 });
eventSchema.index({ place: 1 }); // Add index for place field

// Compound indexes for common queries
eventSchema.index({ activityId: 1, status: 1 });
eventSchema.index({ activityId: 1, priority: 1 });
eventSchema.index({ activityId: 1, place: 1 }); // Index for filtering by place

// Text indexes for search functionality
eventSchema.index({ name: 'text', description: 'text', place: 'text' }); // Include place in text search

// ==================== EXPORT ====================

module.exports = mongoose.model("Event", eventSchema);