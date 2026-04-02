const Event = require("../models/Event");
const Activity = require("../models/Activity");
const mongoose = require('mongoose');
const Counter = require("../models/Counter");

// Helper function to generate event ID
async function generateEventId() {
  const year = new Date().getFullYear();

  const counter = await Counter.findOneAndUpdate(
    { name: `eventId-${year}` },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return `EVT-${year}-${String(counter.seq).padStart(4, "0")}`;
}

// CREATE event
exports.createEvent = async (req, res) => {
  try {
    const { projectId, activityId } = req.params;
    const { 
      name, 
      description, 
      place,        // Add place field
      priority, 
      status, 
      startDate, 
      endDate, 
      assignedTo,
      estimatedHours,
      actualHours 
    } = req.body;

    console.log('Creating event for activity:', activityId);

    // Validate activityId format
    if (!mongoose.Types.ObjectId.isValid(activityId)) {
      return res.status(400).json({ error: "Invalid activity ID format" });
    }

    // Verify activity exists and belongs to the project
    const activity = await Activity.findOne({ _id: activityId, projectId: projectId });
    if (!activity) {
      return res.status(404).json({ error: "Activity not found" });
    }

    // Generate event ID
    const eventId = await generateEventId();

    // Create event
    const event = new Event({
      eventId,
      activityId: activityId,
      name: name,
      description: description || "",
      place: place || "",           // Add place field
      priority: priority || "Medium",
      status: status || "Planning", // Changed from "Not Started" to match enum
      startDate: startDate || null,
      endDate: endDate || null,
      assignedTo: assignedTo || null,
      estimatedHours: estimatedHours || null,
      actualHours: actualHours || null
    });

    const savedEvent = await event.save();
    
    // Populate assignedTo details before returning
    const populatedEvent = await Event.findById(savedEvent._id)
      .populate('assignedTo', 'name memberId role');
    
    console.log('Event created:', populatedEvent);
    res.status(201).json(populatedEvent);
  } catch (err) {
    console.error("Create Event Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET all events for an activity
exports.getEvents = async (req, res) => {
  try {
    const { projectId, activityId } = req.params;

    // Validate IDs
    if (!projectId || !activityId) {
      return res.status(400).json({ error: "Project ID and Activity ID are required" });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(activityId)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }
        
    const { priority, status, place, search } = req.query; // Add place to query params
    
    console.log('Fetching events for activity:', activityId);
    
    // Verify activity exists and belongs to the project
    const activity = await Activity.findOne({ _id: activityId, projectId: projectId });
    if (!activity) {
      return res.status(404).json({ error: "Activity not found" });
    }
    
    let query = { activityId };
    
    if (priority) query.priority = priority;
    if (status) query.status = status;
    if (place) query.place = place; // Add place filter
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { place: { $regex: search, $options: 'i' } } // Include place in search
      ];
    }
    
    const events = await Event.find(query)
      .populate('assignedTo', 'name memberId role')
      .sort({ createdAt: -1 });
    
    // Calculate event progress for the activity
    const totalEvents = events.length;
    const completedEvents = events.filter(e => e.status === "Completed").length;
    const progress = totalEvents === 0 ? 0 : Math.round((completedEvents / totalEvents) * 100);
    
    // Get unique places for filtering options
    const uniquePlaces = [...new Set(events.map(e => e.place).filter(p => p))];
    
    console.log(`Found ${events.length} events`);
    res.json({
      events,
      filters: {
        places: uniquePlaces // Return available places for dropdown options
      },
      stats: {
        total: totalEvents,
        completed: completedEvents,
        progress: progress,
        byStatus: {
          'Planning': events.filter(e => e.status === "Planning").length,
          'In Progress': events.filter(e => e.status === "In Progress").length,
          'On Hold': events.filter(e => e.status === "On Hold").length,
          'Completed': completedEvents,
          'Cancelled': events.filter(e => e.status === "Cancelled").length
        },
        byPriority: {
          'Low': events.filter(e => e.priority === "Low").length,
          'Medium': events.filter(e => e.priority === "Medium").length,
          'High': events.filter(e => e.priority === "High").length,
          'Critical': events.filter(e => e.priority === "Critical").length
        }
      }
    });
  } catch (err) {
    console.error("Get Events Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET single event
exports.getEvent = async (req, res) => {
  try {
    const { projectId, activityId, eventId } = req.params;
    
    // Verify activity exists and belongs to project
    const activity = await Activity.findOne({ _id: activityId, projectId: projectId });
    if (!activity) {
      return res.status(404).json({ error: "Activity not found" });
    }
    
    const event = await Event.findOne({ _id: eventId, activityId })
      .populate('assignedTo', 'name memberId role');
    
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    
    res.json(event);
  } catch (err) {
    console.error("Get Event Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE event
exports.updateEvent = async (req, res) => {
  try {
    const { projectId, activityId, eventId } = req.params;
    
    console.log('Updating event:', eventId);
    
    // Verify activity exists and belongs to project
    const activity = await Activity.findOne({ _id: activityId, projectId: projectId });
    if (!activity) {
      return res.status(404).json({ error: "Activity not found" });
    }
    
    // Clean the update data
    const updateData = {};
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.place !== undefined) updateData.place = req.body.place; // Add place field
    if (req.body.priority !== undefined) updateData.priority = req.body.priority;
    if (req.body.status !== undefined) updateData.status = req.body.status;
    if (req.body.startDate !== undefined) updateData.startDate = req.body.startDate || null;
    if (req.body.endDate !== undefined) updateData.endDate = req.body.endDate || null;
    if (req.body.assignedTo !== undefined) updateData.assignedTo = req.body.assignedTo || null;
    if (req.body.estimatedHours !== undefined) updateData.estimatedHours = req.body.estimatedHours || null;
    if (req.body.actualHours !== undefined) updateData.actualHours = req.body.actualHours || null;
    
    const event = await Event.findOneAndUpdate(
      { _id: eventId, activityId: activityId },
      updateData,
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name memberId role');
    
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    
    console.log('Event updated:', event);
    res.json(event);
  } catch (err) {
    console.error("Update Event Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE event
exports.deleteEvent = async (req, res) => {
  try {
    const { projectId, activityId, eventId } = req.params;
    
    // Verify activity exists and belongs to project
    const activity = await Activity.findOne({ _id: activityId, projectId: projectId });
    if (!activity) {
      return res.status(404).json({ error: "Activity not found" });
    }
    
    const event = await Event.findOneAndDelete({ _id: eventId, activityId });
    
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    
    console.log('Event deleted successfully');
    res.json({ msg: "Event deleted successfully" });
  } catch (err) {
    console.error("Delete Event Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET event statistics for an activity
exports.getEventStats = async (req, res) => {
  try {
    const { projectId, activityId } = req.params;
    
    // Verify activity exists and belongs to project
    const activity = await Activity.findOne({ _id: activityId, projectId: projectId });
    if (!activity) {
      return res.status(404).json({ error: "Activity not found" });
    }
    
    const events = await Event.find({ activityId });
    
    const totalEvents = events.length;
    const completedEvents = events.filter(e => e.status === "Completed").length;
    const inProgressEvents = events.filter(e => e.status === "In Progress").length;
    const planningEvents = events.filter(e => e.status === "Planning").length;
    const onHoldEvents = events.filter(e => e.status === "On Hold").length;
    const cancelledEvents = events.filter(e => e.status === "Cancelled").length;
    
    const totalEstimatedHours = events.reduce((sum, e) => sum + (e.estimatedHours || 0), 0);
    const totalActualHours = events.reduce((sum, e) => sum + (e.actualHours || 0), 0);
    
    // Group events by place
    const eventsByPlace = events.reduce((acc, event) => {
      if (event.place) {
        if (!acc[event.place]) {
          acc[event.place] = [];
        }
        acc[event.place].push(event);
      }
      return acc;
    }, {});
    
    res.json({
      total: totalEvents,
      completed: completedEvents,
      inProgress: inProgressEvents,
      planning: planningEvents,
      onHold: onHoldEvents,
      cancelled: cancelledEvents,
      progress: totalEvents === 0 ? 0 : Math.round((completedEvents / totalEvents) * 100),
      hours: {
        estimated: totalEstimatedHours,
        actual: totalActualHours,
        variance: totalActualHours - totalEstimatedHours
      },
      places: {
        total: Object.keys(eventsByPlace).length,
        breakdown: Object.keys(eventsByPlace).map(place => ({
          name: place,
          count: eventsByPlace[place].length,
          events: eventsByPlace[place].map(e => ({ _id: e._id, name: e.name, status: e.status }))
        }))
      }
    });
  } catch (err) {
    console.error("Get Event Stats Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// NEW: Get all unique places (for dropdown options)
exports.getUniquePlaces = async (req, res) => {
  try {
    const { projectId, activityId } = req.params;
    
    // Verify activity exists
    const activity = await Activity.findOne({ _id: activityId, projectId: projectId });
    if (!activity) {
      return res.status(404).json({ error: "Activity not found" });
    }
    
    // Get distinct places from events
    const places = await Event.distinct('place', { activityId, place: { $ne: "" } });
    
    res.json({
      places: places.sort(),
      total: places.length
    });
  } catch (err) {
    console.error("Get Unique Places Error:", err);
    res.status(500).json({ error: err.message });
  }
};