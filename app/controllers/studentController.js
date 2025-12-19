'use strict';
const navigation = require('../config/navigation');
const enrollmentService = require('../services/enrollmentService');
const classManagementService = require('../services/classService');
const { parseErrorMessage } = require('../utils/errorHelper');

class StudentController {
    constructor() {
        this.enrollmentService = enrollmentService;
        this.classService = classManagementService;
    }

    index = (req, res) => {
        res.render('management/student/index', {
            layout: 'layouts/management',
            title: 'Student Dashboard',
            role: 'student',
            currentUserId: req.user.user_id,
            navItems: navigation.student,
            user: req.user || {
                user_id: null,
                name: 'Student User',
                avatar: '/images/avatar_default.png',
                roleKey: 'student',
                roleText: 'Student',
            },
        });
    }

    getTimetable = (req, res) => {
        res.render('management/student/timetable', {
            layout: 'layouts/management',
            pageJS: '/js/modules/common/timetable.js', 
            pageCSS: '/css/modules/management/common/_timetable.css',
            title: 'Timetable',
            role: 'student',
            navItems: navigation.student,
            user: req.user,
        });
    }

    getResults = (req, res) => {
        res.render('management/student/results', {
            layout: 'layouts/management',
            pageCSS: '/css/modules/management/student/_results.css',
            title: 'Results',
            role: 'student',
            navItems: navigation.student,
            user: req.user,
        });
    }

    getChangePassword = (req, res) => {
        res.render('components/change_password', {
            layout: 'layouts/management',
            title: 'Change Password',
            pageJS: '/js/components/change_password.js',
            pageCSS: '/css/modules/auth/change_password.css',
            role: 'student',
            navItems: navigation.student,
            user: req.user
        });
    }

    getEnrollmentsByStudent = async (req, res) => {
        try {
            const studentId = parseInt(req.params.studentId);
            const semesterId = req.query.semesterId ? parseInt(req.query.semesterId) : null;

            if (!studentId || isNaN(studentId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid student ID',
                });
            }

            if (req.user?.role === 'student' && req.user.user_id !== studentId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only view your own enrollments.',
                });
            }

            const result = await this.enrollmentService.getEnrollmentsByStudent(studentId, semesterId);

            return res.status(200).json({
                success: true,
                total: Array.isArray(result) ? result.length : 0,
                data: result,
            });
        } catch (error) {
            console.error('Controller Error - getEnrollmentsByStudent:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: parseErrorMessage(error),
            });
        }
    }

    getStudentClasses = async (req, res) => {
        try {
            const studentId = req.user?.user_id;
            const userRole = req.user?.role;

            if (!studentId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }

            if (userRole !== 'student') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Student only',
                });
            }

            const { semester_id, enrollment_status } = req.query;
            const options = {
                semester_id: semester_id ? parseInt(semester_id) : null,
                enrollment_status: enrollment_status || 'enrolled',
            };

            const result = await this.classService.getClassesByStudent(studentId, options);

            return res.status(200).json(result);
        } catch (error) {
            console.error('Controller Error - getStudentClasses:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: parseErrorMessage(error),
            });
        }
    }

    getProfile = async (req, res) => {
        try {
            const studentId = req.user?.user_id;

            if (!studentId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }

            return res.status(200).json({
                success: true,
                data: {
                    user_id: req.user.user_id,
                    username: req.user.username,
                    email: req.user.email,
                    full_name: req.user.full_name,
                    first_name: req.user.first_name,
                    last_name: req.user.last_name,
                    date_of_birth: req.user.date_of_birth,
                    gender: req.user.gender,
                    phone: req.user.phone,
                    address: req.user.address,
                    avatar_url: req.user.avatar_url,
                    student: req.user.Student || null,
                    role: req.user.role,
                    roles: req.user.roles,
                },
            });
        } catch (error) {
            console.error('Controller Error - getProfile:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: parseErrorMessage(error),
            });
        }
    }
}
module.exports = new StudentController();