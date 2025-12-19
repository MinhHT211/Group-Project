'use strict';
const LecturerManagementRepository = require('../repositories/lecturerManagementRepository');
const db = require('../models');

class LecturerManagementService {
  constructor() {
    this.repository = LecturerManagementRepository;
  }

  // Get all lecturers with pagination and filters
  async getAllLecturers(options = {}) {
    try {
      const result = await this.repository.getAllLecturers(options);

      if (!result.data || result.data.length === 0) {
        return {
          ...result,
          data: []
        };
      }

      result.data = result.data.map(user => this.formatLecturerData(user));
      return result;
    } catch (error) {
      throw new Error(`Service Error - getAllLecturers: ${error.message}`);
    }
  }

  // Get lecturers by department
  async getLecturersByDepartment(departmentId, options = {}) {
    try {
      const result = await this.repository.getLecturersByDepartment(departmentId, options);

      if (!result.data || result.data.length === 0) {
        return {
          ...result,
          data: []
        };
      }

      result.data = result.data.map(user => this.formatLecturerData(user));
      return result;
    } catch (error) {
      throw new Error(`Service Error - getLecturersByDepartment: ${error.message}`);
    }
  }

  // Get lecturer by ID
  async getLecturerById(userId) {
    try {
      const lecturer = await this.repository.getLecturerById(userId);

      if (!lecturer) {
        throw new Error('Lecturer not found');
      }

      return {
        success: true,
        data: this.formatLecturerData(lecturer)
      };
    } catch (error) {
      throw new Error(`Service Error - getLecturerById: ${error.message}`);
    }
  }

  // Create new lecturer
  async createLecturer(userData, lecturerData) {
    try {
      this.validateUserData(userData);
      this.validateLecturerData(lecturerData);

      const newLecturer = await this.repository.createLecturer(userData, lecturerData);

      return {
        success: true,
        message: 'Lecturer created successfully',
        data: this.formatLecturerData(newLecturer)
      };
    } catch (error) {
      throw new Error(`Service Error - createLecturer: ${error.message}`);
    }
  }

  // Update lecturer
  async updateLecturer(userId, userData = {}, lecturerData = {}) {
    try {
      if (userData.password && userData.password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      const updatedLecturer = await this.repository.updateLecturer(
        userId,
        userData,
        lecturerData
      );

      return {
        success: true,
        message: 'Lecturer updated successfully',
        data: this.formatLecturerData(updatedLecturer)
      };
    } catch (error) {
      throw new Error(`Service Error - updateLecturer: ${error.message}`);
    }
  }

  // Delete lecturer (soft delete)
  async deleteLecturer(userId) {
    try {
      await this.repository.deleteLecturer(userId);

      return {
        success: true,
        message: 'Lecturer deleted successfully'
      };
    } catch (error) {
      throw new Error(`Service Error - deleteLecturer: ${error.message}`);
    }
  }

  // Restore lecturer
  async restoreLecturer(userId) {
    try {
        const restored = await this.repository.restoreLecturer(userId);
        
        return {
            success: true,
            message: 'Lecturer restored successfully',
            data: this.formatLecturerData(restored)
        };
    } catch (error) {
        throw new Error(`Service Error - restoreLecturer: ${error.message}`);
    }
}

  // Get lecturer's classes
  async getLecturerClasses(lecturerId, options = {}) {
    try {
      const classes = await this.repository.getLecturerClasses(lecturerId, options);

      return {
        success: true,
        data: classes
      };
    } catch (error) {
      console.error('Service Error - getLecturerClasses:', error);
      throw new Error(`Service Error - getLecturerClasses: ${error.message}`);
    }
  }

  // Get class by ID
  async getClassById(classId) {
    try {
      const classInfo = await this.repository.getClassById(classId);

      if (!classInfo) {
        return {
          success: false,
          message: 'Class not found'
        };
      }

      return {
        success: true,
        data: classInfo
      };
    } catch (error) {
      console.error('Service Error - getClassById:', error);
      throw new Error(`Service Error - getClassById: ${error.message}`);
    }
  }

  // Get students by class with grades
  async getStudentsByClassWithGrades(classId, weights = {}) {
    try {
      if (!classId) {
        throw new Error('Class ID is required');
      }

      const result = await this.repository.getStudentsInClass(classId);

      if (!result.success) {
        return result;
      }

      // Calculate attendance score for each student
      const students = result.data.map(student => {
        const attendance = student.attendance_rate || 0;
        const attendanceScore = (attendance * (weights.attendance || 0)).toFixed(2);

        return {
          enrollment_id: student.enrollment_id || null,
          student_code: student.student_code || '',
          full_name: student.full_name || '',
          date_of_birth: student.date_of_birth || '',
          major: student.major_name || '',
          attendance: attendance,
          attendance_score: parseFloat(attendanceScore),
          mini: weights.mini !== 0 ? (student.midterm || '') : undefined,
          assignment: weights.assignment !== 0 ? (student.assignment || '') : undefined,
          labwork: weights.lab !== 0 ? (student.lab || '') : undefined,
          midterm: weights.midterm !== 0 ? (student.midterm || '') : undefined,
          final: weights.final !== 0 ? (student.final || '') : undefined,
          total: student.total || '',
          letter: student.letter || '',
          gpa: student.gpa || '',
          notes: student.notes || ''
        };
      });

      // Remove undefined keys
      const cleanedStudents = students.map(student => {
        const cleaned = {};
        Object.keys(student).forEach(key => {
          if (student[key] !== undefined) {
            cleaned[key] = student[key];
          }
        });
        return cleaned;
      });

      return {
        success: true,
        class: {
          class_id: result.data[0]?.class_id || classId,
          class_name: result.className || 'Unknown Class',
          course_code: result.data[0]?.course_code || '',
          semester_name: result.data[0]?.semester_name || ''
        },
        students: cleanedStudents
      };
    } catch (error) {
      console.error('Service Error - getStudentsByClassWithGrades:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Get grade weights by class
  async getGradeWeightsByClass(classId) {
    try {
      const components = await db.GradeComponents.findAll({
        where: {
          class_id: classId,
          is_active: 1
        },
        attributes: ['component_type', 'weight']
      });

      const weights = {
        attendance: 0,
        mini: 0,
        assignment: 0,
        lab: 0,
        midterm: 0,
        final: 0
      };

      components.forEach(component => {
        const weight = Number(component.weight);

        switch (component.component_type) {
          case 'attendance':
            weights.attendance = weight;
            break;
          case 'mini_test':
            weights.mini = weight;
            break;
          case 'assignment':
            weights.assignment = weight;
            break;
          case 'lab_work':
            weights.lab = weight;
            break;
          case 'exam_midterm':
            weights.midterm = weight;
            break;
          case 'exam_final':
            weights.final = weight;
            break;
        }
      });

      return weights;
    } catch (error) {
      console.error('Service Error - getGradeWeightsByClass:', error);
      throw new Error(`Service Error - getGradeWeightsByClass: ${error.message}`);
    }
  }

  // Validation helpers
  validateUserData(userData) {
    if (!userData.username) throw new Error('Username is required');
    if (!userData.password) throw new Error('Password is required');
    if (!userData.first_name) throw new Error('First name is required');
    if (!userData.last_name) throw new Error('Last name is required');
    if (!userData.email) throw new Error('Email is required');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      throw new Error('Invalid email format');
    }

    if (userData.password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
  }

  validateLecturerData(lecturerData) {
    if (!lecturerData.lecturer_code) {
      throw new Error('Lecturer code is required');
    }
    if (!lecturerData.department_id) {
      throw new Error('Department ID is required');
    }
  }

  // Format lecturer data
  formatLecturerData(userData) {
    return {
      user_id: userData.user_id,
      username: userData.username,
      name: userData.full_name || `${userData.last_name} ${userData.first_name}`,
      first_name: userData.first_name,
      last_name: userData.last_name,
      full_name: userData.full_name,
      email: userData.email,
      date_of_birth: userData.date_of_birth,
      gender: userData.gender,
      phone: userData.phone,
      address: userData.address,
      avatar_url: userData.avatar_url,
      lecturer: {
        lecturer_code: userData.Lecturer?.lecturer_code || null,
        academic_rank: userData.Lecturer?.academic_rank || null,
        degree: userData.Lecturer?.degree || null,
        office_room: userData.Lecturer?.office_room || null,
        office_hours: userData.Lecturer?.office_hours || null,
        bio: userData.Lecturer?.bio || null,
        department_id: userData.Lecturer?.department_id || null,
        department_code: userData.Lecturer?.department?.department_code || null,
        department_name: userData.Lecturer?.department?.department_name || null,
        is_active: userData.Lecturer?.is_active || false
      },
      role: userData.user_role?.role?.role_name || 'lecturer',
      is_active: userData.is_active,
      is_deleted: userData.is_deleted,
      created_at: userData.created_at,
      updated_at: userData.updated_at
    };
  }
}

module.exports = new LecturerManagementService();