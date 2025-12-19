const express = require('express');
const router = express.Router();
const StudentController = require('../controllers/studentController');
const ScheduleController = require('../controllers/scheduleController');
const CourseClassController = require('../controllers/courseClassController');
const AuthMiddleware = require('../middlewares/authMiddleware');
const selfOnly = require('../middlewares/userurlMiddleware');
const roleGuard = require('../middlewares/roleguard');  

router.use(AuthMiddleware);
router.use(roleGuard(['student'], { allowAdmin: false }));

// --- VIEW ROUTES ---
router.get('/', StudentController.index);
router.get('/home', StudentController.index);
router.get('/timetable', StudentController.getTimetable);
router.get('/results', StudentController.getResults);
router.get('/change_password', StudentController.getChangePassword);

// --- API ROUTES - STUDENT PROFILE & ENROLLMENTS ---
router.get('/api/profile', StudentController.getProfile);
router.get('/api/:studentId/enrollmentStudent', selfOnly({ paramKey: 'studentId' }),StudentController.getEnrollmentsByStudent);
router.get('/api/student/classes', StudentController.getStudentClasses);

// --- API ROUTES - COURSES ---
// Students can view courses to know what they can enroll in
router.get('/api/courses', CourseClassController.getCourses);
router.get('/api/courses/simple', CourseClassController.getCoursesSimple);
router.get('/api/courses/:courseId', CourseClassController.getCourseById);

router.get('/api/classes/available', CourseClassController.getClasses);

// View semesters
router.get('/api/semesters/simple', CourseClassController.getSemestersSimple);
router.get('/api/semesters/active', CourseClassController.getActiveSemester);

// --- TIMETABLE ---
router.get('/timetable', ScheduleController.getStudentTimetable);

module.exports = router;