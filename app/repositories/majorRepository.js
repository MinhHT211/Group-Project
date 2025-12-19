const { Op } = require('sequelize');
const { Majors, Departments, Students, sequelize } = require('../models');

class MajorRepository {
    async getAllMajors(options = {}) {
        try {
            const { 
                page = 1, 
                limit = 10, 
                search = null, 
                department_id = null,
                is_active = null,
                degree_type = null
            } = options;
            
            const offset = (page - 1) * limit;
            const whereConditions = {};

            if (search) {
                whereConditions[Op.or] = [
                    { major_code: { [Op.like]: `%${search}%` } },
                    { major_name: { [Op.like]: `%${search}%` } }
                ];
            }

            if (department_id) {
                whereConditions.department_id = department_id;
            }

            if (is_active !== null) {
                whereConditions.is_active = is_active;
            }

            if (degree_type) {
                whereConditions.degree_type = degree_type;
            }

            const { count, rows } = await Majors.findAndCountAll({
                where: whereConditions,
                include: [{
                    model: Departments,
                    as: 'department',
                    attributes: ['department_id', 'department_code', 'department_name', 'is_active']
                }],
                attributes: {
                    include: [
                        [
                            sequelize.literal(`(
                                SELECT COUNT(*)
                                FROM Students
                                WHERE Students.major_id = Majors.major_id
                                AND Students.student_status = 'active'
                            )`),
                            'student_count'
                        ]
                    ]
                },
                limit,
                offset,
                order: [['major_name', 'ASC']],
                distinct: true
            });

            return {
                total: count,
                total_pages: Math.ceil(count / limit),
                current_page: page,
                data: rows
            };
        } catch (error) {
            throw new Error(`Repository Error - getAllMajors: ${error.message}`);
        }
    }

    async getMajorById(majorId) {
        try {
            const major = await Majors.findOne({
                where: { major_id: majorId },
                include: [{
                    model: Departments,
                    as: 'department',
                    attributes: [
                        'department_id', 'department_code', 'department_name',
                        'phone', 'email', 'location', 'is_active'
                    ]
                }],
                attributes: {
                    include: [
                        [
                            sequelize.literal(`(
                                SELECT COUNT(*)
                                FROM Students
                                WHERE Students.major_id = Majors.major_id
                                AND Students.student_status = 'active'
                            )`),
                            'student_count'
                        ]
                    ]
                }
            });

            return major ? major.toJSON() : null;
        } catch (error) {
            throw new Error(`Repository Error - getMajorById: ${error.message}`);
        }
    }

    async getMajorsByDepartment(departmentId, options = {}) {
        try {
            const { is_active = null } = options;
            
            const whereConditions = { department_id: departmentId };
            
            if (is_active !== null) {
                whereConditions.is_active = is_active;
            }

            const majors = await Majors.findAll({
                where: whereConditions,
                attributes: {
                    include: [
                        [
                            sequelize.literal(`(
                                SELECT COUNT(*)
                                FROM Students
                                WHERE Students.major_id = Majors.major_id
                                AND Students.student_status = 'active'
                            )`),
                            'student_count'
                        ]
                    ]
                },
                order: [['major_name', 'ASC']]
            });

            return majors;
        } catch (error) {
            throw new Error(`Repository Error - getMajorsByDepartment: ${error.message}`);
        }
    }

    async createMajor(majorData) {
        const transaction = await sequelize.transaction();
        try {
            // Validate major_code uniqueness
            const codeExists = await Majors.count({
                where: { major_code: majorData.major_code }
            });
            if (codeExists > 0) {
                throw new Error('Major code already exists');
            }

            // Validate major_name uniqueness
            const nameExists = await Majors.count({
                where: { major_name: majorData.major_name }
            });
            if (nameExists > 0) {
                throw new Error('Major name already exists');
            }

            // Validate department
            const department = await Departments.findByPk(majorData.department_id);
            if (!department) {
                throw new Error('Department not found');
            }
            if (!department.is_active) {
                throw new Error('Department is inactive');
            }

            const major = await Majors.create({
                major_code: majorData.major_code,
                major_name: majorData.major_name,
                department_id: majorData.department_id,
                degree_type: majorData.degree_type || 'Bachelor',
                required_credits: majorData.required_credits || 120,
                duration_years: majorData.duration_years || 4,
                description: majorData.description || null,
                is_active: majorData.is_active !== undefined ? majorData.is_active : true
            }, { transaction });

            await transaction.commit();
            return await this.getMajorById(major.major_id);
        } catch (error) {
            await transaction.rollback();
            throw new Error(`Repository Error - createMajor: ${error.message}`);
        }
    }

    async updateMajor(majorId, majorData) {
        const transaction = await sequelize.transaction();
        try {
            const major = await Majors.findByPk(majorId, { transaction });

            if (!major) {
                throw new Error('Major not found');
            }

            // Validate major_code if changed
            if (majorData.major_code && majorData.major_code !== major.major_code) {
                const codeExists = await Majors.count({
                    where: { 
                        major_code: majorData.major_code,
                        major_id: { [Op.ne]: majorId }
                    }
                });
                if (codeExists > 0) {
                    throw new Error('Major code already exists');
                }
            }

            // Validate major_name if changed
            if (majorData.major_name && majorData.major_name !== major.major_name) {
                const nameExists = await Majors.count({
                    where: { 
                        major_name: majorData.major_name,
                        major_id: { [Op.ne]: majorId }
                    }
                });
                if (nameExists > 0) {
                    throw new Error('Major name already exists');
                }
            }

            // Validate department if changed
            if (majorData.department_id && majorData.department_id !== major.department_id) {
                const department = await Departments.findByPk(majorData.department_id);
                if (!department || !department.is_active) {
                    throw new Error('Department not found or inactive');
                }

                // Check if there are active students in this major
                const activeStudents = await Students.count({
                    where: { 
                        major_id: majorId,
                        student_status: 'active'
                    },
                    transaction
                });
                
                if (activeStudents > 0) {
                    throw new Error('Cannot change department of major with active students');
                }
            }

            const updateFields = {};
            const allowedFields = [
                'major_code', 'major_name', 'department_id', 'degree_type',
                'required_credits', 'duration_years', 'description', 'is_active'
            ];

            allowedFields.forEach(field => {
                if (majorData[field] !== undefined) {
                    updateFields[field] = majorData[field];
                }
            });

            if (Object.keys(updateFields).length > 0) {
                await major.update(updateFields, { transaction });
            }

            await transaction.commit();
            return await this.getMajorById(majorId);
        } catch (error) {
            await transaction.rollback();
            throw new Error(`Repository Error - updateMajor: ${error.message}`);
        }
    }

    async deleteMajor(majorId) {
        const transaction = await sequelize.transaction();
        try {
            const major = await Majors.findByPk(majorId, { transaction });

            if (!major) {
                throw new Error('Major not found');
            }

            // Check if major has active students
            const activeStudents = await Students.count({
                where: { 
                    major_id: majorId,
                    student_status: 'active'
                },
                transaction
            });
            
            if (activeStudents > 0) {
                throw new Error('Cannot delete major with active students');
            }

            // Soft delete by deactivating
            await major.update({ is_active: false }, { transaction });

            await transaction.commit();
            return true;
        } catch (error) {
            await transaction.rollback();
            throw new Error(`Repository Error - deleteMajor: ${error.message}`);
        }
    }

    async getMajorsSimple(options = {}) {
        try {
            const { department_id = null, is_active = true } = options;
            
            const where = {};
            if (department_id) where.department_id = department_id;
            if (is_active !== null) where.is_active = is_active;

            return await Majors.findAll({
                where,
                attributes: ['major_id', 'major_code', 'major_name', 'degree_type', 'is_active'],
                order: [['major_name', 'ASC']]
            });
        } catch (error) {
            throw new Error(`Repository Error - getMajorsSimple: ${error.message}`);
        }
    }
}

module.exports = new MajorRepository();