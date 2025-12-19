'use strict';

const { Op, where } = require("sequelize");
const db = require("../models");
const { lecturer } = require("../config/navigation");

class ScheduleRepository {
  // Find schedule by ID with associations
  async findById(scheduleId, includeOptions = {}) {
    try {
      const { classWhere, courseWhere } = includeOptions;
      
      return await db.Schedules.findOne({
        where: { schedule_id: scheduleId },
        include: this._buildScheduleInclude({ classWhere, courseWhere }),
      });
    } catch (error) {
      throw new Error(`Repository Error - findById: ${error.message}`);
    }
  }

  async getAllClassesSimple(filters = {}) {
    try {
      const { departmentId, lecturerId, studentId } = filters;
      const includeOptions = [];
      includeOptions.push({
          model: db.Courses,
          as: 'course', 
          attributes: ['course_name', 'course_code'],
          required: true,
          ...(departmentId && { where: { department_id: departmentId } })
      });
      if (departmentId) {
          includeOptions.push({
              model: db.Courses,
              as: 'course', 
              attributes: [], 
              where: { department_id: departmentId },
              required: true 
          });
      }
      includeOptions.push({
          model: db.Lecturers,
          as: 'lecturer', 
          attributes: ['user_id', 'lecturer_code'],
          include: [{ model: db.Users, as: 'user', attributes: ['full_name'] }]
      });
      if (studentId) {
          includeOptions.push({
              model: db.Enrollment,
              as: 'enrollment',
              attributes: [],
              where: { 
                  student_id: studentId,
              },
              required: true
          });
      }
      const whereClause = {};
      
      if (lecturerId) {
          whereClause.lecturer_id = lecturerId;
      }
      return await db.Classes.findAll({
        where: whereClause,
        attributes: ['class_id', 'class_code', 'class_name', 'lecturer_id', 'course_id'],
        include: includeOptions,
        order: [['class_code', 'ASC']]
      });
    } catch (error) {
      throw new Error(`Repository Error - getAllClassesSimple: ${error.message}`);
    }
  }

  async getLecturersByDepartment(departmentId) {
      try {
          const whereClause = {};
          if (departmentId) {
            whereClause.department_id = departmentId;
          }
          return await db.Lecturers.findAll({
              where: whereClause,
              attributes: ['user_id', 'lecturer_code'],
              include: [{ 
                  model: db.Users, 
                  as: 'user', 
                  attributes: ['full_name', 'email'] 
              }]
          });
      } catch (error) {
          throw new Error(`Repository Error - getLecturersByDepartment: ${error.message}`);
      }
  }

  async findConflict(criteria) {
    try {
      const { 
        room, 
        building,
        day_of_week, 
        start_time, 
        end_time, 
        effective_from, 
        effective_to,
        excludeScheduleId 
      } = criteria;

      const whereClause = {
        is_active: true,
        room: room,
        building: building,
        day_of_week: day_of_week,
        [Op.and]: [
          { start_time: { [Op.lt]: end_time } },
          { end_time: { [Op.gt]: start_time } }
        ],
        effective_from: { [Op.lte]: effective_to },
        effective_to: { [Op.gte]: effective_from }
      };

      if (excludeScheduleId) {
        whereClause.schedule_id = { [Op.ne]: excludeScheduleId };
      }

      return await db.Schedules.findOne({
        where: whereClause,
        attributes: ['schedule_id', 'class_id', 'start_time', 'end_time', 'cancelled_dates'],
        include: [
            { model: db.Classes, 
              as: 'class', 
              attributes: ['class_code', 'class_name'] 
            }]
      });
    } catch (error) {
      throw new Error(`Repository Error - findConflict: ${error.message}`);
    }
  }

  // Find all schedules with filters
  async findAll(filters = {}) {
    try {
      const { 
        scheduleWhere = {}, 
        classWhere = {}, 
        courseWhere = {},
        studentId = null,
        lecturerId = null,
        departmentId = null,
        order = [['day_of_week', 'ASC'], ['start_time', 'ASC']]
      } = filters;

      const includeOptions = this._buildScheduleInclude({ 
          classWhere, 
          courseWhere, 
          studentId,
          lecturerId,
          departmentId
      });

      return await db.Schedules.findAll({
        where: scheduleWhere,
        include: includeOptions,
        order,
      });
    } catch (error) {
      throw new Error(`Repository Error - findAll: ${error.message}`);
    }
  }

  // Create new schedule
  async create(scheduleData) {
    try {
      return await db.Schedules.create(scheduleData);
    } catch (error) {
      throw new Error(`Repository Error - create: ${error.message}`);
    }
  }

  // Update schedule
  async update(scheduleId, scheduleData) {
    try {
      const schedule = await db.Schedules.findByPk(scheduleId);
      if (!schedule) {
        return null;
      }
      return await schedule.update(scheduleData);
    } catch (error) {
      throw new Error(`Repository Error - update: ${error.message}`);
    }
  }

  // Delete schedule
  async delete(scheduleId) {
    try {
      return await db.Schedules.destroy({ 
        where: { schedule_id: scheduleId } 
      });
    } catch (error) {
      throw new Error(`Repository Error - delete: ${error.message}`);
    }
  }
  // sync lại all total_sessions seeder
  async getAllClassIds() {
    try {
      const classes = await db.Classes.findAll({
        attributes: ['class_id']
      });
      return classes.map(c => c.class_id);
    } catch (error) {
      throw new Error(`Repository Error - getAllClassIds: ${error.message}`);
    }
  }
  //

  async findAllByClassId(classId) {
    try {
      return await db.Schedules.findAll({
        where: { 
          class_id: classId,
          is_active: true // Chỉ lấy lịch đang hoạt động
        }
      });
    } catch (error) {
      throw new Error(`Repository Error - findAllByClassId: ${error.message}`);
    }
  }

  // Cập nhật total_sessions cho TẤT CẢ sinh viên trong lớp đó
  async updateEnrollmentTotalSessions(classId, totalSessions) {
    try {
      // Update bảng Enrollment
      await db.Enrollment.update(
        { total_sessions: totalSessions },
        { where: { class_id: classId } }
      );
      return true;
    } catch (error) {
      throw new Error(`Repository Error - updateEnrollmentTotalSessions: ${error.message}`);
    }
  }

  // Find schedules by month/year
  async findByMonthYear(month, year, options = {}) {
    try {
      const { includeInactive = false, studentId, lecturerId, departmentId } = options;

      const scheduleWhere = {};
      
      if (!includeInactive) {
        scheduleWhere.is_active = true;
      }

      const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
      const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

      scheduleWhere[Op.and] = [
        { effective_from: { [Op.lte]: endOfMonth } },
        {
          [Op.or]: [
            { effective_to: null }, 
            { effective_to: { [Op.gte]: startOfMonth } }
          ],
        },
      ];

      return await this.findAll({ 
        scheduleWhere,
        studentId,
        lecturerId,
        departmentId
      });
    } catch (error) {
      throw new Error(`Repository Error - findByMonthYear: ${error.message}`);
    }
  }

  // Find schedules by class ID
  async findByClassId(classId, options = {}) {
    try {
      const classWhere = { class_id: classId };
      return await this.findAll({ classWhere, ...options });
    } catch (error) {
      throw new Error(`Repository Error - findByClassId: ${error.message}`);
    }
  }

  // Check schedule exists
  async exists(scheduleId) {
    try {
      const count = await db.Schedules.count({
        where: { schedule_id: scheduleId }
      });
      return count > 0;
    } catch (error) {
      throw new Error(`Repository Error - exists: ${error.message}`);
    }
  }

  // Build include options for associations
  _buildScheduleInclude({ classWhere, courseWhere, studentId, lecturerId, departmentId } = {}) {
    const resolvedClassWhere = classWhere && Object.keys(classWhere).length ? classWhere : undefined;
    const resolvedCourseWhere = courseWhere && Object.keys(courseWhere).length ? courseWhere : undefined;
    
    const lecturerInclude = {
        model: db.Lecturers,
        as: "lecturer",
        attributes: ["user_id", "lecturer_code", "academic_rank", "degree"],
        include: [{ 
          model: db.Users, 
          as: "user", 
          attributes: ["full_name", "email"] }],
        required: false,
    };

    const scheduleLecturerInclude = {
        model: db.Lecturers,
        as: "schedule_lecturer",
        attributes: ["user_id", "lecturer_code", "academic_rank", "degree"],
        include: [{ model: db.Users, as: "user", attributes: ["full_name", "email"] }],
        required: false
    };
    
    if (lecturerId) {
        lecturerInclude.where = { user_id: lecturerId };
        lecturerInclude.required = true; 
    }

    const courseInclude = {
        model: db.Courses,
        as: "course",
        attributes: ["course_id", "course_code", "course_name", "department_id"],
        required: false,
        where: resolvedCourseWhere
    };

    if (departmentId) {
        courseInclude.where = { 
            ...courseInclude.where, 
            department_id: departmentId 
        };
        courseInclude.required = true;
    }
    
    const classInclude = {
        model: db.Classes,
        as: "class",
        attributes: ["class_id", "class_code", "class_name", "class_type", "semester_id"],
        where: resolvedClassWhere,
        required: true, 
        include: [
          courseInclude,
          lecturerInclude, 
        ],
    };

    if (studentId) {
        classInclude.include.push({
            model: db.Enrollment, 
            as: 'enrollment',
            attributes: [], 
            where: { 
                student_id: studentId,
                enrollment_status: 'enrolled' 
            },
            required: true 
        });
    }
    return [classInclude, scheduleLecturerInclude];
  }
}

module.exports = new ScheduleRepository();