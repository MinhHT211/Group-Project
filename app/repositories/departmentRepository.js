const { Op } = require('sequelize');
const { Departments, Lecturers, Users, Majors, Assistants, sequelize } = require('../models');

class DepartmentRepository {
    async getAllDepartments(options = {}) {
        try {
            const { 
                page = 1, 
                limit = 10, 
                search = null, 
                is_active = null 
            } = options;
            
            const offset = (page - 1) * limit;
            const whereConditions = {};

            if (search) {
                whereConditions[Op.or] = [
                    { department_code: { [Op.like]: `%${search}%` } },
                    { department_name: { [Op.like]: `%${search}%` } }
                ];
            }

            if (is_active !== null) {
                whereConditions.is_active = is_active;
            }

            const { count, rows } = await Departments.findAndCountAll({
                where: whereConditions,
                include: [
                    {
                        model: Lecturers,
                        as: 'head_lecturer',
                        required: false,
                        include: [{
                            model: Users,
                            as: 'user',
                            attributes: ['first_name', 'last_name', 'full_name']
                        }]
                    },
                    {
                        model: Majors,
                        as: 'majors',
                        required: false,
                        attributes: ['major_id', 'major_code', 'major_name', 'is_active']
                    }
                ],
                attributes: {
                    include: [
                        [
                            sequelize.literal(`(
                                SELECT COUNT(*)
                                FROM Lecturers
                                WHERE Lecturers.department_id = Departments.department_id
                                AND Lecturers.is_active = true
                            )`),
                            'lecturer_count'
                        ],
                        [
                            sequelize.literal(`(
                                SELECT COUNT(*)
                                FROM Assistants
                                WHERE Assistants.department_id = Departments.department_id
                                AND Assistants.is_active = true
                            )`),
                            'assistant_count'
                        ],
                        [
                            sequelize.literal(`(
                                SELECT COUNT(*)
                                FROM Majors
                                WHERE Majors.department_id = Departments.department_id
                                AND Majors.is_active = true
                            )`),
                            'major_count'
                        ]
                    ]
                },
                limit,
                offset,
                order: [['department_name', 'ASC']],
                distinct: true
            });

            return {
                total: count,
                total_pages: Math.ceil(count / limit),
                current_page: page,
                data: rows
            };
        } catch (error) {
            throw new Error(`Repository Error - getAllDepartments: ${error.message}`);
        }
    }

    async getDepartmentById(departmentId) {
        try {
            const department = await Departments.findOne({
                where: { department_id: departmentId },
                include: [
                    {
                        model: Lecturers,
                        as: 'head_lecturer',
                        required: false,
                        include: [{
                            model: Users,
                            as: 'user',
                            attributes: ['user_id', 'first_name', 'last_name', 'full_name', 'email', 'phone']
                        }]
                    },
                    {
                        model: Majors,
                        as: 'majors',
                        required: false,
                        where: { is_active: true },
                        attributes: [
                            'major_id', 'major_code', 'major_name', 
                            'degree_type', 'required_credits', 'duration_years',
                            'description', 'is_active', 'created_at', 'updated_at'
                        ]
                    }
                ],
                attributes: {
                    include: [
                        [
                            sequelize.literal(`(
                                SELECT COUNT(*)
                                FROM Lecturers
                                WHERE Lecturers.department_id = Departments.department_id
                                AND Lecturers.is_active = true
                            )`),
                            'lecturer_count'
                        ],
                        [
                            sequelize.literal(`(
                                SELECT COUNT(*)
                                FROM Assistants
                                WHERE Assistants.department_id = Departments.department_id
                                AND Assistants.is_active = true
                            )`),
                            'assistant_count'
                        ]
                    ]
                }
            });

            return department ? department.toJSON() : null;
        } catch (error) {
            throw new Error(`Repository Error - getDepartmentById: ${error.message}`);
        }
    }

    async createDepartment(departmentData) {
        const transaction = await sequelize.transaction();
        try {
            // Validate department_code uniqueness
            const codeExists = await Departments.count({
                where: { department_code: departmentData.department_code }
            });
            if (codeExists > 0) {
                throw new Error('Department code already exists');
            }

            const nameExists = await Departments.count({
                where: { department_name: departmentData.department_name }
            });
            if (nameExists > 0) {
                throw new Error('Department name already exists');
            }

            // Validate head_lecturer if provided
            if (departmentData.head_lecturer_id) {
                const lecturer = await Lecturers.findOne({
                    where: { 
                        user_id: departmentData.head_lecturer_id,
                        is_active: true
                    }
                });
                if (!lecturer) {
                    throw new Error('Head lecturer not found or inactive');
                }
            }

            const department = await Departments.create({
                department_code: departmentData.department_code,
                department_name: departmentData.department_name,
                description: departmentData.description || null,
                head_lecturer_id: departmentData.head_lecturer_id || null,
                phone: departmentData.phone || null,
                email: departmentData.email || null,
                location: departmentData.location || null,
                is_active: departmentData.is_active !== undefined ? departmentData.is_active : true
            }, { transaction });

            await transaction.commit();
            return await this.getDepartmentById(department.department_id);
        } catch (error) {
            await transaction.rollback();
            throw new Error(`Repository Error - createDepartment: ${error.message}`);
        }
    }

    async updateDepartment(departmentId, departmentData) {
        const transaction = await sequelize.transaction();
        try {
            const department = await Departments.findByPk(departmentId, { transaction });

            if (!department) {
                throw new Error('Department not found');
            }

            // Validate department_code if changed
            if (departmentData.department_code && 
                departmentData.department_code !== department.department_code) {
                const codeExists = await Departments.count({
                    where: { 
                        department_code: departmentData.department_code,
                        department_id: { [Op.ne]: departmentId }
                    }
                });
                if (codeExists > 0) {
                    throw new Error('Department code already exists');
                }
            }

            if (departmentData.department_name && 
                departmentData.department_name !== department.department_name) {
                const nameExists = await Departments.count({
                    where: { 
                        department_name: departmentData.department_name,
                        department_id: { [Op.ne]: departmentId }
                    }
                });
                if (codeExists > 0) {
                    throw new Error('Department name already exists');
                }
            }

            // Validate head_lecturer if changed
            if (departmentData.head_lecturer_id !== undefined && 
                departmentData.head_lecturer_id !== null) {
                const lecturer = await Lecturers.findOne({
                    where: { 
                        user_id: departmentData.head_lecturer_id,
                        is_active: true
                    }
                });
                if (!lecturer) {
                    throw new Error('Head lecturer not found or inactive');
                }
            }

            const updateFields = {};
            const allowedFields = [
                'department_code', 'department_name', 'description',
                'head_lecturer_id', 'phone', 'email', 'location', 'is_active'
            ];

            allowedFields.forEach(field => {
                if (departmentData[field] !== undefined) {
                    updateFields[field] = departmentData[field];
                }
            });

            if (Object.keys(updateFields).length > 0) {
                await department.update(updateFields, { transaction });
            }

            await transaction.commit();
            return await this.getDepartmentById(departmentId);
        } catch (error) {
            await transaction.rollback();
            throw new Error(`Repository Error - updateDepartment: ${error.message}`);
        }
    }

    async deleteDepartment(departmentId) {
        const transaction = await sequelize.transaction();
        try {
            const department = await Departments.findByPk(departmentId, { transaction });

            if (!department) {
                throw new Error('Department not found');
            }

            // Check if department has active majors
            const activeMajors = await Majors.count({
                where: { 
                    department_id: departmentId,
                    is_active: true
                },
                transaction
            });
            
            if (activeMajors > 0) {
                throw new Error('Cannot delete department with active majors');
            }

            // Check if department has active lecturers
            const activeLecturers = await Lecturers.count({
                where: { 
                    department_id: departmentId,
                    is_active: true
                },
                transaction
            });
            
            if (activeLecturers > 0) {
                throw new Error('Cannot delete department with active lecturers');
            }

            // Check if department has active assistants
            const activeAssistants = await Assistants.count({
                where: { 
                    department_id: departmentId,
                    is_active: true
                },
                transaction
            });
            
            if (activeAssistants > 0) {
                throw new Error('Cannot delete department with active assistants');
            }

            // Soft delete by deactivating
            await department.update({ is_active: false }, { transaction });

            await transaction.commit();
            return true;
        } catch (error) {
            await transaction.rollback();
            throw new Error(`Repository Error - deleteDepartment: ${error.message}`);
        }
    }

    async getAllDepartmentsSimple(is_active = true) {
        try {
            const where = {};
            if (is_active !== null) {
                where.is_active = is_active;
            }

            return await Departments.findAll({
                where,
                attributes: ['department_id', 'department_code', 'department_name', 'is_active'],
                order: [['department_name', 'ASC']]
            });
        } catch (error) {
            throw new Error(`Repository Error - getAllDepartmentsSimple: ${error.message}`);
        }
    }
}

module.exports = new DepartmentRepository();