'use strict';

const ScheduleRepository = require('../repositories/scheduleRepository');

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

class ScheduleService {
  constructor() {
    this.repository = ScheduleRepository;
  }

  /**
   * Get all schedules with filters
   */
  async getSchedules(filters = {}) {
    try {
      const { month, year, classCode, classId, courseCode, semesterId, includeInactive, studentId, lecturerId, departmentId } = filters;

      const scheduleWhere = {};
      const classWhere = {};
      const courseWhere = {};

      // Include inactive filter
      if (includeInactive !== 'true') {
        scheduleWhere.is_active = true;
      }

      // Month/Year filter
      if (month && year) {
        const numericMonth = Number(month);
        const numericYear = Number(year);

        if (
          !Number.isInteger(numericMonth) ||
          !Number.isInteger(numericYear) ||
          numericMonth < 1 ||
          numericMonth > 12 ||
          numericYear < 1900
        ) {
          throw new ValidationError('Invalid month or year');
        }

        const schedules = await this.repository.findByMonthYear(numericMonth, numericYear, { 
          includeInactive: includeInactive === 'true',
          studentId: studentId,
          lecturerId: lecturerId,
          departmentId: departmentId
        });

        // Apply additional filters
        let filtered = schedules;

        if (classCode) {
          filtered = filtered.filter(s => s.class?.class_code === classCode);
        }

        if (courseCode) {
          filtered = filtered.filter(s => s.class?.course?.course_code === courseCode);
        }

        if (classId && Number.isInteger(Number(classId))) {
          filtered = filtered.filter(s => s.class_id === Number(classId));
        }

        if (semesterId && Number.isInteger(Number(semesterId))) {
          filtered = filtered.filter(s => s.class?.semester_id === Number(semesterId));
        }

        return {
          success: true,
          message: 'Retrieved schedules successfully',
          data: filtered.map(s => this._formatScheduleRecord(s)),
          meta: {
            count: filtered.length,
            month: numericMonth,
            year: numericYear,
          }
        };
      }

      // Without month/year, use standard filters
      if (classCode) {
        classWhere.class_code = classCode;
      }

      if (courseCode) {
        courseWhere.course_code = courseCode;
      }

      if (classId && Number.isInteger(Number(classId))) {
        classWhere.class_id = Number(classId);
      }

      if (semesterId && Number.isInteger(Number(semesterId))) {
        classWhere.semester_id = Number(semesterId);
      }

      const schedules = await this.repository.findAll({
        scheduleWhere,
        classWhere,
        courseWhere,
        studentId,
        lecturerId,
        departmentId
      });

      return {
        success: true,
        message: 'Retrieved schedules successfully',
        data: schedules.map(s => this._formatScheduleRecord(s)),
        meta: {
          count: schedules.length,
        }
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error(`Service Error - getSchedules: ${error.message}`);
    }
  }

  /**
   * Get schedule by ID
   */
  async getScheduleById(scheduleId) {
    try {
      if (!Number.isInteger(Number(scheduleId))) {
        throw new ValidationError('Invalid schedule ID');
      }

      const schedule = await this.repository.findById(Number(scheduleId));
      
      if (!schedule) {
        return {
          success: false,
          message: 'Schedule not found',
          data: null
        };
      }

      return {
        success: true,
        message: 'Retrieved schedule successfully',
        data: this._formatScheduleRecord(schedule)
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error(`Service Error - getScheduleById: ${error.message}`);
    }
  }

  /**
   * Get class options for dropdown
   */
  async getClassOptions(filters = {}) {
    try {
      const classes = await this.repository.getAllClassesSimple(filters);
      return {
        success: true,
        data: classes
      };
    } catch (error) {
       throw new Error(`Service Error - getClassOptions: ${error.message}`);
    }
  }
  async _validateConflict(payload, excludeScheduleId = null) {
    // Chỉ check conflict nếu lịch là Active
    if (payload.is_active === false) return;

    const conflict = await this.repository.findConflict({
      room: payload.room,
      building: payload.building,
      day_of_week: payload.day_of_week,
      start_time: payload.start_time,
      end_time: payload.end_time,
      effective_from: payload.effective_from,
      effective_to: payload.effective_to,
      excludeScheduleId: excludeScheduleId
    });

    if (!conflict) return;

    // Check xem ngày đó có bị Cancel lẻ không (Exceptions)
    // Nếu bạn đang thêm lịch vào đúng 1 ngày (Single Day)
    if (payload.is_single_day && payload.single_date) {
        let cancelledDates = conflict.cancelled_dates || [];
        
        // Parse JSON nếu DB lưu dạng string
        if (typeof cancelledDates === 'string') {
            try { cancelledDates = JSON.parse(cancelledDates); } catch(e) { cancelledDates = []; }
        }

        // Nếu ngày bạn định thêm nằm trong danh sách nghỉ của lịch kia -> KHÔNG TRÙNG
        if (cancelledDates.includes(payload.single_date)) {
            return; // Cho phép lưu
        }
    }

    // Nếu không thuộc ngoại lệ trên -> BÁO LỖI
    const conflictingClass = conflict.class ? conflict.class.class_code : 'another class';
    throw new ValidationError(
      `Room conflict detected! Room ${payload.room} (${payload.building}) is already occupied by ${conflictingClass} ...`
    );
  }

  /**
   * Create new schedule
   */
  async createSchedule(scheduleData) {
    try {
      const payload = this._buildSchedulePayload(scheduleData);
      await this._validateConflict(payload);
      const created = await this.repository.create(payload);

      if (created.class_id) {
          await this._syncClassSessions(created.class_id);
      }
      
      return await this.getScheduleById(created.schedule_id);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error(`Service Error - createSchedule: ${error.message}`);
    }
  }

  /**
   * Update schedule
   */
  async updateSchedule(scheduleId, scheduleData) {
    try {
      if (!Number.isInteger(Number(scheduleId))) {
        throw new ValidationError('Invalid schedule ID');
      }

      const exists = await this.repository.exists(Number(scheduleId));
      if (!exists) {
        return {
          success: false,
          message: 'Schedule not found',
          data: null
        };
      }

      const payload = this._buildSchedulePayload(scheduleData);
      await this._validateConflict(payload, Number(scheduleId));
      await this.repository.update(Number(scheduleId), payload);

      return await this.getScheduleById(Number(scheduleId));
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error(`Service Error - updateSchedule: ${error.message}`);
    }
  }

  /**
   * Delete schedule
   */
  async deleteSchedule(scheduleId) {
    try {
      if (!Number.isInteger(Number(scheduleId))) {
        throw new ValidationError('Invalid schedule ID');
      }

      // [QUAN TRỌNG] Lấy thông tin lịch trước khi xóa để biết nó thuộc lớp nào
      const schedule = await this.repository.findById(Number(scheduleId));
      if (!schedule) {
        return { success: false, message: 'Schedule not found' };
      }
      const classId = schedule.class_id; // Lưu lại ID lớp

      // Thực hiện xóa
      await this.repository.delete(Number(scheduleId));
      
      // [FIX] Gọi hàm đồng bộ lại Enrollment
      if (classId) {
          await this._syncClassSessions(classId);
      }

      return {
        success: true,
        message: 'Schedule deleted successfully',
      };
    } catch (error) {
      throw new Error(`Service Error - deleteSchedule: ${error.message}`);
    }
  }

  /**
   * Toggle schedule active status
   */
  async toggleScheduleStatus(scheduleId, statusData) {
    try {
      if (!Number.isInteger(Number(scheduleId))) {
        throw new ValidationError('Invalid schedule ID');
      }

      const schedule = await this.repository.findById(Number(scheduleId));
      if (!schedule) {
        return { success: false, message: 'Schedule not found', data: null };
      }

      // Check if cancelling/restoring a single date
      const cancelledDate = this._sanitizeString(statusData?.cancelled_date);
      if (cancelledDate) {
        return await this.toggleSingleOccurrence(scheduleId, cancelledDate);
      }

      // Determine next state for all occurrences
      let nextState;
      if (Object.prototype.hasOwnProperty.call(statusData || {}, "is_active")) {
        nextState = this._parseBoolean(statusData.is_active);
      } else {
        nextState = !schedule.is_active;
      }

      const updatePayload = { is_active: nextState };
      if (nextState === false) {
          updatePayload.cancelled_dates = []; // Reset exceptions
      }

      await this.repository.update(Number(scheduleId), updatePayload);

      // [FIX] Đồng bộ lại Enrollment sau khi Cancel/Restore toàn bộ
      if (schedule.class_id) {
          await this._syncClassSessions(schedule.class_id);
      }

      return await this.getScheduleById(Number(scheduleId));
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new Error(`Service Error - toggleScheduleStatus: ${error.message}`);
    }
  }

  /**
   * Toggle single occurrence (cancel/restore specific date)
   */
  async toggleSingleOccurrence(scheduleId, dateStr) {
    try {
      const schedule = await this.repository.findById(Number(scheduleId));
      if (!schedule) {
        return {
          success: false,
          message: 'Schedule not found'
        };
      }

      // Check if it's a recurring schedule
      const isRecurring = !(
        schedule.effective_from &&
        schedule.effective_to &&
        this._formatDate(schedule.effective_from) === this._formatDate(schedule.effective_to)
      );

      if (!isRecurring) {
        return {
          success: false,
          message: 'Cannot cancel specific date for single-day schedule'
        };
      }

      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dateStr)) {
        throw new ValidationError('Invalid date format. Expected YYYY-MM-DD');
      }

      // Get current cancelled dates
      let cancelledDates = schedule.cancelled_dates || [];
      if (!Array.isArray(cancelledDates)) {
        cancelledDates = [];
      }

      const index = cancelledDates.indexOf(dateStr);

      if (index > -1) {
        // Restore: Remove from array
        cancelledDates.splice(index, 1);
      } else {
        // Cancel: Add to array
        cancelledDates.push(dateStr);
      }

      // Update schedule
      await this.repository.update(Number(scheduleId), {
        cancelled_dates: cancelledDates.length > 0 ? cancelledDates : null
      });

      if (schedule.class_id) {
          await this._syncClassSessions(schedule.class_id);
      }

      return await this.getScheduleById(Number(scheduleId));
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error(`Service Error - toggleSingleOccurrence: ${error.message}`);
    }
  }

  /**
   * Delete single occurrence (add to deleted_dates)
   */
  async deleteSingleOccurrence(scheduleId, dateToDelete) {
    try {
      const schedule = await this.repository.findById(Number(scheduleId));
      if (!schedule) {
        return { success: false, message: 'Schedule not found' };
      }

      let deleted = schedule.deleted_dates || [];
      if (typeof deleted === 'string') { try { deleted = JSON.parse(deleted); } catch(e) { deleted = []; } }

      if (!deleted.includes(dateToDelete)) {
        deleted.push(dateToDelete);
      }

      // Cleanup cancelled_dates if exists
      let cancelled = schedule.cancelled_dates || [];
      if (typeof cancelled === 'string') try { cancelled = JSON.parse(cancelled); } catch(e) {}
      let newCancelled = cancelled.filter(d => d !== dateToDelete);

      await this.repository.update(Number(scheduleId), {
        deleted_dates: deleted,
        cancelled_dates: newCancelled
      });

      // [FIX] Gọi hàm đồng bộ lại để trừ đi 1 buổi
      if (schedule.class_id) {
          await this._syncClassSessions(schedule.class_id);
      }

      return { success: true, message: 'Single occurrence deleted successfully' };

    } catch (error) {
      throw new Error(`Service Error - deleteSingleOccurrence: ${error.message}`);
    }
  }
  /**
   * Edit single occurrence (create override for specific date)
   */
  async editSingleOccurrence(scheduleId, dateStr, updateData) {
    try {
      const originalSchedule = await this.repository.findById(Number(scheduleId));
      if (!originalSchedule) {
        return { success: false, message: 'Original schedule not found' };
      }

      // Tạo lịch mới (Lịch con đè lên)
      const overrideData = {
        ...updateData,
        is_single_day: true,
        single_date: dateStr,
        effective_from: dateStr,
        effective_to: dateStr,
        class_id: updateData.class_id || originalSchedule.class_id,
        room: updateData.room || originalSchedule.room, 
        start_time: updateData.start_time || originalSchedule.start_time,
        end_time: updateData.end_time || originalSchedule.end_time,
      };

      const payload = this._buildSchedulePayload(overrideData);
      await this._validateConflict(payload, Number(scheduleId));
      const createdSchedule = await this.repository.create(payload);

      // XỬ LÝ LỊCH CŨ (restore)
      let cancelled = originalSchedule.cancelled_dates || [];
      if (typeof cancelled === 'string') {
          try { cancelled = JSON.parse(cancelled); } catch(e) { cancelled = []; }
      }

      // Logic "Ẩn mình" thông minh:
      if (originalSchedule.is_active) {
          // Lịch cha đang CHẠY -> Cần THÊM vào ds hủy để ẩn nó đi
          if (!cancelled.includes(dateStr)) {
              cancelled.push(dateStr);
              await this.repository.update(Number(scheduleId), { cancelled_dates: cancelled });
          }
      } else {
          // Lịch cha đang TẮT (Cancel All) -> Cần XÓA khỏi ds hủy
          // Tại sao? Vì nếu để trong ds hủy, Frontend sẽ tưởng đây là ngày được Restore (Ngoại lệ).
          // Ta muốn nó tắt hẳn theo cha để nhường chỗ cho lịch mới hiển thị.
          if (cancelled.includes(dateStr)) {
              cancelled = cancelled.filter(d => d !== dateStr);
              await this.repository.update(Number(scheduleId), { cancelled_dates: cancelled });
          }
      }

      return { success: true, 
        data: createdSchedule 
      };

    } catch (error) {
      throw new Error(`Service Error - editSingleOccurrence: ${error.message}`);
    }
  }

  /**
   * Build schedule payload from request data
   * @private
   */
  _buildSchedulePayload(body = {}) {
    const classId = this._parseInteger(body.class_id, "class_id");
    const startTime = this._normalizeTime(body.start_time, "start_time");
    const endTime = this._normalizeTime(body.end_time, "end_time");
    const lecturerId = body.lecturer_id ? this._parseInteger(body.lecturer_id, "lecturer_id") : null;

    if (startTime >= endTime) {
      throw new ValidationError("end_time must be after start_time");
    }

    const room = this._requireString(body.room, "room");
    const scheduleType = this._sanitizeString(body.schedule_type) || "lecture";
    const building = this._requireString(body.building, "building");
    const campus = this._sanitizeString(body.campus);
    const notes = this._sanitizeString(body.notes);

    const isOnline = this._parseBoolean(body.is_online);
    const onlineMeetingUrl = this._sanitizeString(body.online_meeting_url);
    if (isOnline && !onlineMeetingUrl) {
      throw new ValidationError("online_meeting_url is required when is_online is true");
    }

    const isSingleDay = this._parseBoolean(body.is_single_day);
    let effectiveFrom = this._sanitizeString(body.effective_from);
    let effectiveTo = this._sanitizeString(body.effective_to);
    let dayOfWeek = body.day_of_week !== undefined ? Number(body.day_of_week) : null;

    if (isSingleDay) {
      const singleDate = this._sanitizeString(body.single_date) || effectiveFrom || effectiveTo;
      if (!singleDate) {
        throw new ValidationError("single_date is required for single-day schedules");
      }
      effectiveFrom = singleDate;
      effectiveTo = singleDate;
      dayOfWeek = this._deriveDayOfWeekFromDate(singleDate);
    } else {
      if (!effectiveFrom) {
        throw new ValidationError("effective_from is required for recurring schedules");
      }
      if (!Number.isInteger(dayOfWeek)) {
        throw new ValidationError("day_of_week must be an integer between 1 and 7");
      }
      if (dayOfWeek < 1 || dayOfWeek > 7) {
        throw new ValidationError("day_of_week must be between 1 and 7");
      }

      if (effectiveTo) {
        const startDate = new Date(`${effectiveFrom}T00:00:00.000Z`);
        const endDate = new Date(`${effectiveTo}T00:00:00.000Z`);
        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
          throw new ValidationError("Invalid effective_from/effective_to date");
        }
        if (endDate < startDate) {
          throw new ValidationError("effective_to must be on or after effective_from");
        }
      } else {
        effectiveTo = null;
      }
    }

    return {
      class_id: classId,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      effective_from: this._toDateValue(effectiveFrom, "effective_from"),
      effective_to: effectiveTo ? this._toDateValue(effectiveTo, "effective_to") : null,
      room,
      building,
      campus,
      schedule_type: scheduleType,
      is_active: body.is_active !== undefined ? this._parseBoolean(body.is_active) : true,
      is_online: isOnline,
      online_meeting_url: onlineMeetingUrl || null,
      notes,
      lecturer_id: lecturerId,
      is_single_day: isSingleDay,
      single_date: isSingleDay ? effectiveFrom : null, 
    };
  }
  async getLecturerOptions(deptId) {
      try {
          const lecturers = await this.repository.getLecturersByDepartment(deptId);
          return { success: true, data: lecturers };
      } catch(e) { throw e; }
  }

  /**
   * Format schedule record for response
   * @private
   */
  _formatScheduleRecord(scheduleInstance) {
    const schedule = scheduleInstance.get ? scheduleInstance.get({ plain: true }) : scheduleInstance;
    const classData = schedule.class || {};
    const courseData = classData.course || {};
    const lecturerData = classData.lecturer || {};
    const lecturerUser = lecturerData.user || {};
    const mainLecturer = classData.lecturer || {};
    const subLecturer = schedule.schedule_lecturer || {};
    const finalLecturer = (schedule.lecturer_id && subLecturer.user_id) ? subLecturer : mainLecturer;
    const finalUser = finalLecturer.user || {};

    const instructorName = finalUser.full_name || "TBA";

    return {
      schedule_id: schedule.schedule_id,
      class_id: schedule.class_id,
      class_code: classData.class_code || null,
      class_name: classData.class_name || null,
      course_id: courseData.course_id || null,
      course_code: courseData.course_code || null,
      course_name: courseData.course_name || classData.class_name || "Untitled class",
      department_id: courseData.department_id || null,
      semester_id: classData.semester_id || null,
      day_of_week: schedule.day_of_week,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      effective_from: this._formatDate(schedule.effective_from),
      effective_to: this._formatDate(schedule.effective_to),
      room: schedule.room,
      building: schedule.building,
      campus: schedule.campus,
      schedule_type: schedule.schedule_type,
      is_active: schedule.is_active,
      is_online: schedule.is_online,
      online_meeting_url: schedule.online_meeting_url,
      lecturer_id: finalLecturer.user_id, // Để frontend biết đang chọn ai
      lecturer_rank: finalLecturer.academic_rank || '',
      lecturer_degree: finalLecturer.degree || '',
      lecturer_email: finalUser.email || '',
      instructor_name: instructorName,
      notes: schedule.notes,
      cancelled_dates: schedule.cancelled_dates || [],
      deleted_dates: schedule.deleted_dates || [],
      is_substitute: !!schedule.lecturer_id
    };
  }

  // ========== Validation & Helper Methods ==========
  // sync từng lớp
  // async syncClassSessionsPublic(classId) {
  //     return await this._syncClassSessions(classId);
  // }

  // sync all
  async syncAllClassesPublic() {
    try {
      // Lấy danh sách tất cả lớp
      const classIds = await this.repository.getAllClassIds();
      // console.log(`[Sync All] Found ${classIds.length} classes. Starting sync...`);

      //  Chạy sync cho từng lớp
      // Dùng Promise.all để chạy song song cho nhanh (hoặc for loop nếu sợ quá tải DB)
      const promises = classIds.map(id => this._syncClassSessions(id));
      await Promise.all(promises);
      // console.log(`[Sync All] Finished syncing ${classIds.length} classes.`);
      return { count: classIds.length };
    } catch (error) {
      console.error("Sync All Error:", error);
      throw error;
    }
  }
  //

  /**
   * Tính toán và đồng bộ lại tổng số buổi học của lớp
   */
  async _syncClassSessions(classId) {
    if (!classId) return;

    try {
      // Lấy tất cả lịch ACTIVE của lớp
      const schedules = await this.repository.findAllByClassId(classId);
      
      let totalSessions = 0;

      // Duyệt qua từng lịch để đếm số buổi
      for (const sch of schedules) {

        if (sch.schedule_type === 'exam' || sch.schedule_type === 'review') continue;
        // Nếu là lịch đơn (Single Day)
        if (sch.is_single_day || (sch.effective_from === sch.effective_to)) {
             totalSessions += 1;
        } 
        // Nếu là lịch lặp (Recurring)
        else {
             const occurrences = this._calculateOccurrences(
                 sch.effective_from, 
                 sch.effective_to, 
                 sch.day_of_week
             );

             let cancelled = sch.cancelled_dates || [];
             let deleted = sch.deleted_dates || [];
             
             if (typeof cancelled === 'string') try { cancelled = JSON.parse(cancelled) } catch(e) { cancelled = [] }
             if (typeof deleted === 'string') try { deleted = JSON.parse(deleted) } catch(e) { deleted = [] }

             // Gộp danh sách ngày nghỉ và ngày xóa
             const excludedDates = new Set([...cancelled, ...deleted]);
             
             // Chỉ trừ đi những ngày thực sự nằm trong danh sách occurrences
             // (Tránh trường hợp data rác: ngày cancel nằm ngoài khoảng effective vẫn bị trừ)
             let validExclusions = 0;
             excludedDates.forEach(dateStr => {
                 // Có thể thêm check xem dateStr có nằm trong range effective không
                 // Nhưng đơn giản nhất là trừ thẳng vì FE/BE đã validate lúc add rồi
                 validExclusions++;
             });
             
             totalSessions += Math.max(0, occurrences - excludedDates.size);
        }
      }

      // Cập nhật vào DB
      // console.log(`[Sync] Updating Class ${classId} Total Sessions to: ${totalSessions}`);
      await this.repository.updateEnrollmentTotalSessions(classId, totalSessions);

    } catch (error) {
      console.error(`Failed to sync class sessions for class ${classId}:`, error);
    }
  }

  // Hàm phụ: Tính số lần lặp chuẩn xác
  _calculateOccurrences(startDateStr, endDateStr, dayOfWeek) {
      if (!startDateStr || !endDateStr || !dayOfWeek) return 0;
      
      const start = new Date(startDateStr);
      const end = new Date(endDateStr);
      // Reset giờ về 0 để so sánh ngày chuẩn
      start.setHours(0,0,0,0);
      end.setHours(0,0,0,0);

      let count = 0;
      let current = new Date(start);
      
      // Quy đổi: Input DB (1=Mon...7=Sun) sang JS (1=Mon...0=Sun)
      // dayOfWeek % 7 sẽ biến 7 thành 0, 1 thành 1... chuẩn JS getDay()
      const targetJsDay = dayOfWeek % 7; 

      while (current <= end) {
          if (current.getDay() === targetJsDay) {
              count++;
          }
          // Tăng ngày an toàn
          current.setDate(current.getDate() + 1);
      }
      return count;
  }

  _formatDate(value) {
    if (!value) {
      return null;
    }
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString().split("T")[0];
  }

  _sanitizeString(value) {
    if (typeof value === "string") {
      return value.trim();
    }
    return value ?? null;
  }

  _requireString(value, fieldName) {
    const sanitized = this._sanitizeString(value);
    if (!sanitized) {
      throw new ValidationError(`${fieldName} is required`);
    }
    return sanitized;
  }

  _parseInteger(value, fieldName) {
    const parsed = Number(value);
    if (!Number.isInteger(parsed)) {
      throw new ValidationError(`${fieldName} must be an integer`);
    }
    return parsed;
  }

  _parseBoolean(value) {
    if (typeof value === "boolean") {
      return value;
    }
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["true", "1", "yes", "on"].includes(normalized)) {
        return true;
      }
      if (["false", "0", "no", "off"].includes(normalized)) {
        return false;
      }
    }
    return Boolean(value);
  }

  _normalizeTime(value, fieldName) {
    const sanitized = this._sanitizeString(value);
    if (!sanitized) {
      throw new ValidationError(`${fieldName} is required`);
    }
    const match = sanitized.match(/^([0-1]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/);
    if (!match) {
      throw new ValidationError(`${fieldName} must be in HH:mm format`);
    }
    return `${match[1]}:${match[2]}:${match[3] || "00"}`;
  }

  _toDateValue(value, fieldName = "date") {
    if (!value) {
      return null;
    }
    // FIX: Thêm .000Z để force UTC
    const parsed = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime())) {
      throw new ValidationError(`Invalid ${fieldName}`);
    }
    return parsed;
  }

  _deriveDayOfWeekFromDate(value) {
    // FIX: Thêm .000Z và dùng getUTCDay()
    const parsed = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime())) {
      throw new ValidationError("Invalid date for day_of_week derivation");
    }
    const day = parsed.getUTCDay();
    return day === 0 ? 7 : day;
  }
}

module.exports = new ScheduleService();