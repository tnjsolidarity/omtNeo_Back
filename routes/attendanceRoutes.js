const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");

// Import attendance controllers
const {
  createAttendance,
  getAllAttendances,
  getAttendanceById,
  updateAttendance,
  deleteAttendance,
  getAttendanceStats,
  updateInviteeStatus,
  bulkUpdateInviteeStatus
} = require("../controllers/attendanceController");

// Protect all routes
router.use(auth);

// ==================== ATTENDANCE ROUTES ====================

// Attendance CRUD routes
router.post('/', createAttendance);
router.get('/', getAllAttendances);
router.get('/stats', getAttendanceStats);
router.get('/:id', getAttendanceById);
router.put('/:id', updateAttendance);
router.delete('/:id', deleteAttendance);

// Invitee status update routes
router.put('/:attendanceId/incharge/:inchargeId/invitee/:inviteeId', updateInviteeStatus);
router.put('/:attendanceId/bulk-update', bulkUpdateInviteeStatus);

module.exports = router;