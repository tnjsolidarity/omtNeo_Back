const Project = require("../models/Project");

// CREATE project
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

    if (!name) return res.status(400).json({ error: "Project name is required" });

    const count = await Project.countDocuments();
    const projectId = `PROJ-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    console.log("Creating Project with data:", req.body);

    const project = await Project.create({
      projectId,
      name,
      description: description || "",
      status: status || "Pending",
      startDate: startDate || null,
      endDate: endDate || null,
      projectManager: projectManager || "",
      priority: priority || "Medium"
    });

    console.log("Created Project:", project);
    res.status(201).json(project);
  } catch (err) {
    console.error("Create Project Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET all projects
exports.getProjects = async (req, res) => {
  try {
    const { status, priority, search } = req.query;
    let query = {};

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search) query.$text = { $search: search };

    const projects = await Project.find(query).sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    console.error("Get Projects Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET a single project by ID
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json(project);
  } catch (err) {
    console.error("Get Project Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE project
exports.updateProject = async (req, res) => {
  try {
    const updateData = {
      name: req.body.name,
      description: req.body.description || "",
      status: req.body.status || "Pending",
      startDate: req.body.startDate || null,
      endDate: req.body.endDate || null,
      projectManager: req.body.projectManager || "",
      priority: req.body.priority || "Medium"
    };

    console.log("Updating Project with data:", updateData);

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!project) return res.status(404).json({ error: "Project not found" });

    console.log("Updated Project:", project);
    res.json(project);
  } catch (err) {
    console.error("Update Project Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE project
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json({ msg: "Project deleted" });
  } catch (err) {
    console.error("Delete Project Error:", err);
    res.status(500).json({ error: err.message });
  }
};