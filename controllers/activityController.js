const Activity = require("../models/Activity");
const Project = require("../models/Project");
const mongoose = require('mongoose');

// Helper function to generate activity ID
async function generateActivityId() {
  const year = new Date().getFullYear();
  const count = await Activity.countDocuments({
    activityId: { $regex: `^ACT-${year}-` }
  });
  const paddedNumber = String(count + 1).padStart(4, "0");
  return `ACT-${year}-${paddedNumber}`;
}

// CREATE activity
exports.createActivity = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, description, priority, startDate, endDate, incharge } = req.body;

    console.log('Creating activity for project:', projectId);

    // Validate projectId format
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ error: "Invalid project ID format" });
    }

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Generate activity ID
    const activityId = await generateActivityId();

    // Create activity
    const activity = new Activity({
      activityId,
      projectId: projectId,
      name: name,
      description: description || "",
      priority: priority || "Medium",
      startDate: startDate || null,
      endDate: endDate || null,
      incharge: incharge || null
    });

    const savedActivity = await activity.save();
    
    // Populate incharge details before returning
    const populatedActivity = await Activity.findById(savedActivity._id)
      .populate('incharge', 'name memberId role');
    
    console.log('Activity created:', populatedActivity);
    res.status(201).json(populatedActivity);
  } catch (err) {
    console.error("Create Activity Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET all activities for a project
exports.getActivities = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { priority, search } = req.query;
    
    console.log('Fetching activities for project:', projectId);
    
    let query = { projectId };
    
    if (priority) query.priority = priority;
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const activities = await Activity.find(query)
      .populate('incharge', 'name memberId role')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${activities.length} activities`);
    res.json(activities);
  } catch (err) {
    console.error("Get Activities Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET single activity
exports.getActivity = async (req, res) => {
  try {
    const { projectId, activityId } = req.params;
    
    const activity = await Activity.findOne({ _id: activityId, projectId })
      .populate('incharge', 'name memberId role');
    
    if (!activity) {
      return res.status(404).json({ error: "Activity not found" });
    }
    
    res.json(activity);
  } catch (err) {
    console.error("Get Activity Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE activity
exports.updateActivity = async (req, res) => {
  try {
    const { projectId, activityId } = req.params;
    
    console.log('Updating activity:', activityId);
    
    // Clean the update data
    const updateData = {};
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.priority !== undefined) updateData.priority = req.body.priority;
    if (req.body.startDate !== undefined) updateData.startDate = req.body.startDate || null;
    if (req.body.endDate !== undefined) updateData.endDate = req.body.endDate || null;
    if (req.body.incharge !== undefined) updateData.incharge = req.body.incharge || null;
    
    const activity = await Activity.findOneAndUpdate(
      { _id: activityId, projectId: projectId },
      updateData,
      { new: true, runValidators: true }
    ).populate('incharge', 'name memberId role');
    
    if (!activity) {
      return res.status(404).json({ error: "Activity not found" });
    }
    
    console.log('Activity updated:', activity);
    res.json(activity);
  } catch (err) {
    console.error("Update Activity Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE activity
exports.deleteActivity = async (req, res) => {
  try {
    const { projectId, activityId } = req.params;
    
    const activity = await Activity.findOneAndDelete({ _id: activityId, projectId });
    
    if (!activity) {
      return res.status(404).json({ error: "Activity not found" });
    }
    
    console.log('Activity deleted successfully');
    res.json({ msg: "Activity deleted successfully" });
  } catch (err) {
    console.error("Delete Activity Error:", err);
    res.status(500).json({ error: err.message });
  }
};