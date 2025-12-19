const attendanceClassRepository = require('../repositories/attendanceClassRepository');
const enrollmentRepository = require('../repositories/enrollmentRepository');

class AttendanceClassService {
  constructor() {
    this.repository = attendanceClassRepository;
    this.enrollmentRepository = enrollmentRepository;
  }

  async getTodayClasses(lecturerId, dateStr) {
    try {
      if (!lecturerId) throw new Error('Lecturer ID is required');
      
      const classes = await this.repository.getTodayClassesByLecturer(lecturerId, dateStr);
      
      if (!classes || classes.length === 0) {
        return { success: true, total: 0, data: [] };
      }

      const formattedClasses = [];
      classes.forEach(cls => {
        const classJson = cls.toJSON ? cls.toJSON() : cls;
        const schedules = classJson.schedules || [];
        schedules.forEach(schedule => {
          const item = this._formatSingleSchedule(classJson, schedule);
          if (item) formattedClasses.push(item);
        });
      });

      formattedClasses.sort((a, b) => a.start_time.localeCompare(b.start_time));

      return {
        success: true,
        total: formattedClasses.length,
        data: formattedClasses
      };
    } catch (error) {
      console.error('Service Error - getTodayClasses:', error);
      throw new Error(`Service Error: ${error.message}`);
    }
  }

  async getClassAttendanceDetail(classId, scheduleIdParam, sessionNumberParam) {
    try {
      // 1. Get class info and students
      const classResp = await this.repository.getClassByIdWithSchedules(classId);
      const studentsResp = await this.repository.getStudentsByClassWithAttendance(classId);

      const classInfo = classResp && classResp.success ? classResp.data : null;
      let students = studentsResp && studentsResp.success ? studentsResp.data : [];

      // 2. Generate available dates from schedules
      const availableDates = this._generateAvailableDates(classInfo);

      // 3. Determine current schedule ID
      let currentScheduleId = scheduleIdParam;
      if (!currentScheduleId && availableDates.length > 0) {
        currentScheduleId = availableDates[0].scheduleId;
      }

      // 4. Create session options from attendance data
      const sessionOptions = this._extractSessionOptions(students);

      // 5. Determine session number
      let sessionNumber = sessionNumberParam;
      if (sessionNumber === '' || !sessionNumber) {
        sessionNumber = sessionOptions.length > 0 
          ? sessionOptions[sessionOptions.length - 1] 
          : 1;
      }

      // 6. Filter students by session
      if (sessionNumber) {
        students = this._filterStudentsBySession(students, Number(sessionNumber));
      }

      return {
        classInfo,
        students,
        sessionOptions,
        sessionNumber,
        scheduleId: currentScheduleId,
        availableDates
      };
    } catch (error) {
      console.error('Service Error - getClassAttendanceDetail:', error);
      throw error;
    }
  }

  async bulkUpdateAttendance(classId, scheduleId, attendanceUpdates, sessionNumber, recordedBy) {
    try {
      if (!classId || !scheduleId) {
        throw new Error('Class ID/Schedule ID required');
      }
      if (!Array.isArray(attendanceUpdates) || attendanceUpdates.length === 0) {
        throw new Error('No updates provided');
      }

      // Auto-increment session logic
      let targetSession = sessionNumber;
      if (!targetSession || targetSession == 'null') {
        const currentMax = await this.repository.getMaxSessionNumber(classId);
        targetSession = currentMax + 1;
        console.log(`   -> New Session Created: ${targetSession}`);
      } else {
        targetSession = Number(targetSession);
      }

      // 1. Save to Attendance table
      await this.repository.bulkUpdateAttendance(
        classId,
        scheduleId,
        attendanceUpdates,
        targetSession,
        recordedBy
      );

      // 2. Recalculate enrollment attendance rates
      for (const update of attendanceUpdates) {
        await this._updateEnrollmentAttendanceRate(classId, update.student_id);
      }

      return {
        success: true,
        message: 'Updated successfully & Rate recalculated',
        session_number: targetSession
      };
    } catch (error) {
      console.error('Service Error - bulkUpdateAttendance:', error);
      throw error;
    }
  }

  // Calculate and update enrollment attendance rate
  async _updateEnrollmentAttendanceRate(classId, studentId) {
    try {
      const enrollment = await this.enrollmentRepository.findOne({
        class_id: classId,
        student_id: studentId
      });

      if (!enrollment || !enrollment.total_sessions || enrollment.total_sessions === 0) {
        console.log(`Skip calc for Student ${studentId}: Total sessions invalid`);
        return;
      }

      // Get all attendance records for this student
      const attendanceRecords = await this.repository.getAttendanceByStudent(
        classId,
        studentId
      );

      // Calculate weighted score
      let weightedScore = 0;
      let excusedCount = 0;

      attendanceRecords.forEach(record => {
        const status = record.status;
        if (status === 'present') {
          weightedScore += 1;
        } else if (status === 'excused') {
          weightedScore += 1;
          excusedCount += 1;
        } else if (status === 'late') {
          weightedScore += 0.5;
        }
      });

      // Calculate rate
      let rate = (weightedScore / enrollment.total_sessions) * 100;
      rate = Math.round(rate * 100) / 100;
      if (rate > 100) rate = 100;

      // Determine pass/fail status
      let isPassed = true;
      let note = enrollment.notes || '';

      if (excusedCount > 4) {
        isPassed = false;
        if (!note.includes('[BAN: >4 Excused]')) note += ' [BAN: >4 Excused]';
      } else if (rate < 70) {
        isPassed = false;
        if (!note.includes('[BAN: <70% Rate]')) note += ' [BAN: <70% Rate]';
      } else {
        isPassed = true;
        note = note.replace(' [BAN: >4 Excused]', '').replace(' [BAN: <70% Rate]', '');
      }

      // Update enrollment
      await this.enrollmentRepository.update(enrollment.enrollment_id, {
        attendance_rate: rate,
        attended_sessions: weightedScore,
        is_passed: isPassed,
        notes: note.trim()
      });

    } catch (error) {
      console.error('Service Error - _updateEnrollmentAttendanceRate:', error);
    }
  }

  // Generate available dates from schedules
  _generateAvailableDates(classInfo) {
    const dates = [];
    if (!classInfo || !classInfo.schedules) return dates;

    const dayMap = [7, 1, 2, 3, 4, 5, 6]; // JS 0=Sun -> DB 1=Mon

    classInfo.schedules.forEach(schedule => {
      if (!schedule.is_active && schedule.is_active !== 1) return;

      let current = new Date(schedule.effective_from);
      let end = schedule.effective_to ? new Date(schedule.effective_to) : new Date();

      // Cap at +3 months if null
      if (!schedule.effective_to) end.setMonth(end.getMonth() + 3);

      const targetDay = schedule.day_of_week;

      while (current <= end) {
        const jsDay = current.getDay();
        const dbDay = dayMap[jsDay];

        if (dbDay === targetDay) {
          const dateStr = current.toLocaleDateString('vi-VN', {
            weekday: 'short',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
          dates.push({
            display: dateStr,
            scheduleId: schedule.schedule_id,
            value: current.toISOString().split('T')[0],
            dateObj: new Date(current)
          });
        }
        current.setDate(current.getDate() + 1);
      }
    });

    dates.sort((a, b) => a.dateObj - b.dateObj);
    return dates;
  }

  // Private: Extract session options from students' attendance data
  _extractSessionOptions(students) {
    const sessionSet = new Set();
    
    if (Array.isArray(students)) {
      students.forEach(enrollment => {
        const attendanceList = enrollment.attendance_all || [];
        if (Array.isArray(attendanceList)) {
          attendanceList.forEach(record => {
            if (record && record.session_number !== undefined && record.session_number !== null) {
              const n = Number(record.session_number);
              if (!Number.isNaN(n)) sessionSet.add(n);
            }
          });
        }
      });
    }

    return Array.from(sessionSet).sort((a, b) => a - b);
  }

  // Private: Filter students' attendance by session
  _filterStudentsBySession(students, targetSession) {
    return students.map(student => {
      const filteredStudent = { ...student };
      if (filteredStudent.attendance_all && Array.isArray(filteredStudent.attendance_all)) {
        const match = filteredStudent.attendance_all.find(
          record => Number(record.session_number) === targetSession
        );
        filteredStudent.attendance_all = match ? [match] : [];
      }
      return filteredStudent;
    });
  }

  // Private: Format single schedule
  _formatSingleSchedule(classData, schedule) {
    try {
      if (!schedule) return null;
      return {
        class_id: classData.class_id,
        class_code: classData.class_code,
        class_name: classData.class_name,
        course: classData.course,
        semester: classData.semester,
        max_capacity: classData.max_capacity,
        current_enrollment: classData.current_enrollment,
        class_status: classData.class_status,
        schedule_id: schedule.schedule_id,
        start_time: schedule.start_time ? schedule.start_time.slice(0, 5) : '00:00',
        end_time: schedule.end_time ? schedule.end_time.slice(0, 5) : '00:00',
        room: schedule.room || 'N/A',
        day_of_week: schedule.day_of_week,
        session_number: schedule.session_number,
        schedules: [schedule],
        year: 1
      };
    } catch (error) {
      return null;
    }
  }
}

module.exports = new AttendanceClassService();