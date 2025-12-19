const { Op } = require('sequelize');
const {
  Classes,
  Courses,
  Users,
  Schedules,
  Enrollment,
  Students,
  Attendance,
  sequelize
} = require('../models');

class AttendanceClassRepository {

  // Get today's classes by lecturer (Filter cancelled/deleted strictly)
  async getTodayClassesByLecturer(lecturerId, targetDateStr) {
    try {
      let dateObj;
      if (targetDateStr) {
        dateObj = new Date(targetDateStr);
      } else {
        const now = new Date();
        targetDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
        dateObj = new Date(targetDateStr);
      }
      const targetISO = dateObj.toISOString().split('T')[0];

      const dayMap = [7, 1, 2, 3, 4, 5, 6];
      const currentDayOfWeek = dayMap[dateObj.getDay()];

      const startOfDay = `${targetISO} 00:00:00`;
      const endOfDay = `${targetISO} 23:59:59`;

      // Query Database
      const classes = await Classes.findAll({
        where: {
          lecturer_id: lecturerId,
          class_status: { [Op.not]: 'cancelled' },
        },
        include: [
          {
            model: Courses,
            as: 'course',
            attributes: ['course_id', 'course_code', 'course_name', 'credits']
          },
          {
            model: Schedules,
            as: 'schedules',
            where: {
              is_active: { [Op.or]: [true, 1] },
              day_of_week: currentDayOfWeek,
              effective_from: { [Op.lte]: endOfDay },
              [Op.or]: [
                { effective_to: { [Op.eq]: null } },
                { effective_to: { [Op.gte]: startOfDay } }
              ]
            },
            required: true
          }
        ],
        order: [
          [{ model: Schedules, as: 'schedules' }, 'schedule_id', 'DESC']
        ]
      });

      // Filter out cancelled/deleted schedules
      const validClasses = classes.filter(cls => {
        if (!cls.schedules || cls.schedules.length === 0) return false;
        const schedule = cls.schedules[0];

        if (!schedule.is_active) return false;

        // Parse cancelled dates
        let cancelledArr = this._parseJsonArray(schedule.cancelled_dates);
        let deletedArr = this._parseJsonArray(schedule.deleted_dates);

        // Check if target date is in excluded list
        const isMatchingDate = (dateList) => {
          return dateList.some(d => {
            if (!d) return false;
            try {
              const dStr = (d instanceof Date) ? d.toISOString() : new Date(d).toISOString();
              return dStr.split('T')[0] === targetISO;
            } catch (e) {
              return false;
            }
          });
        };

        if (isMatchingDate(cancelledArr) || isMatchingDate(deletedArr)) {
          return false;
        }

        return true;
      });

      return validClasses;

    } catch (error) {
      console.error('[Repository Error - getTodayClassesByLecturer]:', error);
      throw error;
    }
  }

  // Get class by ID with schedules
  async getClassByIdWithSchedules(classId) {
    try {
      const cls = await Classes.findOne({
        where: { class_id: classId },
        include: [
          {
            model: Schedules,
            as: 'schedules',
            where: { is_active: true },
            required: false,
            attributes: [
              'schedule_id',
              'day_of_week',
              'start_time',
              'end_time',
              'room',
              'building',
              'schedule_type',
              'is_active',
              'effective_from',
              'effective_to',
              'cancelled_dates',
              'deleted_dates'
            ]
          }
        ],
        attributes: [
          'class_id',
          'class_code',
          'class_name',
          'course_id',
          'semester_id',
          'lecturer_id',
          'start_date',
          'end_date',
          'class_type',
          'class_status'
        ]
      });

      if (!cls) {
        return { success: false, message: 'Class not found', data: null };
      }

      return { success: true, data: cls };
    } catch (error) {
      console.error('[Repository Error - getClassByIdWithSchedules]:', error);
      throw error;
    }
  }

  // Get students by class with attendance
  async getStudentsByClassWithAttendance(classId) {
    try {
      const enrollments = await Enrollment.findAll({
        where: {
          class_id: classId,
          enrollment_status: { [Op.in]: ['enrolled', 'completed'] }
        },
        include: [
          {
            model: Students,
            as: 'student',
            attributes: ['user_id', 'student_code'],
            include: [
              {
                model: Users,
                as: 'user',
                attributes: ['user_id', 'first_name', 'last_name', 'email', 'is_deleted'],
                required: false
              }
            ]
          }
        ],
        attributes: [
          'enrollment_id',
          'student_id',
          'class_id',
          'total_sessions',
          'attended_sessions',
          'attendance_rate'
        ]
      });

      const studentIds = enrollments.map(e => e.student_id);

      const attendanceRecords = await Attendance.findAll({
        where: {
          class_id: classId,
          student_id: { [Op.in]: studentIds }
        },
        attributes: [
          'attendance_id',
          'student_id',
          'attendance_date',
          'session_number',
          'schedule_id',
          'status',
          'check_in_time',
          'notes'
        ],
        order: [['attendance_date', 'DESC']]
      });

      // Map attendance to enrollments
      const result = enrollments.map(enrollment => {
        const enrollmentData = enrollment.toJSON();
        const studentAttendance = attendanceRecords.filter(
          att => att.student_id === enrollment.student_id
        );

        return {
          ...enrollmentData,
          attendance: studentAttendance,
          attendance_all: studentAttendance
        };
      });

      return { success: true, data: result };
    } catch (error) {
      console.error('[Repository Error - getStudentsByClassWithAttendance]:', error);
      throw error;
    }
  }

  // Get attendance records by student
  async getAttendanceByStudent(classId, studentId) {
    try {
      const records = await Attendance.findAll({
        where: {
          class_id: classId,
          student_id: studentId
        },
        attributes: ['attendance_id', 'status', 'session_number', 'attendance_date'],
        order: [['session_number', 'ASC']]
      });

      return records;
    } catch (error) {
      console.error('[Repository Error - getAttendanceByStudent]:', error);
      throw error;
    }
  }

  // Bulk Upsert Attendance
  async bulkUpdateAttendance(classId, scheduleId, attendanceUpdates, sessionNumber, recordedBy) {
    const transaction = await sequelize.transaction();
    try {
      const today = new Date();
      
      for (const update of attendanceUpdates) {
        const whereClause = {
          class_id: classId,
          student_id: update.student_id,
          session_number: Number(sessionNumber)
        };

        const existingRecord = await Attendance.findOne({
          where: whereClause,
          transaction
        });

        const dataToSave = {
          status: update.status,
          notes: update.notes || null,
          check_in_time: update.status === 'present' ? new Date() : null,
          recorded_by: recordedBy
        };

        if (existingRecord) {
          await existingRecord.update(dataToSave, { transaction });
        } else {
          await Attendance.create({
            ...whereClause,
            ...dataToSave,
            schedule_id: Number(scheduleId),
            attendance_date: today,
            recorded_by: recordedBy
          }, { transaction });
        }
      }

      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Repository Error - bulkUpdateAttendance: ${error.message}`);
    }
  }

  // Get max session number for a class
  async getMaxSessionNumber(classId) {
    try {
      const maxSession = await Attendance.max('session_number', {
        where: { class_id: classId }
      });
      return (maxSession && !isNaN(maxSession)) ? Number(maxSession) : 0;
    } catch (error) {
      console.error('[Repository Error - getMaxSessionNumber]:', error);
      return 0;
    }
  }

  // Helper: Parse JSON array safely
  _parseJsonArray(value) {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (e) {
        return [];
      }
    }
    return [];
  }
}

module.exports = new AttendanceClassRepository();