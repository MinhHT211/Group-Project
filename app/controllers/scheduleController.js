'use strict';
const ScheduleService = require('../services/scheduleService');
const navigation = require('../config/navigation');
const db = require('../models');
const { parseErrorMessage } = require('../utils/errorHelper');

class ScheduleController {
  constructor() {
    this.service = ScheduleService;
  }

  getAssistantTimetable = (req, res) => {
    const assistantDeptId = (req.user && req.user.Assistant) ? req.user.Assistant.department_id : null;
    res.render('management/assistant/timetable', {
      layout: 'layouts/management',
      pageJS: '/js/modules/common/timetable.js',
      pageCSS: '/css/modules/management/common/_timetable.css',
      title: 'Timetable Management - Assistant',
      role: 'assistant',
      navItems: navigation.assistant,
      userDeptId: assistantDeptId
    });
  };

  getLecturerTimetable = async (req, res) => {
    try {
      const userId = req.user.user_id;
      let isHead = false;
      let headDeptId = null;

      if (req.user && req.user.Lecturer) {
        const department = await db.Departments.findOne({
          where: { head_lecturer_id: userId }
        });
        if (department) {
          isHead = true;
          headDeptId = department.department_id;
        }
      }

      res.render('management/lecturer/timetable', {
        layout: 'layouts/management',
        pageJS: '/js/modules/common/timetable.js',
        pageCSS: '/css/modules/management/common/_timetable.css',
        title: 'My Timetable - Lecturer',
        role: 'lecturer',
        navItems: navigation.lecturer,
        isHeadLecturer: isHead,
        headDeptId: headDeptId
      });
    } catch (error) {
      console.error("Error in getLecturerTimetable:", error);
      res.status(500).render('error', { 
        message: 'Server Error', 
        error: parseErrorMessage(error) 
      });
    }
  };

  getStudentTimetable = (req, res) => {
    res.render('management/student/timetable', {
      layout: 'layouts/management',
      pageJS: '/js/modules/common/timetable.js',
      pageCSS: '/css/modules/management/common/_timetable.css',
      title: 'My Timetable - Student',
      role: 'student',
      navItems: navigation.student
    });
  };

  listPublicSchedules = async (req, res) => {
    try {
      const filters = { ...req.query };
      let currentUserInfo = null;

      if (req.user) {
        if (req.user.Student) {
          filters.studentId = req.user.Student.user_id || req.user.user_id;
        } else if (req.user.Lecturer) {
          const lecturerId = req.user.Lecturer.user_id || req.user.user_id;
          currentUserInfo = { id: lecturerId, role: 'lecturer' };

          const headDept = await db.Departments.findOne({ where: { head_lecturer_id: lecturerId } });

          if (headDept) {
            currentUserInfo.isHead = true;
            filters.departmentId = filters.departmentId || headDept.department_id;
            if (!req.query.lecturerId) delete filters.lecturerId;
            else filters.lecturerId = req.query.lecturerId;
          } else {
            currentUserInfo.isHead = false;
            delete filters.lecturerId;
          }
        } else if (req.user.Assistant) {
          if (req.user.Assistant.department_id) filters.departmentId = req.user.Assistant.department_id;
        }
      } else {
        if (req.query.studentId) filters.studentId = req.query.studentId;
        if (req.query.lecturerId) filters.lecturerId = req.query.lecturerId;
      }

      const result = await this.service.getSchedules(filters);

      if (!result.success) {
        return res.status(404).json({ status: 'error', message: result.message });
      }

      let finalData = result.data;

      if (currentUserInfo && currentUserInfo.role === 'lecturer' && !currentUserInfo.isHead) {
        const myId = Number(currentUserInfo.id);

        finalData = finalData.filter(sch => {
          const assignedId = sch.lecturer_id ? Number(sch.lecturer_id) : null;
          const ownerId = sch.Class ? Number(sch.Class.lecturer_id) : (sch.class_lecturer_id ? Number(sch.class_lecturer_id) : null);

          if (assignedId !== null) {
            return assignedId === myId;
          }

          if (ownerId !== null) {
            return ownerId === myId;
          }

          return false;
        });
      }

      return res.json({
        status: 'success',
        meta: result.meta,
        data: finalData
      });

    } catch (error) {
      console.error('Controller Error - listPublicSchedules:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: parseErrorMessage(error)
      });
    }
  };

  createSchedule = async (req, res) => {
    try {
      const result = await this.service.createSchedule(req.body);

      if (!result.success) {
        return res.status(400).json({
          status: 'error',
          message: result.message
        });
      }

      return res.status(201).json({
        status: 'success',
        data: result.data
      });
    } catch (error) {
      console.error('Controller Error - createSchedule:', error);
      const errorMessage = parseErrorMessage(error);
      
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          status: 'error',
          message: errorMessage
        });
      }
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: errorMessage
      });
    }
  };

  getLecturerOptions = async (req, res) => {
    try {
      const deptId = (req.user && req.user.Assistant) ? req.user.Assistant.department_id : null;
      const result = await this.service.getLecturerOptions(deptId);

      return res.json({ status: 'success', data: result.data });
    } catch (error) {
      console.error('Controller Error - getLecturerOptions:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: parseErrorMessage(error)
      });
    }
  }

  getClassOptions = async (req, res) => {
    try {
      const filters = {};
      if (req.user && req.user.Assistant) {
        const deptId = req.user.Assistant.department_id;
        if (deptId) filters.departmentId = deptId;
      }

      if (req.user && req.user.Lecturer) {
        const lecturerId = req.user.Lecturer.user_id || req.user.user_id;

        const headDept = await db.Departments.findOne({ where: { head_lecturer_id: lecturerId } });

        if (headDept) {
          filters.departmentId = headDept.department_id;
          const result = await this.service.getClassOptions(filters);
          return res.json({ status: 'success', data: result.data });
        }

        const lecturer = await db.Lecturers.findOne({ where: { user_id: lecturerId } });

        if (lecturer && lecturer.department_id) {
          const deptClassesRes = await this.service.getClassOptions({ departmentId: lecturer.department_id });
          const allDeptClasses = deptClassesRes.data || [];

          const assignedSchedules = await db.Schedules.findAll({
            where: { lecturer_id: lecturerId },
            attributes: ['class_id'],
            group: ['class_id']
          });

          const assignedClassIds = new Set(assignedSchedules.map(s => Number(s.class_id)));

          // Filter final list
          const finalClasses = allDeptClasses.filter(c => {
            const isOwner = Number(c.lecturer_id) === Number(lecturerId);
            const isAssigned = assignedClassIds.has(Number(c.class_id));

            return isOwner || isAssigned;
          });

          return res.json({ status: 'success', data: finalClasses });

        } else {
          filters.lecturerId = lecturerId;
        }
      }
      if (req.user && req.user.Student) {
        filters.studentId = req.user.Student.user_id || req.user.user_id;
      }
      const result = await this.service.getClassOptions(filters);
      return res.json({
        status: 'success',
        data: result.data
      });
    } catch (error) {
      console.error('Controller Error - getClassOptions:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: parseErrorMessage(error)
      });
    }
  };

  updateSchedule = async (req, res) => {
    try {
      const result = await this.service.updateSchedule(
        req.params.scheduleId,
        req.body
      );

      if (!result.success) {
        return res.status(404).json({
          status: 'error',
          message: result.message
        });
      }

      return res.json({
        status: 'success',
        data: result.data
      });
    } catch (error) {
      console.error('Controller Error - updateSchedule:', error);
      const errorMessage = parseErrorMessage(error);

      if (error.name === 'ValidationError') {
        return res.status(400).json({
          status: 'error',
          message: errorMessage
        });
      }
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: errorMessage
      });
    }
  };

  deleteSchedule = async (req, res) => {
    try {
      const result = await this.service.deleteSchedule(req.params.scheduleId);

      if (!result.success) {
        return res.status(404).json({
          status: 'error',
          message: result.message
        });
      }

      return res.json({
        status: 'success',
        message: result.message
      });
    } catch (error) {
      console.error('Controller Error - deleteSchedule:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: parseErrorMessage(error)
      });
    }
  };

  toggleScheduleStatus = async (req, res) => {
    try {
      const result = await this.service.toggleScheduleStatus(
        req.params.scheduleId,
        req.body
      );

      if (!result.success) {
        return res.status(404).json({
          status: 'error',
          message: result.message
        });
      }

      return res.json({
        status: 'success',
        data: result.data
      });
    } catch (error) {
      console.error('Controller Error - toggleScheduleStatus:', error);
      const errorMessage = parseErrorMessage(error);

      if (error.name === 'ValidationError') {
        return res.status(400).json({
          status: 'error',
          message: errorMessage
        });
      }
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: errorMessage
      });
    }
  };

  editSingleOccurrence = async (req, res) => {
    try {
      const result = await this.service.editSingleOccurrence(
        req.params.scheduleId,
        req.params.date,
        req.body
      );

      if (!result.success) {
        return res.status(400).json({
          status: 'error',
          message: result.message
        });
      }

      return res.json({
        status: 'success',
        data: result.data
      });
    } catch (error) {
      console.error('Controller Error - editSingleOccurrence:', error);
      const errorMessage = parseErrorMessage(error);

      if (error.name === 'ValidationError') {
        return res.status(400).json({
          status: 'error',
          message: errorMessage
        });
      }
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: errorMessage
      });
    }
  };

  deleteSingleOccurrence = async (req, res) => {
    try {
      const result = await this.service.deleteSingleOccurrence(
        req.params.scheduleId,
        req.params.date
      );

      if (!result.success) {
        return res.status(400).json({
          status: 'error',
          message: result.message
        });
      }

      return res.json({
        status: 'success',
        message: 'Single occurrence deleted successfully',
        data: result.data
      });
    } catch (error) {
      console.error('Controller Error - deleteSingleOccurrence:', error);
      const errorMessage = parseErrorMessage(error);

      if (error.name === 'ValidationError') {
        return res.status(400).json({
          status: 'error',
          message: errorMessage
        });
      }
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: errorMessage
      });
    }
  };

  // syncAttendance = async (req, res, next) => {
  //   try {
  //      const { classId } = req.body;
  //      await this.service.syncClassSessionsPublic(classId); 
  //      return res.json({ status: 'success', message: 'Synced successfully' });
  //   } catch (e) { next(e); }
  //  }

  syncAllAttendance = async (req, res) => {
    try {
      // Call service to handle sync
      const result = await this.service.syncAllClassesPublic();
      return res.json({
        status: 'success',
        message: `Synced successfully for ${result.count} classes.`
      });
    } catch (error) {
      console.error('Controller Error - syncAllAttendance:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: parseErrorMessage(error)
      });
    }
  };
}

module.exports = new ScheduleController();