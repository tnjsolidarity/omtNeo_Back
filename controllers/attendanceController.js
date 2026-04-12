const Attendance = require('../models/Attendance');
const mongoose = require('mongoose');
const Counter = require("../models/Counter");

// Helper function to generate attendance ID
async function generateAttendanceId() {
  const year = new Date().getFullYear();

  const counter = await Counter.findOneAndUpdate(
    { name: `attendanceId-${year}` },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return `ATT-${year}-${String(counter.seq).padStart(4, "0")}`;
}

// Create attendance
exports.createAttendance = async (req, res) => {
  try {
    const {
      description,
      project,
      activity,
      event,
      date,
      location,
      incharges
    } = req.body;

    console.log('Received attendance data:', req.body);
    console.log('Request admin (full):', req.admin);
    console.log('Request admin keys:', req.admin ? Object.keys(req.admin) : 'undefined');
    if (!project) {
      return res.status(400).json({ error: 'Project is required' });
    }
    if (!activity) {
      return res.status(400).json({ error: 'Activity is required' });
    }
    if (!event) {
      return res.status(400).json({ error: 'Event is required' });
    }

    // Get user ID from req.admin (set by authMiddleware)
    // The JWT token contains { id: admin._id } from login
    let userId;
    
    if (req.admin) {
      // Try different property names that might exist in the JWT
      userId = req.admin.id || req.admin._id || req.admin.userId || req.admin.adminId;
    }
    
    console.log('Extracted userId:', userId);
    
    if (!userId) {
      console.log('User ID extraction failed. req.admin:', req.admin);
      return res.status(401).json({ error: 'User not authenticated - no ID found' });
    }

    // Convert date string to Date object if needed
    let attendanceDate = new Date();
    if (date) {
      const dateObj = new Date(date);
      if (!isNaN(dateObj.getTime())) {
        attendanceDate = dateObj;
      }
    }

    // Generate unique attendance ID
    const attendanceId = await generateAttendanceId();

    // Create attendance with proper data structure
    const attendanceData = {
      attendanceId,
      description,
      project,
      activity,
      event,
      date: attendanceDate,
      location: location || '',
      incharges: incharges || [],
      createdBy: userId
    };

    console.log('Formatted attendance data:', attendanceData);

    const attendance = new Attendance(attendanceData);
    
    // Calculate stats before saving
    // The pre-save middleware will handle this, but we can also do it manually
    await attendance.save();

    // Populate references for response
    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('project', 'name')
      .populate('activity', 'name')
      .populate('event', 'name')
      .populate('incharges.user', 'name phone')
      .populate('incharges.invitees.user', 'name phone')
      .populate('createdBy', 'username');

    res.status(201).json({
      success: true,
      data: populatedAttendance
    });
  } catch (error) {
    console.error('Error creating attendance:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error creating attendance', 
      error: error.message 
    });
  }
};

// Get all attendances with filters
exports.getAllAttendances = async (req, res) => {
  try {
    const { status, project, activity, event, startDate, endDate } = req.query;
    
    let query = {};
    
    if (status) query.status = status;
    if (project) query.project = project;
    if (activity) query.activity = activity;
    if (event) query.event = event;
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const attendances = await Attendance.find(query)
      .populate('project', 'name code')
      .populate('activity', 'name')
      .populate('event', 'name date')
      .populate('incharges.user', 'name')
      .populate('incharges.invitees.user', 'name')
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: attendances.length,
      data: attendances
    });
  } catch (error) {
    console.error('Error fetching attendances:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendances',
      error: error.message
    });
  }
};

// Get single attendance by ID
exports.getAttendanceById = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id)
      .populate('project', 'name code description')
      .populate('activity', 'name description')
      .populate('event', 'name date description')
      .populate('incharges.user', 'name phone')
      .populate('incharges.invitees.user', 'name phone')
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username');
    
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: attendance
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance',
      error: error.message
    });
  }
};

// Update attendance
exports.updateAttendance = async (req, res) => {
  try {
    const {
      description,
      project,
      activity,
      event,
      incharges,
      date,
      location,
      status
    } = req.body;
    
    // Get user ID from req.admin
    const userId = req.admin?.id || req.admin?.userId || req.admin?._id;
    
    const attendance = await Attendance.findById(req.params.id);
    
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance not found'
      });
    }
    
    // Update fields
    if (description) attendance.description = description;
    if (project) attendance.project = project;
    if (activity) attendance.activity = activity;
    if (event) attendance.event = event;
    if (incharges) attendance.incharges = incharges;
    if (date) attendance.date = date;
    if (location) attendance.location = location;
    if (status) attendance.status = status;
    
    if (userId) attendance.updatedBy = userId;
    attendance.updatedAt = new Date();
    
    // Recalculate statistics
    attendance.calculateStats();
    
    await attendance.save();
    
    const updatedAttendance = await Attendance.findById(attendance._id)
      .populate('project', 'name code')
      .populate('activity', 'name')
      .populate('event', 'name date')
      .populate('incharges.user', 'name')
      .populate('incharges.invitees.user', 'name')
      .populate('createdBy', 'username');
    
    res.status(200).json({
      success: true,
      message: 'Attendance updated successfully',
      data: updatedAttendance
    });
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating attendance',
      error: error.message
    });
  }
};

// Delete attendance
exports.deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndDelete(req.params.id);
    
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Attendance deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting attendance',
      error: error.message
    });
  }
};

// Get attendance statistics
exports.getAttendanceStats = async (req, res) => {
  try {
    const stats = await Attendance.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalInvitees: { $sum: '$totalInvitees' },
          totalPresent: { $sum: '$totalPresent' },
          totalAbsent: { $sum: '$totalAbsent' },
          totalLate: { $sum: '$totalLate' }
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance statistics',
      error: error.message
    });
  }
};

// Update invitee status
exports.updateInviteeStatus = async (req, res) => {
  try {
    const { attendanceId, inchargeId, inviteeId } = req.params;
    const { status, checkInTime, checkOutTime, remarks } = req.body;
    
    // Get user ID from req.admin
    const userId = req.admin?.id || req.admin?.userId || req.admin?._id;
    
    const attendance = await Attendance.findById(attendanceId);
    
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance not found'
      });
    }
    
    // Find the incharge and invitee
    let found = false;
    attendance.incharges.forEach(incharge => {
      if (incharge._id.toString() === inchargeId) {
        incharge.invitees.forEach(invitee => {
          if (invitee._id.toString() === inviteeId) {
            invitee.status = status;
            if (checkInTime) invitee.checkInTime = checkInTime;
            if (checkOutTime) invitee.checkOutTime = checkOutTime;
            if (remarks) invitee.remarks = remarks;
            if (userId) invitee.updatedBy = userId;
            invitee.statusUpdatedAt = new Date();
            found = true;
          }
        });
      }
    });
    
    if (!found) {
      return res.status(404).json({
        success: false,
        message: 'Invitee not found'
      });
    }
    
    // Recalculate statistics
    attendance.calculateStats();
    if (userId) attendance.updatedBy = userId;
    
    await attendance.save();
    
    res.status(200).json({
      success: true,
      message: 'Invitee status updated successfully',
      data: attendance
    });
  } catch (error) {
    console.error('Error updating invitee status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating invitee status',
      error: error.message
    });
  }
};

// Bulk update invitee statuses
exports.bulkUpdateInviteeStatus = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { updates } = req.body;
    
    // Get user ID from req.admin
    const userId = req.admin?.id || req.admin?.userId || req.admin?._id;
    
    const attendance = await Attendance.findById(attendanceId);
    
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance not found'
      });
    }
    
    updates.forEach(update => {
      attendance.incharges.forEach(incharge => {
        if (incharge._id.toString() === update.inchargeId) {
          incharge.invitees.forEach(invitee => {
            if (invitee._id.toString() === update.inviteeId) {
              invitee.status = update.status;
              if (update.checkInTime) invitee.checkInTime = update.checkInTime;
              if (update.remarks) invitee.remarks = update.remarks;
              if (userId) invitee.updatedBy = userId;
              invitee.statusUpdatedAt = new Date();
            }
          });
        }
      });
    });
    
    attendance.calculateStats();
    if (userId) attendance.updatedBy = userId;
    
    await attendance.save();
    
    res.status(200).json({
      success: true,
      message: 'Invitee statuses updated successfully',
      data: attendance
    });
  } catch (error) {
    console.error('Error bulk updating invitee status:', error);
    res.status(500).json({
      success: false,
      message: 'Error bulk updating invitee status',
      error: error.message
    });
  }
};