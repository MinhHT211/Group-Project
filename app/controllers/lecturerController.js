"use strict";
const navigation = require('../config/navigation');
const StudentClassService = require('../services/studentClassService');
const AttendanceClassService = require('../services/attendanceClassService');
const ClassService = require('../services/classService');
const LecturerService = require('../services/lecturerManagementService');
const { parseErrorMessage } = require('../utils/errorHelper');

class LecturerController {
  constructor() {
    this.studentClassService = StudentClassService;
    this.attendanceClassService = AttendanceClassService;
    this.classService = ClassService;
    this.lecturerService = LecturerService;
  }
  
  // --- VIEW METHODS ---
  index = (req, res) => {
    try {
      const lecturerId = req.user?.user_id || null; 
      res.render('management/lecturer/index', {
        layout: 'layouts/management',
        title: 'Lecturer Dashboard',
        role: 'lecturer',
        navItems: navigation.lecturer,
        currentUserId: lecturerId,
        user: req.user || {
          name: 'Lecturer User',
          avatar: '/images/avatar_default.png',
          roleKey: 'lecturer',
          roleText: 'Lecturer',
          id: lecturerId,
        }
      });
    } catch (error) {
      console.error('Controller Error - index:', error);
      res.status(500).send(parseErrorMessage(error));
    }
  }

  getClass = (req, res) => {
    res.render('management/lecturer/classes', {
      layout: 'layouts/management',
      title: 'Class Manage',
      role: 'lecturer',
      navItems: navigation.lecturer,
      user: req.user,
    });
  }

  getAttendance = async (req, res) => {
    try {
      const lecturerId = req.user?.user_id ? Number(req.user.user_id) : null;
      
      if (!lecturerId) {
        return res.status(403).json({
          success: false,
          message: 'Lecturer information not found'
        });
      }

      const dateParam = req.query.date;
      const targetDateStr = dateParam || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
      
      const result = await this.attendanceClassService.getTodayClasses(lecturerId, targetDateStr);
      res.render('management/lecturer/attendanceClass', {
        layout: 'layouts/management',
        title: 'Attendance Manage',
        role: 'lecturer',
        navItems: navigation.lecturer,
        user: req.user,
        classes: result.data || [],
        error: null,
        currentDate: targetDateStr,
        pageCSS: '/css/modules/management/lecturer/attendance_class.css',
      });
    } catch (error) {
      console.error('Controller Error - getAttendance:', error);
      res.render('management/lecturer/attendanceClass', {
        layout: 'layouts/management',
        title: 'Error',
        role: 'lecturer',
        navItems: navigation.lecturer,
        user: req.user,
        classes: [],
        error: parseErrorMessage(error),
        currentDate: new Date().toISOString().split('T')[0]
      });
    }
  }

  getCheckAttendance = async (req, res) => {
    try {
      const classId = req.params.classId;
      const scheduleIdParam = req.query.scheduleId || '';
      const sessionNumberParam = req.query.sessionNumber || '';
      if (!classId) {
        return res.status(400).send('Class ID is required');
      }
      
      const result = await this.attendanceClassService.getClassAttendanceDetail(
        classId,
        scheduleIdParam,
        sessionNumberParam
      );

      res.render('management/lecturer/attendance', {
        layout: 'layouts/management',
        title: 'Class Attendance',
        pageCSS: '/css/modules/management/lecturer/attendance.css',
        role: 'lecturer',
        navItems: navigation.lecturer,
        user: req.user,
        currentUserId: req.user?.user_id || req.user?.sub || null,
        classInfo: result.classInfo,
        classId,
        students: result.students,
        sessionOptions: result.sessionOptions,
        sessionNumber: result.sessionNumber,
        scheduleId: result.scheduleId,
        availableDates: result.availableDates
      });
    } catch (error) {
      console.error('Controller Error - getCheckAttendance:', error);
      return res.status(500).render('errors/500', { 
        layout: 'layouts/management',
        user: req.user,
        error: parseErrorMessage(error) 
      });
    }
  }

  getSchedule = (req, res) => {
    res.render('management/lecturer/timetable', {
      layout: 'layouts/management',
      pageJS: '/js/modules/common/timetable.js',
      pageCSS: '/css/modules/management/common/_timetable.css',
      title: 'Schedule Manage',
      role: 'lecturer',
      navItems: navigation.lecturer,
      user: req.user
    });
  }

  getChangePassword = (req, res) => {
    res.render('components/change_password', {
      layout: 'layouts/management',
      title: 'Change Password',
      pageJS: '/js/components/change_password.js',
      pageCSS: '/css/modules/auth/change_password.css',
      role: 'lecturer',
      navItems: navigation.lecturer,
      user: req.user
    });
  }
  
  getClassStudents = async (req, res) => {
    try {
      const classId = req.params.classId;
      if (!classId) {
        return res.status(403).json({
          success: false,
          message: 'Class information not found'
        });
      }
      const result = await this.lecturerService.getClassStudentsWithGrades(classId);
      if (!result.success) {
        return res.render('management/lecturer/class_students', {
          layout: 'layouts/management',
          title: 'Class Students',
          role: 'lecturer',
          navItems: navigation.lecturer,
          user: req.user,
          className: 'Found class error',
          students: [],
          weights: result.weights || {},
          errorMessage: result.message || 'Found class error.'
        });
      }
      return res.render('management/lecturer/class_students', {
        layout: 'layouts/management',
        title: `Students - ${result.class.class_name}`,
        role: 'lecturer',
        navItems: navigation.lecturer,
        user: req.user,
        className: result.class.class_name,
        courseCode: result.class.course_code,
        semesterName: result.class.semester_name,
        students: result.students,
        weights: result.weights,
        errorMessage: null
      });
    } catch (error) {
      console.error('Controller Error - getClassStudents:', error);
      return res.render('management/lecturer/class_students', {
        layout: 'layouts/management',
        title: 'Class Students',
        role: 'lecturer',
        navItems: navigation.lecturer,
        user: req.user,
        className: 'Error',
        students: [],
        weights: {},
        errorMessage: parseErrorMessage(error)
      });
    }
  }

  // --- API METHODS ---
  bulkUpdateAttendanceApi = async (req, res) => {
    try {
      const recordedBy = req.user?.user_id || req.user?.sub || null;
      const { classId, scheduleId, attendanceUpdates, sessionNumber } = req.body;
      if (!classId || !scheduleId || !attendanceUpdates) {
        return res.status(400).json({
          success: false,
          message: 'Must to fill full attributes (classId, scheduleId, attendanceUpdates)'
        });
      }
      const currentSession = sessionNumber ? Number(sessionNumber) : null;
      const result = await this.attendanceClassService.bulkUpdateAttendance(
        classId,
        scheduleId,
        attendanceUpdates,
        currentSession,
        recordedBy
      );
      return res.status(200).json(result);
    } catch (error) {
      console.error('Controller Error - bulkUpdateAttendanceApi:', error);
      return res.status(500).json({
        success: false,
        message: parseErrorMessage(error)
      });
    }
  }

  getLecturerClasses = async (req, res) => {
    try {
      const lecturerId = req.user?.user_id;
      const userRole = req.user?.role;
      if (!lecturerId || userRole !== 'lecturer') {
        return res.status(403).json({
          success: false,
          message: 'Only lecturer can access.'
        });
      }
      const { semester_id, class_status } = req.query;
      const options = {
        semester_id: semester_id ? parseInt(semester_id) : null,
        class_status: class_status || null
      };
      const result = await this.classService.getClassesByLecturer(lecturerId, options);
      return res.status(200).json(result);
    } catch (error) {
      console.error('Controller Error - getLecturerClasses:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: parseErrorMessage(error)
      });
    }
  }

  getGradeWeights = async (req, res) => {
    try {
      const classId = parseInt(req.params.classId);
      if (!classId || isNaN(classId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid class ID'
        });
      }
      const weights = await this.lecturerService.getGradeWeightsByClass(classId);
      return res.status(200).json({
        success: true,
        data: weights
      });
    } catch (error) {
      console.error('Controller Error - getGradeWeights:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: parseErrorMessage(error)
      });
    }
  }
}

module.exports = new LecturerController();