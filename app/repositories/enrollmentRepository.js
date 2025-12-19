const { Op } = require('sequelize');
const { Enrollment, Classes, Courses, Semesters, Lecturers, Users, Students, Departments} = require('../models');
class EnrollmentRepository {
    //Get enrollments of a student by the semeter
    async getEnrollmentsByStudent(studentId, semesterId = null) {
        try {
            const whereCondition = {
                student_id: studentId
            }
            const includeOptions = [
                {
                    model: Classes,
                    as: 'class',
                    attributes: [
                        'class_id',
                        'class_code',
                        'class_name',
                        'max_capacity',
                        'current_enrollment'
                    ],
                    where: semesterId ? { semester_id: semesterId} : undefined,
                    include: [
                        {
                            model: Courses,
                            as: 'course',
                            attributes: [
                                'course_id',
                                'course_code',
                                'course_name',
                                'credits',
                                'course_type',
                                'theory_hours',
                                'practice_hours'
                            ],
                            include: [
                                {
                                    model: Departments,
                                    as: 'department',
                                    attributes: [
                                        'department_id',
                                        'department_code',
                                        'department_name'
                                    ]
                                }
                            ]
                        },
                        {
                            model: Semesters,
                            as: 'semester',
                            attributes: [
                                'semester_id',
                                'semester_code',
                                'semester_name',
                                'academic_year',
                                'enrollment_date'
                            ]
                        },
                        {
                            model: Lecturers,
                            as: 'lecturer',
                            attributes: [
                                'user_id',
                                'lecturer_code',
                                'academic_rank',
                                'degree'
                            ],
                            include: [
                                {
                                    model: Users,
                                    as: 'user',
                                    attributes: [
                                        'user_id',
                                        'first_name',
                                        'last_name',
                                        'email'
                                    ],
                                    where: {
                                        is_deleted: false
                                    }
                                }
                            ]
                        }
                    ]
                }
            ];
            const enrollments = await Enrollment.findAll({
                where: whereCondition,
                include: includeOptions,
                attributes: [
                    'enrollment_id',
                    'student_id',
                    'class_id',
                    'enrollment_status',
                    'enrollment_type',
                    'enrollment_date',
                    'drop_date',
                    'completion_date',
                    'midterm_grade',
                    'final_grade',
                    'total_grade',
                    'letter_grade',
                    'gpa_value',
                    'is_passed',
                    'total_sessions',
                    'attended_sessions',
                    'attendance_rate',
                    'notes',
                    'created_at',
                    'updated_at'
                ],
                order: [
                    [{ model: Classes, as: 'class'}, {model: Semesters, as: 'semester'}, 'enrollment_date', 'DESC'],
                    [{ model: Classes, as: 'class'}, {model: Courses, as: 'course'}, 'course_id', 'ASC']
                ]
            });
            return enrollments;
        } catch (error) {
            throw new Error(`Repository Error - getEnrollmentsByStudent: ${error.message}`);
        }
    }
    
    async findOne(whereCondition) {
        try {
            return await Enrollment.findOne({ where: whereCondition });
        } catch (error) {
            throw new Error(`Repository Error - findOne: ${error.message}`);
        }
    }

    async update(id, updateData) {
        try {
            const enrollment = await Enrollment.findByPk(id);
            if (!enrollment) return null;
            return await enrollment.update(updateData);
        } catch (error) {
            throw new Error(`Repository Error - update: ${error.message}`);
        }
    }
}
module.exports = new EnrollmentRepository();