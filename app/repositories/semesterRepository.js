const { Op } = require('sequelize');
const { Semesters, Classes, sequelize } = require('../models');

class SemesterRepository {
    async getAllSemesters(options = {}, lecturerId = null) {
        try {
            const { 
                page = 1, 
                limit = 10, 
                search = null, 
                is_active = null,
                academic_year = null 
            } = options;
            
            const offset = (page - 1) * limit;
            const whereConditions = {};

            if (search) {
                whereConditions[Op.or] = [
                    { semester_code: { [Op.like]: `%${search}%` } },
                    { semester_name: { [Op.like]: `%${search}%` } },
                    { academic_year: { [Op.like]: `%${search}%` } }
                ];
            }

            if (is_active !== null) {
                whereConditions.is_active = is_active;
            }

            if (academic_year) {
                whereConditions.academic_year = academic_year;
            }

            // If lecturerId or course_id provided, filter semesters by classes matching those conditions
            const course_id = options.course_id || null;

            if (lecturerId || course_id) {
                const classWhere = {};
                if (lecturerId) classWhere.lecturer_id = lecturerId;
                if (course_id) classWhere.course_id = course_id;

                const classSemesterRows = await Classes.findAll({
                    where: classWhere,
                    attributes: [[sequelize.fn('DISTINCT', sequelize.col('semester_id')), 'semester_id']],
                    raw: true
                });

                const semesterIds = classSemesterRows.map(c => c.semester_id).filter(Boolean);

                if (semesterIds.length === 0) {
                    // No matching semesters
                    return {
                        total: 0,
                        total_pages: 0,
                        current_page: page,
                        data: []
                    };
                }

                whereConditions.semester_id = { [Op.in]: semesterIds };
            }

            const { count, rows } = await Semesters.findAndCountAll({
                where: whereConditions,
                limit,
                offset,
                order: [
                    ['academic_year', 'DESC'],
                    ['semester_code', 'DESC']
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
            throw new Error(`Repository Error - getAllSemesters: ${error.message}`);
        }
    }

    async getSemesterById(semesterId) {
        try {
            const semester = await Semesters.findOne({
                where: { semester_id: semesterId }
            });

            return semester ? semester.toJSON() : null;
        } catch (error) {
            throw new Error(`Repository Error - getSemesterById: ${error.message}`);
        }
    }

    async createSemester(semesterData) {
        const transaction = await sequelize.transaction();
        try {
            // Validate semester_code uniqueness
            const codeExists = await Semesters.count({
                where: { semester_code: semesterData.semester_code }
            });
            if (codeExists > 0) {
                throw new Error('Semester code already exists');
            }

            // If setting as active, deactivate other semesters
            if (semesterData.is_active) {
                await Semesters.update(
                    { is_active: false },
                    { where: { is_active: true }, transaction }
                );
            }

            const semester = await Semesters.create({
                semester_code: semesterData.semester_code,
                semester_name: semesterData.semester_name,
                academic_year: semesterData.academic_year,
                enrollment_date: semesterData.enrollment_date,
                is_active: semesterData.is_active !== undefined ? semesterData.is_active : false
            }, { transaction });

            await transaction.commit();
            return await this.getSemesterById(semester.semester_id);
        } catch (error) {
            await transaction.rollback();
            throw new Error(`Repository Error - createSemester: ${error.message}`);
        }
    }

    async updateSemester(semesterId, semesterData) {
        const transaction = await sequelize.transaction();
        try {
            const semester = await Semesters.findByPk(semesterId, { transaction });

            if (!semester) {
                throw new Error('Semester not found');
            }

            // Validate semester_code if changed
            if (semesterData.semester_code && 
                semesterData.semester_code !== semester.semester_code) {
                const codeExists = await Semesters.count({
                    where: { 
                        semester_code: semesterData.semester_code,
                        semester_id: { [Op.ne]: semesterId }
                    }
                });
                if (codeExists > 0) {
                    throw new Error('Semester code already exists');
                }
            }

            // If setting as active, deactivate other semesters
            if (semesterData.is_active === true && !semester.is_active) {
                await Semesters.update(
                    { is_active: false },
                    { where: { is_active: true, semester_id: { [Op.ne]: semesterId } }, transaction }
                );
            }

            const updateFields = {};
            const allowedFields = [
                'semester_code', 'semester_name', 'academic_year',
                'enrollment_date', 'is_active'
            ];

            allowedFields.forEach(field => {
                if (semesterData[field] !== undefined) {
                    updateFields[field] = semesterData[field];
                }
            });

            if (Object.keys(updateFields).length > 0) {
                await semester.update(updateFields, { transaction });
            }

            await transaction.commit();
            return await this.getSemesterById(semesterId);
        } catch (error) {
            await transaction.rollback();
            throw new Error(`Repository Error - updateSemester: ${error.message}`);
        }
    }

    async deleteSemester(semesterId) {
        const transaction = await sequelize.transaction();
        try {
            const semester = await Semesters.findByPk(semesterId, { transaction });

            if (!semester) {
                throw new Error('Semester not found');
            }

            // Check if semester has classes
            const { Classes } = require('../models');
            const classCount = await Classes.count({
                where: { semester_id: semesterId },
                transaction
            });
            
            if (classCount > 0) {
                throw new Error('Cannot delete semester with existing classes');
            }

            // Delete semester (hard delete as it has no dependent data)
            await semester.destroy({ transaction });

            await transaction.commit();
            return true;
        } catch (error) {
            await transaction.rollback();
            throw new Error(`Repository Error - deleteSemester: ${error.message}`);
        }
    }

    async getActiveSemester() {
        try {
            const semester = await Semesters.findOne({
                where: { is_active: true }
            });

            return semester ? semester.toJSON() : null;
        } catch (error) {
            throw new Error(`Repository Error - getActiveSemester: ${error.message}`);
        }
    }

    async getSemestersSimple() {
        try {
            return await Semesters.findAll({
                attributes: ['semester_id', 'semester_code', 'semester_name', 'academic_year', 'is_active'],
                order: [['academic_year', 'DESC'], ['semester_code', 'DESC']]
            });
        } catch (error) {
            throw new Error(`Repository Error - getSemestersSimple: ${error.message}`);
        }
    }
}

module.exports = new SemesterRepository();