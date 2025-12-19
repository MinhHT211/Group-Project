'use strict';
const express = require('express');
const router = express.Router();
const LecturerController = require('../controllers/lecturerController');
const studentClassRoute = require('./studentClassRoute');
const ScheduleController = require('../controllers/scheduleController');
const CourseClassController = require('../controllers/courseClassController');
const AuthMiddleware = require('../middlewares/authMiddleware');
const roleGuard = require('../middlewares/roleguard');

router.use(AuthMiddleware);
router.use(roleGuard(['lecturer'], { allowAdmin: false }));

// ---VIEW ROUTES---

router.get('/', LecturerController.index);
router.get('/home', LecturerController.index);
router.get('/classes', LecturerController.getClass);
router.get('/attendance', LecturerController.getAttendance);
router.get('/attendance/classes/:classId', LecturerController.getCheckAttendance);

router.get('/classes/:classId/attendance', (req, res) => {
  return res.redirect(`/lecturer/attendance/classes/${req.params.classId}`);
});

router.get('/timetable', LecturerController.getSchedule);
router.get('/schedule', ScheduleController.getLecturerTimetable);
router.get('/change_password', LecturerController.getChangePassword);

// Class
router.get('/class/:classId/students', LecturerController.getClassStudents);

// Academic Management Pages
router.get('/course', CourseClassController.getCoursesPageLecturer);
router.get('/course/semester', CourseClassController.getSemestersPageLecturer);
router.get('/course/semester/class', CourseClassController.getClassesPageLecturer);
router.get('/course/semester/class/students', CourseClassController.getClassStudentsPageLecturer);

// --- API ROUTES ---

// Attendance
router.post('/attendance/bulk-update', LecturerController.bulkUpdateAttendanceApi);

// Lecturer Management
router.get('/api/lecturer/classes', LecturerController.getLecturerClasses);
router.get('/api/grade-weights/:classId', LecturerController.getGradeWeights);

// Check Head Lecturer
router.get('/api/check-head-lecturer', CourseClassController.checkHeadLecturer);

// Course (Read-only for lecturers)
router.get('/api/courses', CourseClassController.getCourses);
router.get('/api/courses/simple', CourseClassController.getCoursesSimple);
router.get('/api/courses/:courseId', CourseClassController.getCourseById);

// Class (Read-only for lecturers)
router.get('/api/classes', CourseClassController.getClasses);
router.get('/api/classes/:classId', CourseClassController.getClassById);
router.get('/api/classes/:classId/students', CourseClassController.getClassStudents);

// Semester (Read-only for lecturers)
router.get('/api/semesters', CourseClassController.getSemesters);
router.get('/api/semesters/simple', CourseClassController.getSemestersSimple);
router.get('/api/semesters/active', CourseClassController.getActiveSemester);
router.get('/api/semesters/:semesterId', CourseClassController.getSemesterById);

// Mount class 
router.use('/classes', studentClassRoute);

module.exports = router;