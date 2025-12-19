const { Op } = require('sequelize');
const { Courses, Departments, Classes, sequelize } = require('../models');

class CourseRepository {
    async getAllCourses(options = {}, lecturerId = null) {
        try {
            const { 
                page = 1, 
                limit = 10, 
                search = null,
                department_id = null,
                course_type = null,
                level = null,
                is_active = null 
            } = options;
            
            const offset = (page - 1) * limit;
            const whereConditions = {};

            if (search) {
                whereConditions[Op.or] = [
                    { course_code: { [Op.like]: `%${search}%` } },
                    { course_name: { [Op.like]: `%${search}%` } }
                ];
            }

            if (department_id) {
                whereConditions.department_id = department_id;
            }

            if (course_type) {
                whereConditions.course_type = course_type;
            }

            if (level) {
                whereConditions.level = level;
            }

            if (is_active !== null) {
                whereConditions.is_active = is_active;
            }

            // If lecturerId is provided, filter courses they teach
            if (lecturerId) {
                const lecturerCourseIds = await Classes.findAll({
                    where: { lecturer_id: lecturerId },
                    attributes: [[sequelize.fn('DISTINCT', sequelize.col('course_id')), 'course_id']],
                    raw: true
                });

                const courseIds = lecturerCourseIds.map(c => c.course_id);
                
                if (courseIds.length === 0) {
                    // Lecturer teaches no courses
                    return {
                        total: 0,
                        total_pages: 0,
                        current_page: page,
                        data: []
                    };
                }

                whereConditions.course_id = { [Op.in]: courseIds };
            }

            const { count, rows } = await Courses.findAndCountAll({
                where: whereConditions,
                include: [{
                    model: Departments,
                    as: 'department',
                    attributes: [
                        'department_id',
                        'department_code',
                        'department_name'
                    ]
                }],
                limit,
                offset,
                order: [['course_code', 'ASC']],
                distinct: true
            });

            return {
                total: count,
                total_pages: Math.ceil(count / limit),
                current_page: page,
                data: rows
            };
        } catch (error) {
            throw new Error(`Repository Error - getAllCourses: ${error.message}`);
        }
    }

    async getCourseById(courseId) {
        try {
            const course = await Courses.findOne({
                where: { course_id: courseId },
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
            });

            return course ? course.toJSON() : null;
        } catch (error) {
            throw new Error(`Repository Error - getCourseById: ${error.message}`);
        }
    }

    async createCourse(courseData, creatorDepartmentId = null) {
        const transaction = await sequelize.transaction();
        try {
            const codeExists = await Courses.count({
                where: { course_code: courseData.course_code }
            });
            if (codeExists > 0) {
                throw new Error('Course code already exists');
            }

            const department = await Departments.findByPk(courseData.department_id);
            if (!department) {
                throw new Error('Department not found');
            }
            if (!department.is_active) {
                throw new Error('Department is inactive');
            }

            if (creatorDepartmentId && courseData.department_id !== creatorDepartmentId) {
                throw new Error('You can only create courses for your department');
            }

            const course = await Courses.create({
                course_code: courseData.course_code,
                course_name: courseData.course_name,
                department_id: courseData.department_id,
                credits: courseData.credits,
                theory_hours: courseData.theory_hours || 0,
                practice_hours: courseData.practice_hours || 0,
                course_type: courseData.course_type,
                level: courseData.level || null,
                description: courseData.description || null,
                learning_outcomes: courseData.learning_outcomes || null,
                is_active: courseData.is_active !== undefined ? courseData.is_active : true
            }, { transaction });

            await transaction.commit();
            return await this.getCourseById(course.course_id);
        } catch (error) {
            await transaction.rollback();
            throw new Error(`Repository Error - createCourse: ${error.message}`);
        }
    }

    async updateCourse(courseId, courseData, updaterDepartmentId = null) {
        const transaction = await sequelize.transaction();
        try {
            const course = await Courses.findByPk(courseId, { transaction });

            if (!course) {
                throw new Error('Course not found');
            }

            if (updaterDepartmentId && course.department_id !== updaterDepartmentId) {
                throw new Error('You can only update courses from your department');
            }

            if (courseData.course_code && 
                courseData.course_code !== course.course_code) {
                const codeExists = await Courses.count({
                    where: { 
                        course_code: courseData.course_code,
                        course_id: { [Op.ne]: courseId }
                    }
                });
                if (codeExists > 0) {
                    throw new Error('Course code already exists');
                }
            }

            if (courseData.department_id && 
                courseData.department_id !== course.department_id) {
                
                if (updaterDepartmentId) {
                    throw new Error('Cannot change course department');
                }

                const department = await Departments.findByPk(courseData.department_id);
                if (!department || !department.is_active) {
                    throw new Error('Department not found or inactive');
                }
            }

            const updateFields = {};
            const allowedFields = [
                'course_code', 'course_name', 'department_id', 'credits',
                'theory_hours', 'practice_hours', 'course_type', 'level',
                'description', 'learning_outcomes', 'is_active'
            ];

            allowedFields.forEach(field => {
                if (courseData[field] !== undefined) {
                    updateFields[field] = courseData[field];
                }
            });

            if (Object.keys(updateFields).length > 0) {
                await course.update(updateFields, { transaction });
            }

            await transaction.commit();
            return await this.getCourseById(courseId);
        } catch (error) {
            await transaction.rollback();
            throw new Error(`Repository Error - updateCourse: ${error.message}`);
        }
    }

    async deleteCourse(courseId, deleterDepartmentId = null) {
        const transaction = await sequelize.transaction();
        try {
            const course = await Courses.findByPk(courseId, { transaction });

            if (!course) {
                throw new Error('Course not found');
            }

            if (deleterDepartmentId && course.department_id !== deleterDepartmentId) {
                throw new Error('You can only delete courses from your department');
            }

            const classCount = await Classes.count({
                where: { course_id: courseId },
                transaction
            });
            
            if (classCount > 0) {
                throw new Error('Cannot delete course with existing classes');
            }

            await course.destroy({ transaction });
            await transaction.commit();
            return true;
        } catch (error) {
            await transaction.rollback();
            throw new Error(`Repository Error - deleteCourse: ${error.message}`);
        }
    }

    async getCoursesSimple(options = {}, lecturerId = null) {
        try {
            const { department_id = null, is_active = true } = options;
            const where = {};

            if (department_id) {
                where.department_id = department_id;
            }

            if (is_active !== null) {
                where.is_active = is_active;
            }

            // If lecturerId is provided, filter courses they teach
            if (lecturerId) {
                const lecturerCourseIds = await Classes.findAll({
                    where: { lecturer_id: lecturerId },
                    attributes: [[sequelize.fn('DISTINCT', sequelize.col('course_id')), 'course_id']],
                    raw: true
                });

                const courseIds = lecturerCourseIds.map(c => c.course_id);
                
                if (courseIds.length === 0) {
                    return [];
                }

                where.course_id = { [Op.in]: courseIds };
            }

            return await Courses.findAll({
                where,
                attributes: [
                    'course_id',
                    'course_code',
                    'course_name',
                    'credits',
                    'course_type',
                    'is_active'
                ],
                order: [['course_code', 'ASC']]
            });
        } catch (error) {
            throw new Error(`Repository Error - getCoursesSimple: ${error.message}`);
        }
    }
}

module.exports = new CourseRepository();