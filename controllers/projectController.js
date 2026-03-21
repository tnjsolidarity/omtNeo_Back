const Project = require("../models/Project");
const mongoose = require('mongoose');
const Activity = require("../models/Activity");

// ==================== PROJECT CONTROLLER ====================

const Counter = require("../models/Counter");

async function getNextProjectId() {
  const counter = await Counter.findOneAndUpdate(
    { name: "projectId" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const year = new Date().getFullYear();
  return `PROJ-${year}-${String(counter.seq).padStart(4, "0")}`;
}

/**
 * GET ALL PROJECTS
 * Fetch all projects with optional filters
 */

exports.getProjects = async (req, res) => {
  try {
    const { status, priority, search } = req.query;
    let query = {};

    if (status) query.status = status;
    if (priority) query.priority = priority;

    if (search) {
      query.$or = [
        { projectId: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const projects = await Project.find(query)
      .populate('projectManager', 'name memberId role')
      .sort({ createdAt: -1 });

    // ✅ ADD THIS BLOCK
    const projectsWithProgress = await Promise.all(
      projects.map(async (project) => {
        const total = await Activity.countDocuments({ projectId: project._id });
        const completed = await Activity.countDocuments({
          projectId: project._id,
          status: "Completed"
        });

        const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

        return {
          ...project.toObject(),
          totalActivities: total,
          completedActivities: completed,
          progress
        };
      })
    );

    res.json(projectsWithProgress);
  } catch (err) {
    console.error("Get Projects Error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET SINGLE PROJECT
 * Fetch a project by ID
 */
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('projectManager', 'name memberId role');
    
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    
    res.json(project);
  } catch (err) {
    console.error("Get Project Error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * CREATE PROJECT
 * Create a new project with auto-generated project ID
 */
exports.createProject = async (req, res) => {
  try {
    const {
      name,
      description,
      status,
      startDate,
      endDate,
      projectManager,
      priority
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Project name is required" });
    }

    // Generate project ID
    const projectId = await getNextProjectId();

    console.log("Creating Project with data:", req.body);

    // Create project
    const project = await Project.create({
      projectId,
      name,
      description: description || "",
      status: status || "Planning",
      startDate: startDate || null,
      endDate: endDate || null,
      projectManager: projectManager || null,
      priority: priority || "Medium"
    });

    // Populate project manager
    const populatedProject = await Project.findById(project._id)
      .populate('projectManager', 'name memberId role');

    console.log("Created Project:", populatedProject);
    res.status(201).json(populatedProject);
  } catch (err) {
    console.error("Create Project Error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * UPDATE PROJECT
 * Update an existing project
 */
exports.updateProject = async (req, res) => {
  try {
    const updateData = {
      name: req.body.name,
      description: req.body.description || "",
      status: req.body.status || "Planning",
      startDate: req.body.startDate || null,
      endDate: req.body.endDate || null,
      projectManager: req.body.projectManager || null,
      priority: req.body.priority || "Medium"
    };

    console.log("Updating Project with data:", updateData);

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('projectManager', 'name memberId role');

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    console.log("Updated Project:", project);
    res.json(project);
  } catch (err) {
    console.error("Update Project Error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * DELETE PROJECT
 * Delete a project by ID
 */

exports.deleteProject = async (req, res) => {
  try {
    const projectId = req.params.id;

    // Check if activities exist
    const activityExists = await Activity.exists({ projectId });

    if (activityExists) {
      return res.status(400).json({
        error: "Deletion not possible because this project has activities inside it."
      });
    }

    const project = await Project.findByIdAndDelete(projectId);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json({ msg: "Project deleted successfully" });
  } catch (err) {
    console.error("Delete Project Error:", err);
    res.status(500).json({ error: err.message });
  }
};