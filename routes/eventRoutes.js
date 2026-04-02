const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");

// Import event controllers
const {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  getEventStats,
  getUniquePlaces  // Add new controller
} = require("../controllers/eventController");

// Protect all routes
router.use(auth);

// ==================== EVENT ROUTES ====================

// Get all events for an activity
router.get("/:projectId/activities/:activityId/events", getEvents);

// Get event statistics for an activity
router.get("/:projectId/activities/:activityId/events/stats", getEventStats);

// Get unique places for an activity (NEW ROUTE)
router.get("/:projectId/activities/:activityId/events/places", getUniquePlaces);

// Create a new event under an activity
router.post("/:projectId/activities/:activityId/events", createEvent);

// Get a single event
router.get("/:projectId/activities/:activityId/events/:eventId", getEvent);

// Update an event
router.put("/:projectId/activities/:activityId/events/:eventId", updateEvent);

// Delete an event
router.delete("/:projectId/activities/:activityId/events/:eventId", deleteEvent);

module.exports = router;