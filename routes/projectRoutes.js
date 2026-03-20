const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");

// Import project controllers only
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} = require("../controllers/projectController");

// Protect all routes
router.use(auth);

// ==================== PROJECT ROUTES ====================
router.get("/", getProjects);                    // Get all projects
router.get("/:id", getProject);                  // Get single project
router.post("/", createProject);                 // Create new project
router.put("/:id", updateProject);               // Update project
router.delete("/:id", deleteProject);            // Delete project

module.exports = router;