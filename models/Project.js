const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    projectId: { type: String, unique: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    status: { 
      type: String,
      enum: ["Planning", "In Progress", "On Hold", "Completed", "Cancelled"], // Match frontend
      default: "Planning"
    },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    projectManager: { type: String, default: "" },
    priority: { 
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium"
    },
  },
  { timestamps: true }
);

// Create text indexes for search functionality
projectSchema.index({ name: 'text', description: 'text', projectManager: 'text' });

module.exports = mongoose.model("Project", projectSchema);