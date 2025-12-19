const db = require('../models');
const { Enrollment } = db;
const AttendanceRepository = require('../repositories/attendanceRepository');
const { Op } = require('sequelize');

class AttendanceService {
  constructor() {
    this.repository = AttendanceRepository;
  }

  async markAttendanceBulk(classId, records = [], options = {}) {
    const transaction = await db.sequelize.transaction();
    try {
      // 1. Basic Validation
      if (!classId) throw new Error('Class ID is required');
      if (!options.recorded_by) throw new Error('Recorded By (User ID) is required');

      // 2. Fetch Enrolled Students
      const enrolledStudents = await Enrollment.findAll({
        where: {
          class_id: classId,
          enrollment_status: { [Op.in]: ['enrolled', 'completed'] }
        },
        attributes: ['student_id']
      });

      const validStudentIds = new Set(enrolledStudents.map(e => e.student_id));
      
      let targetSession = options.session_number;
      
      if (targetSession === undefined || targetSession === null) {
          const currentMax = await this.repository.getMaxSessionNumber(classId);
          targetSession = currentMax + 1;
      }

      const currentContext = { ...options, session_number: targetSession };

      // 3. Construct Payload
      const finalPayload = [];
      const now = new Date();
      
      if (options.create_for_all) {
        const inputMap = new Map(records.map(r => [Number(r.student_id), r]));
        for (const studentId of validStudentIds) {
          const input = inputMap.get(studentId) || {};
          finalPayload.push(this._buildRecordPayload(classId, studentId, input, currentContext, now));
        }
      } else {
        for (const rec of records) {
          const sId = Number(rec.student_id);
          if (!validStudentIds.has(sId)) {
             console.warn(`[AttendanceService] Student ${sId} not enrolled, skipping.`);
             continue; 
          }
          finalPayload.push(this._buildRecordPayload(classId, sId, rec, currentContext, now));
        }
      }

      if (finalPayload.length === 0) {
         await transaction.rollback();
         return { success: true, message: 'No valid records to process', data: [] };
      }

      // 4. Execute Upsert
      const results = await this.repository.bulkUpsert(finalPayload, transaction);

      await transaction.commit();
      
      return {
        success: true,
        message: `Successfully processed ${finalPayload.length} attendance records for Session ${targetSession}`,
        session_number: targetSession,
        data: results
      };

    } catch (error) {
      await transaction.rollback();
      throw new Error(`Service Error: ${error.message}`);
    }
  }

  async updateAttendanceRecord(identifier, updateData = {}, options = {}) {
    const transaction = await db.sequelize.transaction();
    try {
      if (!identifier) throw new Error('Attendance identifier is required');

      let whereClause = {};

      if (typeof identifier === 'number' || (typeof identifier === 'string' && /^\d+$/.test(identifier))) {
        whereClause.attendance_id = Number(identifier);
      } else if (typeof identifier === 'object') {
        if (!identifier.class_id || !identifier.student_id) {
            throw new Error('Composite update requires class_id and student_id');
        }
        whereClause.class_id = identifier.class_id;
        whereClause.student_id = identifier.student_id;
        
        if (identifier.session_number !== undefined) whereClause.session_number = identifier.session_number;
        else if (identifier.attendance_date) whereClause.attendance_date = identifier.attendance_date;
        else if (identifier.schedule_id) whereClause.schedule_id = identifier.schedule_id;
      }

      const payload = { ...updateData, recorded_at: new Date() };
      
      const updated = await this.repository.updateOne(whereClause, payload, transaction);

      if (!updated) {
        if (typeof identifier === 'object') {
             await transaction.rollback(); 
             const context = {
                 recorded_by: updateData.recorded_by,
                 schedule_id: identifier.schedule_id,
                 session_number: identifier.session_number,
                 attendance_date: identifier.attendance_date
             };
             const record = { student_id: identifier.student_id, ...updateData };
             return await this.markAttendanceBulk(identifier.class_id, [record], context);
        }
        throw new Error('Attendance record not found to update');
      }

      await transaction.commit();
      return {
        success: true,
        message: `Attendance record updated (id=${updated.attendance_id})`,
        data: updated
      };

    } catch (error) {
      await transaction.rollback();
      throw new Error(`Service Error: ${error.message}`);
    }
  }

  // --- Private Helpers ---

  _buildRecordPayload(classId, studentId, inputRecord, context, now) {
    const scheduleId = inputRecord.schedule_id || context.schedule_id || null;
    
    let sessionNum = inputRecord.session_number;
    if (sessionNum === undefined || sessionNum === null) {
        sessionNum = context.session_number;
    }
    
    let attDate = inputRecord.attendance_date || context.attendance_date;
    if (!attDate) {
        attDate = now.toISOString().split('T')[0];
    }

    return {
      class_id: classId,
      student_id: studentId,
      schedule_id: scheduleId,
      session_number: sessionNum || null, 
      attendance_date: attDate,
      status: inputRecord.status || 'present',
      check_in_time: inputRecord.check_in_time ? new Date(inputRecord.check_in_time) : now,
      notes: inputRecord.notes || null,
      recorded_by: context.recorded_by,
      recorded_at: now
    };
  }
}

module.exports =  new AttendanceService();