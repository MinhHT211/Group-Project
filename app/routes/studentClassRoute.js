const express = require('express');
const StudentClassController = require('../controllers/studentClassController');
const AttendanceController = require('../controllers/attendanceController');
// const authMiddleware = require('../middlewares/authMiddleware'); // Commented out for now

const router = express.Router();
const studentClassController = StudentClassController;
const attendanceController = AttendanceController;

// GET /classes/:classId/students
router.get('/:classId/students', (req, res) => {
  studentClassController.getStudentsByClass(req, res);
});

// GET /classes/:classId/students/paginated
router.get('/:classId/students/paginated', (req, res) => {
  studentClassController.getStudentsByClassPaginated(req, res);
});

// GET /classes/:classId/students/attendance
router.get('/:classId/students/attendance', (req, res) => {
  studentClassController.getStudentsByClassWithAttendance(req, res);
});

// GET /classes/:classId/students/grades
router.get('/:classId/students/grades', (req, res) => {
  studentClassController.getStudentsByClassWithGrades(req, res);
});

// GET /classes/:classId/students/summary
router.get('/:classId/students/summary', (req, res) => {
  studentClassController.getStudentsByClassWithSummary(req, res);
});

// GET /classes/:classId/students/all
router.get('/:classId/students/all', (req, res) => {
  studentClassController.getAllStudentsInClass(req, res);
});

// GET /classes/:classId/schedules
router.get('/:classId/schedules', (req, res) => {
  studentClassController.getClassByIdWithSchedules(req, res);
});

module.exports = router;