const db = require('../models');
const { Attendance } = db;
const { Op } = require('sequelize');

class AttendanceRepository {
  
  // Bulk Upsert (Create or Update) attendance records.
  async bulkUpsert(attendancePayloads, transaction) {
    try {
      const updateFields = [
        'status', 
        'check_in_time', 
        'notes', 
        'recorded_by', 
        'recorded_at', 
        'session_number', 
        'schedule_id'
      ];

      const result = await Attendance.bulkCreate(attendancePayloads, {
        updateOnDuplicate: updateFields,
        transaction: transaction,
        validate: true
      });

      return result;
    } catch (error) {
      throw error; 
    }
  }

  // Update a single record.
  async updateOne(whereClause, updateData, transaction) {
    const [updatedCount] = await Attendance.update(updateData, {
      where: whereClause,
      transaction: transaction
    });
    
    if (updatedCount === 0) return null;
    return await Attendance.findOne({ where: whereClause, transaction });
  }

  /**
   * Find the highest session number for a specific class.
   * Returns 0 if no records found.
   */
  async getMaxSessionNumber(classId) {
    const maxSession = await Attendance.max('session_number', { 
      where: { class_id: classId } 
    });
    return (maxSession && !isNaN(maxSession)) ? Number(maxSession) : 0;
  }
}

module.exports = new AttendanceRepository();