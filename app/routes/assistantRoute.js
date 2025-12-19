const express = require('express');
const router = express.Router();
const AssistantController = require('../controllers/assistantController');
const CourseClassController = require('../controllers/courseClassController');
const AuthMiddleware = require('../middlewares/authMiddleware');
const scheduleController = require('../controllers/scheduleController');
const DepartmentController = require('../controllers/departmentController')
const upload = require('../middlewares/uploadExcel');
const roleGuard = require('../middlewares/roleguard');

router.use(AuthMiddleware);
router.use(roleGuard(['assistant'], { allowAdmin: false }));

// View - ASSISTANT PAGES
router.get('/', AssistantController.index);
router.get('/home', AssistantController.index);
router.get('/schedule', AssistantController.getSchedule);
router.get('/lecturer', AssistantController.getLecturerPage);
router.get('/change_password', AssistantController.getChangePassword);

// Academic Management Pages
router.get('/course', CourseClassController.getCoursePage);
router.get('/course/semester', CourseClassController.getSemesterPage);
router.get('/course/semester/class', CourseClassController.getClassPage);
router.get('/course/semester/class/students', CourseClassController.getClassStudentsPage);

// Student Management Pages
router.get('/student', AssistantController.getStudent);
router.get('/students/create', AssistantController.getStudentCreatePage);
router.get('/students/:userId/edit', AssistantController.getStudentEditPage);

// Grade Management Pages
router.get('/grade', AssistantController.getAllClassesForGrade);
router.get('/grade/:classId', AssistantController.renderGradeImportPage);


// API - LECTURER Management
router.get('/api/lecturers', AssistantController.getLecturers);
router.get('/api/lecturers/:userId', AssistantController.getLecturerById);

// API - STUDENT Management
router.get('/api/students', AssistantController.getStudents);
router.get('/api/students/available', CourseClassController.getAvailableStudents);
router.get('/api/students/:userId', AssistantController.getStudentById);
router.post('/api/students', AssistantController.createStudent);
router.put('/api/students/:userId', AssistantController.updateStudent);
router.delete('/api/students/:userId', AssistantController.deleteStudent);
router.post('/api/student/:userId/restore', AssistantController.restoreStudent);

// API - SEMESTER Management (Assistant only)
router.get('/api/semesters', CourseClassController.getSemesters);
router.get('/api/semesters/simple', CourseClassController.getSemestersSimple);
router.get('/api/semesters/active', CourseClassController.getActiveSemester);
router.get('/api/semesters/:semesterId', CourseClassController.getSemesterById);
router.post('/api/semesters', CourseClassController.createSemester);
router.put('/api/semesters/:semesterId', CourseClassController.updateSemester);
router.delete('/api/semesters/:semesterId', CourseClassController.deleteSemester);

// API - COURSE Management (Assistant only)
router.get('/api/courses', CourseClassController.getCourses);
router.get('/api/courses/simple', CourseClassController.getCoursesSimple);
router.get('/api/courses/:courseId', CourseClassController.getCourseById);
router.post('/api/courses', CourseClassController.createCourse);
router.put('/api/courses/:courseId', CourseClassController.updateCourse);
router.delete('/api/courses/:courseId', CourseClassController.deleteCourse);

// API - CLASS Management (Assistant only)
router.get('/api/classes', CourseClassController.getClasses);
router.get('/api/classes/:classId', CourseClassController.getClassById);
router.get('/api/classes/:classId/students', CourseClassController.getClassStudents);
router.post('/api/classes', CourseClassController.createClass);
router.put('/api/classes/:classId', CourseClassController.updateClass);
router.delete('/api/classes/:classId', CourseClassController.deleteClass);

// API - ENROLLMENT Management (Assistant only)
router.post('/api/classes/:classId/students', CourseClassController.addStudentsToClass);
router.delete('/api/classes/:classId/students/:studentId', CourseClassController.removeStudentFromClass);
router.put('/api/classes/:classId/students/:studentId/enrollment', CourseClassController.updateEnrollmentType);

// API - TIMETABLE
router.get('/timetable', scheduleController.getAssistantTimetable);

// Grades - Bulk update
router.post('/grades/bulk-update', AssistantController.bulkUpdateGrades
);

// Grades - Weight update
router.post('/grades/weights/update', AssistantController.updateGradeWeights
);
// API - GRADE MANAGEMENT
router.get('/:classId/students/grades/export', AssistantController.exportGradesTemplate);
router.post('/grade/:classId/students/grades/import', upload.single('file'), AssistantController.importGradesFromExcel
);

// API - MAJORS
router.get('/api/majors', DepartmentController.getMajors)
router.get('/api/department/:departmentId/majors', DepartmentController.getMajorsByDepartment)

module.exports = router;