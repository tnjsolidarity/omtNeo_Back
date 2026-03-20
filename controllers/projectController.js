const Project = require("../models/Project");
const mongoose = require('mongoose');

// ==================== PROJECT CONTROLLER ====================

/**
 * GET ALL PROJECTS
 * Fetch all projects with optional filters
 */
exports.getProjects = async (req, res) => {
  try {
    const { status, priority, search } = req.query;
    let query = {};

    // Apply filters
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
    
    res.json(projects);
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
    const count = await Project.countDocuments();
    const projectId = `PROJ-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

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
    const project = await Project.findByIdAndDelete(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    
    res.json({ msg: "Project deleted successfully" });
  } catch (err) {
    console.error("Delete Project Error:", err);
    res.status(500).json({ error: err.message });
  }
};