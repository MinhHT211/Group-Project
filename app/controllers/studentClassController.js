'use strict';
const StudentClassService = require('../services/studentClassService');
const { parseErrorMessage } = require('../utils/errorHelper');

class StudentClassController {
  constructor() {
    this.studentClassService = StudentClassService;
  }

  getStudentsByClass = async (req, res) => {
    try {
      const { classId } = req.params;

      const result = await this.studentClassService.getStudentsByClass(classId);

      return res.status(200).json(result);
    } catch (error) {
      console.error('Controller Error - getStudentsByClass:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: parseErrorMessage(error)
      });
    }
  }

  getStudentsByClassPaginated = async (req, res) => {
    try {
      const { classId } = req.params;
      const { limit = 10, offset = 0, sortBy = 'last_name', sortOrder = 'ASC', search } = req.query;

      const result = await this.studentClassService.getStudentsByClassPaginated(classId, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        sortBy,
        sortOrder,
        search
      });

      return res.status(200).json(result);
    } catch (error) {
      console.error('Controller Error - getStudentsByClassPaginated:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: parseErrorMessage(error)
      });
    }
  }

  getStudentsByClassWithAttendance = async (req, res) => {
    try {
      const { classId } = req.params;
      const { sessionNumber, scheduleId } = req.query;

      const result = await this.studentClassService.getStudentsByClassWithAttendance(classId);

      // If caller requested a specific sessionNumber or scheduleId, filter attendance_records
      if (result && result.data && (sessionNumber !== undefined || scheduleId !== undefined)) {
        const sNum = (sessionNumber !== undefined && sessionNumber !== null && sessionNumber !== '') 
          ? Number(sessionNumber) 
          : null;
        
        const sId = (scheduleId !== undefined && scheduleId !== null && scheduleId !== '') 
          ? Number(scheduleId) 
          : null;

        result.data = result.data.map(enrollment => {
          const recs = enrollment.attendance_records || enrollment.attendance || [];
          const all = Array.isArray(recs) ? recs : [];
          
          const filtered = all.filter(a => {
            if (!a) return false;
            
            // Filter by session number
            if (sNum !== null) {
              if (a.session_number === undefined || a.session_number === null) return false;
              if (Number(a.session_number) !== sNum) return false;
            }

            // Filter by schedule ID
            if (sId !== null) {
              if (a.schedule_id === undefined || a.schedule_id === null) return false;
              if (Number(a.schedule_id) !== sId) return false;
            }

            return true;
          });
          
          return {
            ...enrollment,
            attendance_records: filtered,
            attendance_all: all 
          };
        });
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error('Controller Error - getStudentsByClassWithAttendance:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: parseErrorMessage(error)
      });
    }
  }

  getStudentsByClassWithGrades = async (req, res) => {
    try {
      const { classId } = req.params;

      const result = await this.studentClassService.getStudentsByClassWithGrades(classId);

      return res.status(200).json(result);
    } catch (error) {
      console.error('Controller Error - getStudentsByClassWithGrades:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: parseErrorMessage(error)
      });
    }
  }

  getStudentsByClassWithSummary = async (req, res) => {
    try {
      const { classId } = req.params;

      const result = await this.studentClassService.getStudentsByClassWithSummary(classId);

      return res.status(200).json(result);
    } catch (error) {
      console.error('Controller Error - getStudentsByClassWithSummary:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: parseErrorMessage(error)
      });
    }
  }

  getClassByIdWithSchedules = async (req, res) => {
    try {
      const { classId } = req.params;
      const { includeInactive = 'false' } = req.query;

      const result = await this.studentClassService.getClassByIdWithSchedules(classId, {
        includeInactive: includeInactive === 'true' || includeInactive === true
      });

      // If not found, return 404
      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error('Controller Error - getClassByIdWithSchedules:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: parseErrorMessage(error)
      });
    }
  }

  getAllStudentsInClass = async (req, res) => {
    try {
      const { classId } = req.params;

      const result = await this.studentClassService.getAllStudentsInClass(classId);

      return res.status(200).json(result);
    } catch (error) {
      console.error('Controller Error - getAllStudentsInClass:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: parseErrorMessage(error)
      });
    }
  }
}

module.exports = new StudentClassController();