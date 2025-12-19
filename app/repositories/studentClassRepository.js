const db = require('../models');
const {
  Enrollment,
  Students,
  Classes,
  Users,
  Attendance,
  Grades,
  GradeComponents,
  Majors,
  Schedules
} = db;
const { Op } = require('sequelize');

class StudentClassRepository {
  
  // Find all students enrolled in a specific class
  async findStudentsByClass(classId, options = {}) {
    try {
      const { includeDeleted = false } = options;

      const enrollments = await Enrollment.findAll({
        where: {
          class_id: classId,
          enrollment_status: { [Op.in]: ['enrolled', 'completed'] }
        },
        include: [
          {
            model: Students,
            as: 'student',
            attributes: ['user_id', 'student_code', 'major_id', 'admission_year', 'gpa'],
            include: [
              {
                model: Users,
                as: 'user',
                attributes: ['user_id', 'username', 'first_name', 'last_name', 'email', 'phone', 'gender'],
                where: includeDeleted ? {} : { is_deleted: false }
              },
              {
                model: Majors,
                as: 'major',
                attributes: ['major_id', 'major_code', 'major_name'],
                required: false
              }
            ]
          },
          {
            model: Classes,
            as: 'class',
            attributes: ['class_id', 'class_code', 'class_name', 'course_id']
          }
        ],
        attributes: [
          'enrollment_id',
          'student_id',
          'class_id',
          'enrollment_status',
          'enrollment_type',
          'enrollment_date',
          'total_grade',
          'letter_grade',
          'is_passed'
        ],
        subQuery: false
      });

      return enrollments;
    } catch (error) {
      throw new Error(`Repository Error - findStudentsByClass: ${error.message}`);
    }
  }

  // Find schedules by IDs
  async findSchedulesByIds(scheduleIds) {
    try {
      const schedules = await Schedules.findAll({
        where: { schedule_id: { [Op.in]: scheduleIds } },
        attributes: ['schedule_id', 'class_id']
      });
      return schedules;
    } catch (error) {
      throw new Error(`Repository Error - findSchedulesByIds: ${error.message}`);
    }
  }

  // Find students with pagination and sorting
  async findStudentsByClassPaginated(classId, options = {}) {
    try {
      const {
        limit = 10,
        offset = 0,
        sortBy = 'last_name',
        sortOrder = 'ASC',
        search = null
      } = options;

      let whereClause = {
        class_id: classId,
        enrollment_status: { [Op.in]: ['enrolled', 'completed'] }
      };

      let userWhereClause = { is_deleted: false };
      if (search) {
        userWhereClause[Op.or] = [
          { first_name: { [Op.like]: `%${search}%` } },
          { last_name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } }
        ];
      }

      const { count, rows } = await Enrollment.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Students,
            as: 'student',
            attributes: ['user_id', 'student_code', 'major_id', 'admission_year', 'gpa'],
            include: [
              {
                model: Users,
                as: 'user',
                attributes: ['user_id', 'username', 'first_name', 'last_name', 'email', 'phone', 'gender', 'date_of_birth'],
                where: userWhereClause
              },
              {
                model: Majors,
                as: 'major',
                attributes: ['major_id', 'major_code', 'major_name'],
                required: false
              }
            ]
          }
        ],
        attributes: [
          'enrollment_id',
          'student_id',
          'enrollment_status',
          'enrollment_date',
          'total_grade',
          'letter_grade'
        ],
        limit,
        offset,
        order: [[{ model: Students, as: 'student' }, { model: Users, as: 'user' }, sortBy, sortOrder.toUpperCase()]],
        subQuery: false,
        distinct: true
      });

      return {
        total: count,
        page: Math.floor(offset / limit) + 1,
        pageSize: limit,
        totalPages: Math.ceil(count / limit),
        data: rows
      };
    } catch (error) {
      throw new Error(`Repository Error - findStudentsByClassPaginated: ${error.message}`);
    }
  }

  // Find students with attendance data
  async findStudentsByClassWithAttendance(classId) {
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
          },
          {
            model: Classes,
            as: 'class',
            attributes: ['class_id', 'class_code', 'class_name']
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
          'check_in_time'
        ],
        order: [['attendance_date', 'DESC']]
      });

      const result = enrollments.map(enrollment => {
        const enrollmentData = enrollment.toJSON();
        const studentAttendance = attendanceRecords.filter(
          att => att.student_id === enrollment.student_id
        );

        return {
          ...enrollmentData,
          attendance: studentAttendance
        };
      });

      return result;
    } catch (error) {
      throw new Error(`Repository Error - findStudentsByClassWithAttendance: ${error.message}`);
    }
  }

  // Find students with grades data
  async findStudentsByClassWithGrades(classId) {
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
                attributes: ['user_id', 'first_name', 'last_name', 'email'],
                where: { is_deleted: false }
              }
            ]
          },
          {
            model: Classes,
            as: 'class',
            attributes: ['class_id', 'class_code', 'class_name']
          }
        ],
        attributes: [
          'enrollment_id',
          'student_id',
          'class_id',
          'midterm_grade',
          'final_grade',
          'total_grade',
          'letter_grade',
          'gpa_value',
          'is_passed'
        ]
      });

      const enrollmentIds = enrollments.map(e => e.enrollment_id);

      const grades = await Grades.findAll({
        where: { enrollment_id: { [Op.in]: enrollmentIds } },
        include: [
          {
            model: GradeComponents,
            as: 'grade_component',
            attributes: ['component_id', 'component_name', 'component_type', 'weight', 'max_score']
          }
        ],
        attributes: ['grade_id', 'enrollment_id', 'component_id', 'score', 'graded_at', 'feedback'],
        order: [['graded_at', 'DESC']]
      });

      const result = enrollments.map(enrollment => {
        const enrollmentData = enrollment.toJSON();
        const enrollmentGrades = grades.filter(
          grade => grade.enrollment_id === enrollment.enrollment_id
        );

        return {
          ...enrollmentData,
          grades: enrollmentGrades
        };
      });

      return result;
    } catch (error) {
      throw new Error(`Repository Error - findStudentsByClassWithGrades: ${error.message}`);
    }
  }

  // Find students with complete enrollment summary
  async findStudentsByClassWithSummary(classId) {
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
            attributes: ['user_id', 'student_code', 'major_id', 'gpa'],
            include: [
              {
                model: Users,
                as: 'user',
                attributes: ['user_id', 'first_name', 'last_name', 'email'],
                where: { is_deleted: false }
              }
            ]
          },
          {
            model: Classes,
            as: 'class',
            attributes: ['class_id', 'class_code', 'class_name']
          }
        ],
        attributes: [
          'enrollment_id',
          'student_id',
          'enrollment_status',
          'enrollment_date',
          'total_sessions',
          'attended_sessions',
          'attendance_rate',
          'midterm_grade',
          'final_grade',
          'total_grade',
          'letter_grade',
          'is_passed'
        ],
        order: [['created_at', 'ASC']],
        subQuery: false
      });

      return enrollments;
    } catch (error) {
      throw new Error(`Repository Error - findStudentsByClassWithSummary: ${error.message}`);
    }
  }

  // Find class details by class id and include schedules
  async findClassByIdWithSchedules(classId, options = {}) {
    try {
      const { includeInactive = false } = options;

      const whereSchedules = includeInactive ? {} : { is_active: true };

      const cls = await Classes.findOne({
        where: { class_id: classId },
        include: [
          {
            model: Schedules,
            as: 'schedules',
            where: whereSchedules,
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
              'effective_to'
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
        ],
        subQuery: false
      });

      return cls;
    } catch (error) {
      throw new Error(`Repository Error - findClassByIdWithSchedules: ${error.message}`);
    }
  }

  // Find all students in class
  async findAllStudentsInClass(classId) {
    try {
      if (!classId) {
        throw new Error('Class ID is required');
      }

      const enrollments = await Enrollment.findAll({
        where: {
          class_id: classId,
          enrollment_status: { [Op.in]: ['enrolled', 'completed'] }
        },
        include: [
          {
            model: Students,
            as: 'student',
            attributes: ['user_id', 'student_code', 'major_id', 'admission_year'],
            include: [
              {
                model: Users,
                as: 'user',
                attributes: ['user_id', 'first_name', 'last_name', 'email'],
                where: { is_deleted: false }
              }
            ]
          }
        ],
        attributes: ['enrollment_id', 'student_id', 'class_id', 'enrollment_status'],
        order: [[{ model: Students, as: 'student' }, { model: Users, as: 'user' }, 'last_name', 'ASC']],
        subQuery: false
      });

      return enrollments;
    } catch (error) {
      throw new Error(`Repository Error - findAllStudentsInClass: ${error.message}`);
    }
  }
}

module.exports = new StudentClassRepository();