// In your projectRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware"); // Import auth middleware

const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} = require("../controllers/projectController");

// Protect all routes with auth middleware
router.get("/", auth, getProjects);
router.get("/:id", auth, getProject);
router.post("/", auth, createProject);
router.put("/:id", auth, updateProject);
router.delete("/:id", auth, deleteProject);

module.exports = router;