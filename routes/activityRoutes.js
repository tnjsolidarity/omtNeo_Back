const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");

// Import activity controllers only
const {
  createActivity,
  getActivities,
  getActivity,
  updateActivity,
  deleteActivity,
} = require("../controllers/activityController");

// Protect all routes
router.use(auth);

// ==================== ACTIVITY ROUTES ====================
// All routes are prefixed with /api/projects/:projectId/activities

// Get all activities for a project
router.get("/:projectId/activities", getActivities);

// Create a new activity under a project
router.post("/:projectId/activities", createActivity);

// Get a single activity
router.get("/:projectId/activities/:activityId", getActivity);

// Update an activity
router.put("/:projectId/activities/:activityId", updateActivity);

// Delete an activity
router.delete("/:projectId/activities/:activityId", deleteActivity);

module.exports = router;