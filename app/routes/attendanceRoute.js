const express = require('express');
const router = express.Router();
const AttendanceController = require('../controllers/attendanceController');

const attendanceController = AttendanceController;

// POST /classes/:classId/attendance/bulk -> attendance controller
router.post('/:classId/attendance/bulk', (req, res) => {
  attendanceController.postBulkAttendance(req, res);
});

// PATCH /classes/:classId/attendance -> attendance controller
router.patch('/:classId/attendance', (req, res) => {
  attendanceController.patchAttendance(req, res);
});

// PATCH /classes/attendance  (accepts attendance_id in body)
router.patch('/attendance', (req, res) => {
  attendanceController.patchAttendance(req, res);
});

module.exports = router;