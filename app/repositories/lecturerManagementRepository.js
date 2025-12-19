'use strict';
const { Op } = require('sequelize');
const {
  Users,
  Lecturers,
  Departments,
  Roles,
  UserRoles,
  Classes,
  Students,
  Enrollment,
  Grades,
  Majors,
  Courses,
  Semesters,
  sequelize
} = require('../models');
const bcrypt = require('bcryptjs');

class LecturerManagementRepository {
  // Get all lecturers with pagination and filters
  async getAllLecturers(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search = null,
        department_id = null,
        is_active = null,
        academic_rank = null,
        include_deleted = true
      } = options;

      const offset = (page - 1) * limit;
      const whereConditions = include_deleted ? {} : { is_deleted: false };

      if (search) {
        whereConditions[Op.or] = [
          { first_name: { [Op.like]: `%${search}%` } },
          { last_name: { [Op.like]: `%${search}%` } },
          { full_name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { '$Lecturer.lecturer_code$': { [Op.like]: `%${search}%` } }
        ];
      }

      const lecturerInclude = {
        model: Lecturers,
        as: 'Lecturer',
        required: true,
        attributes: [
          'lecturer_code',
          'department_id',
          'academic_rank',
          'degree',
          'office_room',
          'office_hours',
          'bio',
          'is_active',
          'created_at',
          'updated_at'
        ],
        include: [{
          model: Departments,
          as: 'department',
          attributes: [
            'department_id',
            'department_code',
            'department_name'
          ]
        }]
      };

      const lecturerWhere = {};
      if (department_id) lecturerWhere.department_id = department_id;
      if (is_active !== null) lecturerWhere.is_active = is_active;
      if (academic_rank) lecturerWhere.academic_rank = academic_rank;

      if (Object.keys(lecturerWhere).length > 0) {
        lecturerInclude.where = lecturerWhere;
      }

      const { count, rows } = await Users.findAndCountAll({
        where: whereConditions,
        include: [
          lecturerInclude,
          {
            model: UserRoles,
            as: 'user_role',
            required: true,
            include: [{
              model: Roles,
              as: 'role',
              where: { role_name: 'lecturer' },
              attributes: ['role_name']
            }]
          }
        ],
        attributes: [
          'user_id',
          'username',
          'first_name',
          'last_name',
          'full_name',
          'email',
          'date_of_birth',
          'gender',
          'phone',
          'address',
          'avatar_url',
          'is_active',
          'is_deleted',
          'deleted_at',
          'created_at',
          'updated_at'
        ],
        limit,
        offset,
        order: [
          ['is_deleted', 'ASC'],
          [{ model: Lecturers, as: 'Lecturer' }, 'academic_rank', 'DESC'],
          ['last_name', 'ASC']
        ],
        distinct: true
      });

      return {
        total: count,
        total_pages: Math.ceil(count / limit),
        current_page: page,
        data: rows
      };
    } catch (error) {
      throw new Error(`Repository Error - getAllLecturers: ${error.message}`);
    }
  }

  // Get lecturer by ID
  async getLecturerById(userId) {
    try {
      const user = await Users.findOne({
        where: {
          user_id: userId,
        },
        include: [
          {
            model: Lecturers,
            as: 'Lecturer',
            required: true,
            attributes: [
              'lecturer_code',
              'department_id',
              'academic_rank',
              'degree',
              'office_room',
              'office_hours',
              'bio',
              'is_active',
              'created_at',
              'updated_at'
            ],
            include: [{
              model: Departments,
              as: 'department',
              attributes: [
                'department_id',
                'department_code',
                'department_name',
                'phone',
                'email',
                'location'
              ]
            }]
          },
          {
            model: UserRoles,
            as: 'user_role',
            include: [{
              model: Roles,
              as: 'role',
              attributes: ['role_id', 'role_name']
            }]
          }
        ],
        attributes: [
          'user_id',
          'username',
          'first_name',
          'last_name',
          'full_name',
          'email',
          'date_of_birth',
          'gender',
          'phone',
          'address',
          'avatar_url',
          'is_active',
          'created_at',
          'updated_at'
        ]
      });

      return user ? user.toJSON() : null;
    } catch (error) {
      throw new Error(`Repository Error - getLecturerById: ${error.message}`);
    }
  }

  // Create new lecturer
  async createLecturer(userData, lecturerData) {
    const transaction = await sequelize.transaction();
    try {
      // Validate email
      const emailExists = await Users.count({
        where: {
          email: userData.email,
          is_deleted: false
        }
      });
      if (emailExists > 0) {
        throw new Error('Email already exists');
      }

      // Validate username
      const usernameExists = await Users.count({
        where: {
          username: userData.username,
          is_deleted: false
        }
      });
      if (usernameExists > 0) {
        throw new Error('Username already exists');
      }

      // Validate lecturer_code
      const codeExists = await Lecturers.count({
        where: { lecturer_code: lecturerData.lecturer_code }
      });
      if (codeExists > 0) {
        throw new Error('Lecturer code already exists');
      }

      // Validate department
      const department = await Departments.findByPk(lecturerData.department_id);
      if (!department) {
        throw new Error('Department not found');
      }
      if (!department.is_active) {
        throw new Error('Department is inactive');
      }

      // Hash password
      const password_hash = await bcrypt.hash(userData.password, 10);

      // Create user
      const user = await Users.create({
        username: userData.username,
        email: userData.email,
        password_hash,
        first_name: userData.first_name,
        last_name: userData.last_name,
        full_name: `${userData.last_name} ${userData.first_name}`,
        date_of_birth: userData.date_of_birth || null,
        gender: userData.gender || null,
        phone: userData.phone || null,
        address: userData.address || null,
        avatar_url: userData.avatar_url || null,
        is_active: true
      }, { transaction });

      // Create lecturer record
      await Lecturers.create({
        user_id: user.user_id,
        lecturer_code: lecturerData.lecturer_code,
        department_id: lecturerData.department_id,
        academic_rank: lecturerData.academic_rank || null,
        degree: lecturerData.degree || null,
        office_room: lecturerData.office_room || null,
        office_hours: lecturerData.office_hours || null,
        bio: lecturerData.bio || null,
        is_active: true
      }, { transaction });

      // Assign role
      const lecturerRole = await Roles.findOne({
        where: { role_name: 'lecturer', is_active: true }
      });

      if (!lecturerRole) {
        throw new Error('Lecturer role not found');
      }

      await UserRoles.create({
        user_id: user.user_id,
        role_id: lecturerRole.role_id,
        is_active: true
      }, { transaction });

      await transaction.commit();
      return await this.getLecturerById(user.user_id);
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Repository Error - createLecturer: ${error.message}`);
    }
  }

  // Update lecturer
  async updateLecturer(userId, userData, lecturerData) {
    const transaction = await sequelize.transaction();
    try {
      const user = await Users.findOne({
        where: {
          user_id: userId,
          is_deleted: false
        },
        include: [{
          model: Lecturers,
          as: 'Lecturer',
          required: true
        }],
        transaction
      });

      if (!user) {
        throw new Error('Lecturer not found');
      }

      if (userData.username && userData.username !== user.username) {
        const usernameExists = await Users.count({
            where: { 
                username: userData.username,
                is_deleted: false,
                user_id: { [Op.ne]: userId }
            }
        });
        if (usernameExists > 0) {
            throw new Error('Username already exists');
        }
      }

      // Validate email if changed
      if (userData.email && userData.email !== user.email) {
        const emailExists = await Users.count({
          where: {
            email: userData.email,
            is_deleted: false,
            user_id: { [Op.ne]: userId }
          }
        });
        if (emailExists > 0) {
          throw new Error('Email already exists');
        }
      }

      // Validate lecturer_code if changed
      if (lecturerData.lecturer_code &&
        lecturerData.lecturer_code !== user.Lecturer.lecturer_code) {
        const codeExists = await Lecturers.count({
          where: {
            lecturer_code: lecturerData.lecturer_code,
            user_id: { [Op.ne]: userId }
          }
        });
        if (codeExists > 0) {
          throw new Error('Lecturer code already exists');
        }
      }

      // Validate department if changed
      if (lecturerData.department_id &&
        lecturerData.department_id !== user.Lecturer.department_id) {
        const department = await Departments.findByPk(lecturerData.department_id);
        if (!department || !department.is_active) {
          throw new Error('Department not found or inactive');
        }
      }

      // Update user common info
      const userUpdateFields = {};
      const allowedUserFields = [
        'first_name', 'last_name', 'email', 'date_of_birth',
        'gender', 'phone', 'address', 'avatar_url', 'is_active'
      ];

      allowedUserFields.forEach(field => {
        if (userData[field] !== undefined) {
          userUpdateFields[field] = userData[field];
        }
      });

      // Auto-update full_name
      if (userData.first_name || userData.last_name) {
        const first_name = userData.first_name || user.first_name;
        const last_name = userData.last_name || user.last_name;
        userUpdateFields.full_name = `${last_name} ${first_name}`;
      }

      // Update password if provided
      if (userData.password) {
        userUpdateFields.password_hash = await bcrypt.hash(userData.password, 10);
        userUpdateFields.password_changed_at = new Date();
      }

      if (Object.keys(userUpdateFields).length > 0) {
        await user.update(userUpdateFields, { transaction });
      }

      // Update lecturer specific info
      const lecturerUpdateFields = {};
      const allowedLecturerFields = [
        'lecturer_code', 'department_id', 'academic_rank',
        'degree', 'office_room', 'office_hours', 'bio', 'is_active'
      ];

      allowedLecturerFields.forEach(field => {
        if (lecturerData[field] !== undefined) {
          lecturerUpdateFields[field] = lecturerData[field];
        }
      });

      if (Object.keys(lecturerUpdateFields).length > 0) {
        await user.Lecturer.update(lecturerUpdateFields, { transaction });
      }

      await transaction.commit();
      return await this.getLecturerById(userId);
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Repository Error - updateLecturer: ${error.message}`);
    }
  }

  // Delete lecturer (soft delete)
  async deleteLecturer(userId) {
    const transaction = await sequelize.transaction();
    try {
      const user = await Users.findOne({
        where: {
          user_id: userId,
          is_deleted: false
        },
        include: [{
          model: Lecturers,
          as: 'Lecturer',
          required: true
        }],
        transaction
      });

      if (!user) {
        throw new Error('Lecturer not found');
      }

      // Check if lecturer is teaching any active classes
      const activeClasses = await Classes.count({
        where: {
          lecturer_id: userId,
          class_status: { [Op.in]: ['open', 'in_progress'] }
        },
        transaction
      });

      if (activeClasses > 0) {
        throw new Error('Cannot delete lecturer who is teaching active classes');
      }

      // Check if lecturer is department head
      const isDeptHead = await Departments.count({
        where: { head_lecturer_id: userId },
        transaction
      });

      if (isDeptHead > 0) {
        throw new Error('Cannot delete lecturer who is a department head');
      }

      // Check if lecturer is academic advisor
      const hasAdvisees = await Students.count({
        where: { academic_advisor_id: userId },
        transaction
      });

      if (hasAdvisees > 0) {
        throw new Error('Cannot delete lecturer who is an academic advisor');
      }

      // Soft delete
      await user.update({
        is_deleted: true,
        deleted_at: new Date(),
        is_active: false
      }, { transaction });

      // Deactivate lecturer record
      await user.Lecturer.update({
        is_active: false
      }, { transaction });

      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Repository Error - deleteLecturer: ${error.message}`);
    }
  }

  async restoreLecturer(userId) {
    const transaction = await sequelize.transaction();
    try {
      const user = await Users.findOne({
        where: { 
          user_id: userId,
          is_deleted: true
        },
        include: [{
          model: Lecturers,
          as: 'Lecturer',
          required: true
        }],
        transaction
      });
      if (!user) {
        throw new Error('Lecturer not found or not deleted');
      }
      // Restore user
      await user.update({
        is_deleted: false,
        deleted_at: null,
        is_active: true
      }, { transaction });
      // Restore lecturer record
      await user.Lecturer.update({
        is_active: true
      }, { transaction });
      await transaction.commit();
      return await this.getLecturerById(userId);
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Repository Error - restoreLecturer: ${error.message}`);
    }
  }

  // Get lecturers by department
  async getLecturersByDepartment(departmentId, options = {}) {
    try {
      return await this.getAllLecturers({
        ...options,
        department_id: departmentId
      });
    } catch (error) {
      throw new Error(`Repository Error - getLecturersByDepartment: ${error.message}`);
    }
  }

  // Get lecturer's classes
  async getLecturerClasses(lecturerId, options = {}) {
    try {
      const { semester_id, class_status } = options;

      const whereConditions = {
        lecturer_id: lecturerId
      };

      if (semester_id) {
        whereConditions.semester_id = semester_id;
      }

      if (class_status) {
        whereConditions.class_status = class_status;
      }

      const classes = await Classes.findAll({
        where: whereConditions,
        include: [
          {
            model: Courses,
            as: 'course',
            attributes: ['course_id', 'course_code', 'course_name', 'credits']
          },
          {
            model: Semesters,
            as: 'semester',
            attributes: ['semester_id', 'semester_name', 'start_date', 'end_date']
          }
        ],
        attributes: [
          'class_id',
          'class_code',
          'class_name',
          'start_date',
          'end_date',
          'class_status',
          'max_students',
          'current_students'
        ],
        order: [
          ['start_date', 'DESC']
        ]
      });

      return classes.map(c => c.toJSON());
    } catch (error) {
      throw new Error(`Repository Error - getLecturerClasses: ${error.message}`);
    }
  }

  // Get class by ID
  async getClassById(classId) {
    try {
      const classInfo = await Classes.findOne({
        where: { class_id: classId },
        include: [
          {
            model: Courses,
            as: 'course',
            attributes: ['course_id', 'course_code', 'course_name']
          },
          {
            model: Semesters,
            as: 'semester',
            attributes: ['semester_id', 'semester_name']
          }
        ],
        attributes: [
          'class_id',
          'class_code',
          'class_name',
          'lecturer_id',
          'course_id',
          'semester_id'
        ]
      });

      return classInfo ? classInfo.toJSON() : null;
    } catch (error) {
      throw new Error(`Repository Error - getClassById: ${error.message}`);
    }
  }

  // Get students in class with grades
  async getStudentsInClass(classId) {
    try {
      const enrollments = await Enrollment.findAll({
        where: { class_id: classId },
        include: [
          {
            model: Students,
            as: 'student',
            required: true,
            attributes: ['student_code', 'major_id'],
            include: [
              {
                model: Users,
                as: 'user',
                required: true,
                attributes: ['user_id', 'first_name', 'last_name', 'full_name', 'date_of_birth', 'email']
              },
              {
                model: Majors,
                as: 'major',
                attributes: ['major_name']
              }
            ]
          }
        ],
        attributes: [
          'enrollment_id',
          'attendance_rate',
          'total_sessions',
          'attended_sessions',
          'mini_test_grade',
          'assignment_grade',
          'lab_work_grade',
          'midterm_grade',
          'final_grade',
          'total_grade',
          'letter_grade',
          'gpa_value',
          'notes'
        ],
        order: [
          [{ model: Students, as: 'student' }, 'student_code', 'ASC']
        ]
      });

      if (enrollments.length === 0) {
        return {
          success: false,
          message: 'No students found in this class',
          data: []
        };
      }

      const results = enrollments.map(e => {
        const enrollment = e.toJSON();
        return {
          enrollment_id: enrollment.enrollment_id,
          student_id: enrollment.student?.user?.user_id || null,
          student_code: enrollment.student?.student_code || '',
          first_name: enrollment.student?.user?.first_name || '',
          last_name: enrollment.student?.user?.last_name || '',
          full_name: enrollment.student?.user?.full_name || '',
          date_of_birth: enrollment.student?.user?.date_of_birth || '',
          email: enrollment.student?.user?.email || '',
          major_name: enrollment.student?.major?.major_name || '',
          attendance_rate: enrollment.attendance_rate || 0,
          total_sessions: enrollment.total_sessions || 0,
          attended_sessions: enrollment.attended_sessions || 0,
          mini_test_grade: enrollment.mini_test_grade,
          assignment_grade: enrollment.assignment_grade,
          lab_work_grade: enrollment.lab_work_grade,
          midterm_grade: enrollment.midterm_grade,
          final_grade: enrollment.final_grade,
          total_grade: enrollment.total_grade,
          letter_grade: enrollment.letter_grade,
          gpa_value: enrollment.gpa_value,
          notes: enrollment.notes || ''
        };
      });

      return {
        success: true,
        className: `Class ${classId}`,
        data: results
      };
    } catch (error) {
      console.error('Repository Error - getStudentsInClass:', error);
      return {
        success: false,
        message: error.message,
        data: []
      };
    }
  }
}

module.exports = new LecturerManagementRepository();