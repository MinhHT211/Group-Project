const StudentClassRepository = require('../repositories/studentClassRepository');
const AttendanceService = require('./attendanceService');

class StudentClassService {
  constructor() {
    this.repository = StudentClassRepository;
    this.attendanceService = AttendanceService;
  }

  // Get all students in a class
  async getStudentsByClass(classId) {
    try {
      if (!classId) {
        throw new Error('Class ID is required');
      }

      const students = await this.repository.findStudentsByClass(classId);

      if (!students || students.length === 0) {
        return {
          success: true,
          message: 'No students found in this class',
          data: [],
          count: 0
        };
      }

      return {
        success: true,
        message: `Retrieved ${students.length} students`,
        data: students,
        count: students.length
      };
    } catch (error) {
      throw new Error(`Service Error - getStudentsByClass: ${error.message}`);
    }
  }

  // Get students with pagination and filtering
  async getStudentsByClassPaginated(classId, options = {}) {
    try {
      if (!classId) {
        throw new Error('Class ID is required');
      }

      const result = await this.repository.findStudentsByClassPaginated(classId, options);

      return {
        success: true,
        message: 'Retrieved students successfully',
        data: result
      };
    } catch (error) {
      throw new Error(`Service Error - getStudentsByClassPaginated: ${error.message}`);
    }
  }

  // Get students with attendance information
  async getStudentsByClassWithAttendance(classId) {
    try {
      if (!classId) {
        throw new Error('Class ID is required');
      }

      const students = await this.repository.findStudentsByClassWithAttendance(classId);

      const attendanceSummary = students.map(enrollment => {
        // Normalize attendance data
        let attendanceList = this._normalizeAttendanceList(enrollment.attendance);

        const totalRecords = attendanceList.length;
        const presentCount = attendanceList.filter(a => a.status === 'present').length;
        const absentCount = attendanceList.filter(a => a.status === 'absent').length;
        const lateCount = attendanceList.filter(a => a.status === 'late').length;
        const excusedCount = attendanceList.filter(a => a.status === 'excused').length;

        // Calculate absence equivalent (late counts as half)
        const absenceEquivalent = absentCount + (lateCount * 0.5);

        // Check if banned from exam (>30% absence)
        const bannedFromExam = (enrollment.total_sessions && enrollment.total_sessions > 0)
          ? (absenceEquivalent / enrollment.total_sessions) > 0.30
          : false;

        return {
          enrollment_id: enrollment.enrollment_id,
          student_id: enrollment.student_id,
          student: enrollment.student,
          class: enrollment.class,
          attendance_summary: {
            total_sessions: enrollment.total_sessions || 0,
            attended_sessions: enrollment.attended_sessions || presentCount,
            attendance_rate: enrollment.attendance_rate || 0,
            present_count: presentCount,
            absent_count: absentCount,
            late_count: lateCount,
            absence_equivalent: absenceEquivalent,
            banned_from_exam: bannedFromExam,
            excused_count: excusedCount,
            total_records: totalRecords
          },
          attendance_records: attendanceList,
          attendance_all: attendanceList
        };
      });

      return {
        success: true,
        message: `Retrieved ${students.length} students with attendance data`,
        data: attendanceSummary,
        count: students.length
      };
    } catch (error) {
      throw new Error(`Service Error - getStudentsByClassWithAttendance: ${error.message}`);
    }
  }

  // Get students with grades information
  async getStudentsByClassWithGrades(classId) {
    try {
      if (!classId) {
        throw new Error('Class ID is required');
      }

      const students = await this.repository.findStudentsByClassWithGrades(classId);

      const gradesSummary = students.map(enrollment => {
        const componentScores = enrollment.grades
          ? enrollment.grades.map(g => ({
              grade_id: g.grade_id,
              score: g.score,
              graded_at: g.graded_at,
              feedback: g.feedback,
              component: g.grade_component
            }))
          : [];

        return {
          enrollment_id: enrollment.enrollment_id,
          student_id: enrollment.student_id,
          student: enrollment.student,
          class: enrollment.class,
          grades_summary: {
            midterm: enrollment.midterm_grade || 0,
            final: enrollment.final_grade || 0,
            total: enrollment.total_grade || 0,
            letter: enrollment.letter_grade || 'N/A',
            gpa: enrollment.gpa_value || 0,
            passed: enrollment.is_passed || false,
            component_count: componentScores.length
          },
          grade_components: componentScores
        };
      });

      return {
        success: true,
        message: `Retrieved ${students.length} students with grades data`,
        data: gradesSummary,
        count: students.length
      };
    } catch (error) {
      throw new Error(`Service Error - getStudentsByClassWithGrades: ${error.message}`);
    }
  }

  // Get students with complete summary
  async getStudentsByClassWithSummary(classId) {
    try {
      if (!classId) {
        throw new Error('Class ID is required');
      }

      const students = await this.repository.findStudentsByClassWithSummary(classId);

      return {
        success: true,
        message: `Retrieved ${students.length} students with complete summary`,
        data: students,
        count: students.length
      };
    } catch (error) {
      throw new Error(`Service Error - getStudentsByClassWithSummary: ${error.message}`);
    }
  }

  // Get a single class by id and include its schedules
  async getClassByIdWithSchedules(classId, options = {}) {
    try {
      if (!classId) {
        throw new Error('Class ID is required');
      }

      const cls = await this.repository.findClassByIdWithSchedules(classId, options);

      if (!cls) {
        return {
          success: false,
          message: `Class with id ${classId} not found`,
          data: null
        };
      }

      return {
        success: true,
        message: 'Class retrieved successfully',
        data: cls
      };
    } catch (error) {
      throw new Error(`Service Error - getClassByIdWithSchedules: ${error.message}`);
    }
  }

  // Retrieve all students in a class (enrolled/completed)
  async getAllStudentsInClass(classId) {
    try {
      if (!classId) {
        throw new Error('Class ID is required');
      }

      const students = await this.repository.findAllStudentsInClass(classId);

      return {
        success: true,
        message: `Retrieved ${students.length} students in class ${classId}`,
        data: students,
        count: students.length
      };
    } catch (error) {
      throw new Error(`Service Error - getAllStudentsInClass: ${error.message}`);
    }
  }

  // Validate that schedules belong to a class
  async validateSchedulesBelongToClass(classId, scheduleIds = []) {
    try {
      if (!Array.isArray(scheduleIds) || scheduleIds.length === 0) {
        return { success: true, message: 'No schedules to validate' };
      }

      const classIdNum = Number(classId);
      
      // Get schedules from repository
      const schedules = await this.repository.findSchedulesByIds(scheduleIds);

      // Check if all schedules were found
      const foundIds = schedules.map(s => s.schedule_id);
      const missing = scheduleIds.filter(id => !foundIds.includes(id));
      
      if (missing.length > 0) {
        throw new Error(`The following schedule_id(s) were not found: ${missing.join(', ')}`);
      }

      // Check if all schedules belong to the class
      const mismatched = schedules.filter(s => s.class_id !== classIdNum).map(s => s.schedule_id);
      
      if (mismatched.length > 0) {
        throw new Error(`The following schedule_id(s) do not belong to class ${classId}: ${mismatched.join(', ')}`);
      }

      return {
        success: true,
        message: 'All schedules belong to the specified class'
      };
    } catch (error) {
      throw new Error(`Service Error - validateSchedulesBelongToClass: ${error.message}`);
    }
  }

  // Delegate attendance operations to AttendanceService
  async markAttendanceBulk(classId, attendanceArray = [], options = {}) {
    return this.attendanceService.markAttendanceBulk(classId, attendanceArray, options);
  }

  async updateAttendanceRecord(identifier, updateData = {}, options = {}) {
    return this.attendanceService.updateAttendanceRecord(identifier, updateData, options);
  }

  // Private: Normalize attendance list
  _normalizeAttendanceList(attendanceData) {
    if (!Array.isArray(attendanceData)) return [];

    return attendanceData.map(a => {
      const raw = (a && typeof a.toJSON === 'function') ? a.toJSON() : (a && a.dataValues ? a.dataValues : a);
      const copy = { ...raw };

      // Normalize attendance_date to ISO format
      try {
        if (copy.attendance_date) {
          const dt = new Date(String(copy.attendance_date) + 'T00:00:00');
          if (!isNaN(dt.getTime())) {
            const yyyy = dt.getFullYear();
            const mm = String(dt.getMonth() + 1).padStart(2, '0');
            const dd = String(dt.getDate()).padStart(2, '0');
            copy.attendance_date = `${yyyy}-${mm}-${dd}`;
          }
        }
      } catch (e) {
        // Leave as-is if parsing fails
      }

      return copy;
    });
  }
}

module.exports = new StudentClassService();