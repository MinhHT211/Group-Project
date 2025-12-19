const navigation = require('../config/navigation');
const CourseService = require('../services/courseService');
const ClassService = require('../services/classService');
const SemesterService = require('../services/semesterService');
const { Departments } = require('../models');
const { parseErrorMessage } = require('../utils/errorHelper');

class CourseClassController {
    constructor() {
        this.courseService = CourseService;
        this.classService = ClassService;
        this.semesterService = SemesterService;
    }

    async isHeadLecturer(userId, departmentId) {
        try {
            if (!userId || !departmentId) return false;
            
            const department = await Departments.findOne({
                where: { 
                    department_id: departmentId,
                    head_lecturer_id: userId
                }
            });
            
            return !!department;
        } catch (error) {
            console.error('Error checking head lecturer status:', error);
            return false;
        }
    }

    getUserDepartmentInfo(user) {
        let departmentId = null;
        let isAssistant = false;
        let isLecturer = false;
        let userId = user?.user_id;

        if (user?.Assistant) {
            departmentId = user.Assistant.department_id;
            isAssistant = true;
        } else if (user?.Lecturer) {
            departmentId = user.Lecturer.department_id;
            isLecturer = true;
        }

        return { departmentId, isAssistant, isLecturer, userId };
    }

    // --- VIEWS ---
    getCoursePage = (req, res) => {
        res.render('management/assistant/academic/course', {
            layout: 'layouts/management',
            pageCSS: '/css/modules/management/assistant/academic.css',
            pageJS: '/js/modules/assistant/academic/course.js',
            title: 'Quản lý Khóa học',
            role: req.user.role,
            navItems: navigation[req.user.role],
            user: req.user
        });
    }

    getSemesterPage = (req, res) => {
        res.render('management/assistant/academic/semester', {
            layout: 'layouts/management',
            pageCSS: '/css/modules/management/assistant/academic.css',
            pageJS: '/js/modules/assistant/academic/semester.js',
            title: 'Quản lý Học kỳ',
            role: req.user.role,
            navItems: navigation[req.user.role],
            user: req.user
        });
    }

    getClassPage = (req, res) => {
        res.render('management/assistant/academic/class', {
            layout: 'layouts/management',
            pageCSS: '/css/modules/management/assistant/academic.css',
            pageJS: '/js/modules/assistant/academic/class.js',
            title: 'Quản lý Lớp học',
            role: req.user.role,
            navItems: navigation[req.user.role],
            user: req.user
        });
    }

    getClassStudentsPage = (req, res) => {
        res.render('management/assistant/academic/classStudent', {
            layout: 'layouts/management',
            pageCSS: '/css/modules/management/assistant/academic.css',
            pageJS: '/js/modules/assistant/academic/classStudents.js',
            title: 'Quản lý Học sinh trong Lớp',
            role: req.user.role,
            navItems: navigation[req.user.role],
            user: req.user
        });
    }

    // --- VIEW LECTURER ---
    getCoursesPageLecturer = (req, res) => {
        res.render('management/lecturer/academic/course', {
            layout: 'layouts/management',
            pageCSS: '/css/modules/management/lecturer/academic.css',
            pageJS: '/js/modules/lecturer/courses.js',
            title: 'Khóa học - Giảng viên',
            role: 'lecturer',
            navItems: navigation.lecturer,
            user: req.user
        });
    }

    getSemestersPageLecturer = (req, res) => {
        res.render('management/lecturer/academic/semester', {
            layout: 'layouts/management',
            pageCSS: '/css/modules/management/lecturer/academic.css',
            pageJS: '/js/modules/lecturer/semesters.js',
            title: 'Học kỳ - Giảng viên',
            role: 'lecturer',
            navItems: navigation.lecturer,
            user: req.user
        });
    }

    getClassesPageLecturer = (req, res) => {
        res.render('management/lecturer/academic/class', {
            layout: 'layouts/management',
            pageCSS: '/css/modules/management/lecturer/academic.css',
            pageJS: '/js/modules/lecturer/classes.js',
            title: 'Lớp học - Giảng viên',
            role: 'lecturer',
            navItems: navigation.lecturer,
            user: req.user
        });
    }

    getClassStudentsPageLecturer = (req, res) => {
        res.render('management/lecturer/academic/classStudent', {
            layout: 'layouts/management',
            pageCSS: '/css/modules/management/lecturer/academic.css',
            pageJS: '/js/modules/lecturer/classStudents.js',
            title: 'Học sinh trong lớp - Giảng viên',
            role: 'lecturer',
            navItems: navigation.lecturer,
            user: req.user
        });
    }

    // --- NEW: CHECK HEAD LECTURER STATUS ---
    checkHeadLecturer = async (req, res) => {
        try {
            const { departmentId, isLecturer, userId } = this.getUserDepartmentInfo(req.user);
            
            if (!isLecturer || !departmentId) {
                return res.status(200).json({
                    success: true,
                    isHeadLecturer: false
                });
            }

            const isHead = await this.isHeadLecturer(userId, departmentId);
            
            return res.status(200).json({
                success: true,
                isHeadLecturer: isHead
            });
        } catch (error) {
            console.error('Controller Error - checkHeadLecturer:', error);
            return res.status(500).json({
                success: false,
                isHeadLecturer: false,
                message: 'Internal server error',
                error: parseErrorMessage(error)
            });
        }
    }

    // --- SEMESTER API ---
    getSemesters = async (req, res) => {
        try {
            const { page, limit, search, is_active, academic_year, courseId } = req.query;
            const options = {
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10,
                search: search || null,
                is_active: is_active !== undefined ? is_active === 'true' : null,
                academic_year: academic_year || null,
                course_id: courseId ? parseInt(courseId) : null
            };

            // Get user's department info
            const { departmentId, isLecturer, userId } = this.getUserDepartmentInfo(req.user);
            
            // Check if head lecturer
            let isHeadLecturer = false;
            if (isLecturer && departmentId) {
                isHeadLecturer = await this.isHeadLecturer(userId, departmentId);
            }

            // Filter semesters based on role
            let lecturerId = null;
            if (isLecturer && !isHeadLecturer) {
                // Regular lecturer: only semesters they teach in
                lecturerId = userId;
            }
            
            const result = await this.semesterService.getAllSemesters(options, lecturerId);
            return res.status(200).json(result);
        } catch (error) {
            console.error('Controller Error - getSemesters:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: parseErrorMessage(error)
            });
        }
    }

    getSemesterById = async (req, res) => {
        try {
            const semesterId = parseInt(req.params.semesterId);

            if (!semesterId || isNaN(semesterId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid semester ID'
                });
            }

            const result = await this.semesterService.getSemesterById(semesterId);
            return res.status(200).json(result);
        } catch (error) {
            console.error('Controller Error - getSemesterById:', error);
            const errorMessage = parseErrorMessage(error);

            if (error.message.includes('not found')) {
                return res.status(404).json({
                    success: false,
                    message: errorMessage
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: errorMessage
            });
        }
    }

    getSemestersSimple = async (req, res) => {
        try {
            const result = await this.semesterService.getSemestersSimple();
            return res.status(200).json(result);
        } catch (error) {
            console.error('Controller Error - getSemestersSimple:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: parseErrorMessage(error)
            });
        }
    }

    getActiveSemester = async (req, res) => {
        try {
            const result = await this.semesterService.getActiveSemester();
            return res.status(200).json(result);
        } catch (error) {
            console.error('Controller Error - getActiveSemester:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: parseErrorMessage(error)
            });
        }
    }

    createSemester = async (req, res) => {
        try {
            if (req.user.role !== 'assistant') {
                return res.status(403).json({
                    success: false,
                    message: 'Only assistants can create semesters'
                });
            }

            const semesterData = req.body;

            if (!semesterData) {
                return res.status(400).json({
                    success: false,
                    message: 'Semester data is required'
                });
            }

            const result = await this.semesterService.createSemester(semesterData);
            return res.status(201).json(result);
        } catch (error) {
            console.error('Controller Error - createSemester:', error);
            const errorMessage = parseErrorMessage(error);

            if (error.message.includes('required') || 
                error.message.includes('Invalid') ||
                error.message.includes('already exists')) {
                return res.status(400).json({
                    success: false,
                    message: errorMessage
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: errorMessage
            });
        }
    }

    updateSemester = async (req, res) => {
        try {
            if (req.user.role !== 'assistant') {
                return res.status(403).json({
                    success: false,
                    message: 'Only assistants can update semesters'
                });
            }

            const semesterId = parseInt(req.params.semesterId);

            if (!semesterId || isNaN(semesterId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid semester ID'
                });
            }

            const semesterData = req.body;

            if (!semesterData || Object.keys(semesterData).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No update data provided'
                });
            }

            const result = await this.semesterService.updateSemester(semesterId, semesterData);
            return res.status(200).json(result);
        } catch (error) {
            console.error('Controller Error - updateSemester:', error);
            const errorMessage = parseErrorMessage(error);

            if (error.message.includes('not found')) {
                return res.status(404).json({
                    success: false,
                    message: errorMessage
                });
            }

            if (error.message.includes('required') || 
                error.message.includes('Invalid') ||
                error.message.includes('already exists')) {
                return res.status(400).json({
                    success: false,
                    message: errorMessage
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: errorMessage
            });
        }
    }

    deleteSemester = async (req, res) => {
        try {
            if (req.user.role !== 'assistant') {
                return res.status(403).json({
                    success: false,
                    message: 'Only assistants can delete semesters'
                });
            }

            const semesterId = parseInt(req.params.semesterId);

            if (!semesterId || isNaN(semesterId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid semester ID'
                });
            }

            const result = await this.semesterService.deleteSemester(semesterId);
            return res.status(200).json(result);
        } catch (error) {
            console.error('Controller Error - deleteSemester:', error);
            const errorMessage = parseErrorMessage(error);

            if (error.message.includes('not found')) {
                return res.status(404).json({
                    success: false,
                    message: errorMessage
                });
            }

            if (error.message.includes('Cannot delete')) {
                return res.status(400).json({
                    success: false,
                    message: errorMessage
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: errorMessage
            });
        }
    }

    // --- COURSE API ---
    getCourses = async (req, res) => {
        try {
            const { page, limit, search, department_id, course_type, level, is_active } = req.query;
            const options = {
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10,
                search: search || null,
                department_id: department_id ? parseInt(department_id) : null,
                course_type: course_type || null,
                level: level || null,
                is_active: is_active !== undefined ? is_active === 'true' : null
            };

            // Get user's department info
            const { departmentId, isLecturer, userId } = this.getUserDepartmentInfo(req.user);
            
            // Check if head lecturer
            let isHeadLecturer = false;
            if (isLecturer && departmentId) {
                isHeadLecturer = await this.isHeadLecturer(userId, departmentId);
            }

            // Head lecturer: can see all department courses
            // Regular lecturer: only see courses they teach
            let userDepartmentId = null;
            let filterByLecturer = false;

            // If user is assistant: force department filter to assistant's department
            if (req.user.role === 'assistant') {
                const assistantDept = req.user.Assistant?.department_id || null;
                if (!assistantDept) {
                    return res.status(403).json({
                        success: false,
                        message: 'Assistant does not belong to a department'
                    });
                }
                // Override department filter (do not allow assistant to query other departments)
                options.department_id = assistantDept;
                userDepartmentId = assistantDept;
            }

            if (isLecturer) {
                userDepartmentId = userDepartmentId || departmentId;
                if (!isHeadLecturer) {
                    filterByLecturer = true;
                }
            }
            
            const result = await this.courseService.getAllCourses(
                options, 
                userDepartmentId,
                filterByLecturer ? userId : null
            );
            return res.status(200).json(result);
        } catch (error) {
            console.error('Controller Error - getCourses:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: parseErrorMessage(error)
            });
        }
    }

    getCourseById = async (req, res) => {
        try {
            const courseId = parseInt(req.params.courseId);

            if (!courseId || isNaN(courseId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid course ID'
                });
            }

            const result = await this.courseService.getCourseById(courseId);

            // If assistant, ensure the course belongs to assistant's department
            if (req.user.role === 'assistant') {
                const assistantDept = req.user.Assistant?.department_id || null;
                const courseDept = result?.data?.department?.department_id || null;
                if (!assistantDept || courseDept !== assistantDept) {
                    return res.status(403).json({
                        success: false,
                        message: 'Forbidden: cannot access course outside your department'
                    });
                }
            }

            return res.status(200).json(result);
        } catch (error) {
            console.error('Controller Error - getCourseById:', error);
            const errorMessage = parseErrorMessage(error);
            
            if (error.message.includes('not found')) {
                return res.status(404).json({
                    success: false,
                    message: errorMessage
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: errorMessage
            });
        }
    }

    createCourse = async (req, res) => {
        try {
            if (req.user.role !== 'assistant') {
                return res.status(403).json({
                    success: false,
                    message: 'Only assistants can create courses'
                });
            }

            const courseData = req.body;

            if (!courseData) {
                return res.status(400).json({
                    success: false,
                    message: 'Course data is required'
                });
            }

            const creatorDepartmentId = req.user.Assistant?.department_id;
            const result = await this.courseService.createCourse(courseData, creatorDepartmentId);
            return res.status(201).json(result);
        } catch (error) {
            console.error('Controller Error - createCourse:', error);
            const errorMessage = parseErrorMessage(error);

            if (error.message.includes('required') || 
                error.message.includes('Invalid') ||
                error.message.includes('already exists') ||
                error.message.includes('must be')) {
                return res.status(400).json({
                    success: false,
                    message: errorMessage
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: errorMessage
            });
        }
    }

    updateCourse = async (req, res) => {
        try {
            if (req.user.role !== 'assistant') {
                return res.status(403).json({
                    success: false,
                    message: 'Only assistants can update courses'
                });
            }

            const courseId = parseInt(req.params.courseId);

            if (!courseId || isNaN(courseId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid course ID'
                });
            }

            const courseData = req.body;

            if (!courseData || Object.keys(courseData).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No update data provided'
                });
            }

            const updaterDepartmentId = req.user.Assistant?.department_id;
            const result = await this.courseService.updateCourse(
                courseId,
                courseData,
                updaterDepartmentId
            );
            return res.status(200).json(result);
        } catch (error) {
            console.error('Controller Error - updateCourse:', error);
            const errorMessage = parseErrorMessage(error);

            if (error.message.includes('not found')) {
                return res.status(404).json({
                    success: false,
                    message: errorMessage
                });
            }

            if (error.message.includes('required') || 
                error.message.includes('Invalid') ||
                error.message.includes('already exists') ||
                error.message.includes('Cannot change') ||
                error.message.includes('must be')) {
                return res.status(400).json({
                    success: false,
                    message: errorMessage
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: errorMessage
            });
        }
    }

    deleteCourse = async (req, res) => {
        try {
            if (req.user.role !== 'assistant') {
                return res.status(403).json({
                    success: false,
                    message: 'Only assistants can delete courses'
                });
            }

            const courseId = parseInt(req.params.courseId);

            if (!courseId || isNaN(courseId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid course ID'
                });
            }

            const deleterDepartmentId = req.user.Assistant?.department_id;
            const result = await this.courseService.deleteCourse(courseId, deleterDepartmentId);
            return res.status(200).json(result);
        } catch (error) {
            console.error('Controller Error - deleteCourse:', error);
            const errorMessage = parseErrorMessage(error);

            if (error.message.includes('not found')) {
                return res.status(404).json({
                    success: false,
                    message: errorMessage
                });
            }

            if (error.message.includes('Cannot delete')) {
                return res.status(400).json({
                    success: false,
                    message: errorMessage
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: errorMessage
            });
        }
    }

    getCoursesSimple = async (req, res) => {
        try {
            const { department_id, is_active } = req.query;
            const options = {
                department_id: department_id ? parseInt(department_id) : null,
                is_active: is_active !== undefined ? is_active === 'true' : true
            };

            // Get user's department
            const { departmentId, isLecturer, userId } = this.getUserDepartmentInfo(req.user);
            
            // Check if head lecturer
            let isHeadLecturer = false;
            if (isLecturer && departmentId) {
                isHeadLecturer = await this.isHeadLecturer(userId, departmentId);
            }

            let userDepartmentId = null;
            let filterByLecturer = false;

            if (isLecturer) {
                userDepartmentId = departmentId;
                if (!isHeadLecturer) {
                    filterByLecturer = true;
                }
            }

            const result = await this.courseService.getCoursesSimple(
                options, 
                userDepartmentId,
                filterByLecturer ? userId : null
            );
            return res.status(200).json(result);
        } catch (error) {
            console.error('Controller Error - getCoursesSimple:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: parseErrorMessage(error)
            });
        }
    }

    // --- CLASS API ---
    getClasses = async (req, res) => {
        try {
            const { 
                page, limit, search, course_id, semester_id, 
                lecturer_id, department_id, class_status, class_type 
            } = req.query;
            
            const options = {
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10,
                search: search || null,
                course_id: course_id ? parseInt(course_id) : null,
                semester_id: semester_id ? parseInt(semester_id) : null,
                lecturer_id: lecturer_id ? parseInt(lecturer_id) : null,
                department_id: department_id ? parseInt(department_id) : null,
                class_status: class_status || null,
                class_type: class_type || null
            };

            // Get user info
            const { departmentId, isLecturer, userId } = this.getUserDepartmentInfo(req.user);
            
            // Check if head lecturer
            let isHeadLecturer = false;
            if (isLecturer && departmentId) {
                isHeadLecturer = await this.isHeadLecturer(userId, departmentId);
            }

            let userDepartmentId = null;
            let filterByLecturer = false;

            if (isLecturer) {
                userDepartmentId = departmentId;
                if (!isHeadLecturer) {
                    // Regular lecturer: only their classes
                    filterByLecturer = true;
                    // Override lecturer_id filter to ensure they only see their own
                    options.lecturer_id = userId;
                }
            }
            
            const result = await this.classService.getAllClasses(
                options, 
                userDepartmentId,
                filterByLecturer
            );
            return res.status(200).json(result);
        } catch (error) {
            console.error('Controller Error - getClasses:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: parseErrorMessage(error)
            });
        }
    }

    getClassById = async (req, res) => {
        try {
            const classId = parseInt(req.params.classId);

            if (!classId || isNaN(classId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid class ID'
                });
            }

            const result = await this.classService.getClassById(classId);
            return res.status(200).json(result);
        } catch (error) {
            console.error('Controller Error - getClassById:', error);
            const errorMessage = parseErrorMessage(error);
            
            if (error.message.includes('not found')) {
                return res.status(404).json({
                    success: false,
                    message: errorMessage
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: errorMessage
            });
        }
    }

    createClass = async (req, res) => {
        try {
            if (req.user.role !== 'assistant') {
                return res.status(403).json({
                    success: false,
                    message: 'Only assistants can create classes'
                });
            }

            const classData = req.body;

            if (!classData) {
                return res.status(400).json({
                    success: false,
                    message: 'Class data is required'
                });
            }

            const creatorId = req.user.user_id;
            const creatorDepartmentId = req.user.Assistant?.department_id;
            
            const result = await this.classService.createClass(
                classData,
                creatorId,
                creatorDepartmentId
            );
            return res.status(201).json(result);
        } catch (error) {
            console.error('Controller Error - createClass:', error);
            const errorMessage = parseErrorMessage(error);

            if (error.message.includes('required') || 
                error.message.includes('Invalid') ||
                error.message.includes('already exists') ||
                error.message.includes('must be')) {
                return res.status(400).json({
                    success: false,
                    message: errorMessage
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: errorMessage
            });
        }
    }

    updateClass = async (req, res) => {
        try {
            if (req.user.role !== 'assistant') {
                return res.status(403).json({
                    success: false,
                    message: 'Only assistants can update classes'
                });
            }

            const classId = parseInt(req.params.classId);

            if (!classId || isNaN(classId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid class ID'
                });
            }

            const classData = req.body;

            if (!classData || Object.keys(classData).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No update data provided'
                });
            }

            const updaterDepartmentId = req.user.Assistant?.department_id;
            const result = await this.classService.updateClass(
                classId,
                classData,
                updaterDepartmentId
            );
            return res.status(200).json(result);
        } catch (error) {
            console.error('Controller Error - updateClass:', error);
            const errorMessage = parseErrorMessage(error);

            if (error.message.includes('not found')) {
                return res.status(404).json({
                    success: false,
                    message: errorMessage
                });
            }

            if (error.message.includes('required') || 
                error.message.includes('Invalid') ||
                error.message.includes('already exists') ||
                error.message.includes('must be')) {
                return res.status(400).json({
                    success: false,
                    message: errorMessage
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: errorMessage
            });
        }
    }

    deleteClass = async (req, res) => {
        try {
            if (req.user.role !== 'assistant') {
                return res.status(403).json({
                    success: false,
                    message: 'Only assistants can delete classes'
                });
            }

            const classId = parseInt(req.params.classId);

            if (!classId || isNaN(classId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid class ID'
                });
            }

            const deleterDepartmentId = req.user.Assistant?.department_id;
            const result = await this.classService.deleteClass(classId, deleterDepartmentId);
            return res.status(200).json(result);
        } catch (error) {
            console.error('Controller Error - deleteClass:', error);
            const errorMessage = parseErrorMessage(error);

            if (error.message.includes('not found')) {
                return res.status(404).json({
                    success: false,
                    message: errorMessage
                });
            }

            if (error.message.includes('Cannot delete')) {
                return res.status(400).json({
                    success: false,
                    message: errorMessage
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: errorMessage
            });
        }
    }

    // --- ENROLLMENT API ---
    
    getClassStudents = async (req, res) => {
        try {
            const classId = parseInt(req.params.classId);

            if (!classId || isNaN(classId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid class ID'
                });
            }

            const { departmentId, isAssistant, isLecturer, userId } = this.getUserDepartmentInfo(req.user);

            let isHeadLecturer = false;
            if (isLecturer && departmentId) {
                isHeadLecturer = await this.isHeadLecturer(userId, departmentId);
            }


            if (isLecturer && !isHeadLecturer) {
                const classInfo = await this.classService.getClassById(classId);
                
                if (!classInfo || !classInfo.data) {
                    return res.status(404).json({
                        success: false,
                        message: 'Class not found'
                    });
                }
                
                if (classInfo.data.lecturer.user_id !== userId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Access denied. You can only view students in your own classes.'
                    });
                }
                
                const result = await this.classService.getClassStudents(classId, null);
                return res.status(200).json(result);
            }

            const result = await this.classService.getClassStudents(classId, null);
            return res.status(200).json(result);
            
        } catch (error) {
            console.error('Controller Error - getClassStudents:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: parseErrorMessage(error)
            });
        }
    }

    addStudentsToClass = async (req, res) => {
        try {
            if (req.user.role !== 'assistant') {
                return res.status(403).json({
                    success: false,
                    message: 'Only assistants can add students to classes'
                });
            }

            const classId = parseInt(req.params.classId);
            const { student_ids, enrollment_type } = req.body;

            if (!classId || isNaN(classId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid class ID'
                });
            }

            if (!student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'student_ids array is required and must not be empty'
                });
            }

            const result = await this.classService.addStudentsToClass(
                classId,
                student_ids,
                enrollment_type || 'regular'
            );
            return res.status(200).json(result);
        } catch (error) {
            console.error('Controller Error - addStudentsToClass:', error);
            const errorMessage = parseErrorMessage(error);

            if (error.message.includes('required') || error.message.includes('must not be empty')) {
                return res.status(400).json({
                    success: false,
                    message: errorMessage
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: errorMessage
            });
        }
    }

    removeStudentFromClass = async (req, res) => {
        try {
            if (req.user.role !== 'assistant') {
                return res.status(403).json({
                    success: false,
                    message: 'Only assistants can remove students from classes'
                });
            }

            const classId = parseInt(req.params.classId);
            const studentId = parseInt(req.params.studentId);

            if (!classId || isNaN(classId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid class ID'
                });
            }

            if (!studentId || isNaN(studentId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid student ID'
                });
            }

            const result = await this.classService.removeStudentFromClass(classId, studentId);
            return res.status(200).json(result);
        } catch (error) {
            console.error('Controller Error - removeStudentFromClass:', error);
            const errorMessage = parseErrorMessage(error);

            if (error.message.includes('not found')) {
                return res.status(404).json({
                    success: false,
                    message: errorMessage
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: errorMessage
            });
        }
    }

    getAvailableStudents = async (req, res) => {
        try { 
            const departmentId = null;
            const options = {
                search: req.query.search || null,
                major_id: req.query.major_id ? parseInt(req.query.major_id) : null,
                admission_year: req.query.admission_year ? parseInt(req.query.admission_year) : null,
                exclude_class_id: req.query.class_id ? parseInt(req.query.class_id) : null
            };

            const result = await ClassService.getAvailableStudents(departmentId, options);
            return res.status(200).json(result);
            
        } catch (error) {
            console.error('Controller Error - getAvailableStudents:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: parseErrorMessage(error)
            });
        }
    }

    updateEnrollmentType = async (req, res) => {
        try {
            if (req.user.role !== 'assistant') {
                return res.status(403).json({
                    success: false,
                    message: 'Only assistants can update enrollment type'
                });
            }

            const classId = parseInt(req.params.classId);
            const studentId = parseInt(req.params.studentId);

            if (!classId || isNaN(classId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid class ID'
                });
            }

            if (!studentId || isNaN(studentId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid student ID'
                });
            }

            const { enrollment_type, enrollment_status } = req.body;

            if (!enrollment_type && !enrollment_status) {
                return res.status(400).json({
                    success: false,
                    message: 'At least one of enrollment_type or enrollment_status is required'
                });
            }

            if (enrollment_type) {
                const validTypes = ['regular', 'retake', 'improve'];
                if (!validTypes.includes(enrollment_type)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid enrollment_type. Must be: regular, retake, or improve'
                    });
                }
            }

            if (enrollment_status) {
                const validStatuses = ['enrolled', 'dropped', 'completed'];
                if (!validStatuses.includes(enrollment_status)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid enrollment_status. Must be: enrolled, dropped, or completed'
                    });
                }
            }

            const result = await this.classService.updateEnrollmentType(
                classId,
                studentId,
                { enrollment_type, enrollment_status }
            );

            return res.status(200).json(result);
        } catch (error) {
            console.error('Controller Error - updateEnrollmentType:', error);
            const errorMessage = parseErrorMessage(error);

            if (error.message.includes('not found')) {
                return res.status(404).json({
                    success: false,
                    message: errorMessage
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: errorMessage
            });
        }
    }
}

module.exports = new CourseClassController();