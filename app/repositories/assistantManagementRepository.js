const { Op } = require('sequelize');
const { Users, Assistants, Departments, Roles, UserRoles, sequelize, Enrollment } = require('../models');
const bcrypt = require('bcryptjs');

class AssistantManagementRepository {
    async getAllAssistants(options = {}) {
        try {
            const { 
                page = 1, 
                limit = 10, 
                search = null, 
                department_id = null,
                is_active = null,
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
                    { '$Assistant.assistant_code$': { [Op.like]: `%${search}%` } }
                ];
            }

            const assistantInclude = {
                model: Assistants,
                as: 'Assistant',
                required: true,
                attributes: [
                    'assistant_code',
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

            // Filter by department if provided
            if (department_id) {
                assistantInclude.where = { department_id };
            }

            // Filter by active status
            if (is_active !== null) {
                assistantInclude.where = {
                    ...assistantInclude.where,
                    is_active
                };
            }

            const { count, rows } = await Users.findAndCountAll({
                where: whereConditions,
                include: [
                    assistantInclude,
                    {
                        model: UserRoles,
                        as: 'user_role',
                        required: true,
                        include: [{
                            model: Roles,
                            as: 'role',
                            where: { role_name: 'assistant' },
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
                    ['created_at', 'DESC']
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
            throw new Error(`Repository Error - getAllAssistants: ${error.message}`);
        }
    }

    async getAssistantById(userId) {
        try {
            const user = await Users.findOne({
                where: { 
                    user_id: userId,
                },
                include: [
                    {
                        model: Assistants,
                        as: 'Assistant',
                        required: true,
                        attributes: [
                            'assistant_code',
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
            throw new Error(`Repository Error - getAssistantById: ${error.message}`);
        }
    }

    async createAssistant(userData, assistantData) {
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

            // Validate assistant_code
            const codeExists = await Assistants.count({
                where: { assistant_code: assistantData.assistant_code }
            });
            if (codeExists > 0) {
                throw new Error('Assistant code already exists');
            }

            // Validate department
            const department = await Departments.findByPk(assistantData.department_id);
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

            // Create assistant record
            await Assistants.create({
                user_id: user.user_id,
                assistant_code: assistantData.assistant_code,
                department_id: assistantData.department_id,
                academic_rank: assistantData.academic_rank || null,
                degree: assistantData.degree || null,
                office_room: assistantData.office_room || null,
                office_hours: assistantData.office_hours || null,
                bio: assistantData.bio || null,
                is_active: true
            }, { transaction });

            // Assign role
            const assistantRole = await Roles.findOne({
                where: { role_name: 'assistant', is_active: true }
            });
            
            if (!assistantRole) {
                throw new Error('Assistant role not found');
            }

            await UserRoles.create({
                user_id: user.user_id,
                role_id: assistantRole.role_id,
                is_active: true
            }, { transaction });

            await transaction.commit();
            return await this.getAssistantById(user.user_id);
        } catch (error) {
            await transaction.rollback();
            throw new Error(`Repository Error - createAssistant: ${error.message}`);
        }
    }

    async updateAssistant(userId, userData, assistantData) {
        const transaction = await sequelize.transaction();
        try {
            const user = await Users.findOne({
                where: { 
                    user_id: userId,
                    is_deleted: false 
                },
                include: [{
                    model: Assistants,
                    as: 'Assistant',
                    required: true
                }],
                transaction
            });

            if (!user) {
                throw new Error('Assistant not found');
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

            // Validate assistant_code if changed
            if (assistantData.assistant_code && 
                assistantData.assistant_code !== user.Assistant.assistant_code) {
                const codeExists = await Assistants.count({
                    where: { 
                        assistant_code: assistantData.assistant_code,
                        user_id: { [Op.ne]: userId }
                    }
                });
                if (codeExists > 0) {
                    throw new Error('Assistant code already exists');
                }
            }

            // Validate department if changed
            if (assistantData.department_id && 
                assistantData.department_id !== user.Assistant.department_id) {
                const department = await Departments.findByPk(assistantData.department_id);
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

            // Update assistant specific info
            const assistantUpdateFields = {};
            const allowedAssistantFields = [
                'assistant_code', 'department_id', 'academic_rank', 'degree',
                'office_room', 'office_hours', 'bio', 'is_active'
            ];

            allowedAssistantFields.forEach(field => {
                if (assistantData[field] !== undefined) {
                    assistantUpdateFields[field] = assistantData[field];
                }
            });

            if (Object.keys(assistantUpdateFields).length > 0) {
                await user.Assistant.update(assistantUpdateFields, { transaction });
            }

            await transaction.commit();
            return await this.getAssistantById(userId);
        } catch (error) {
            await transaction.rollback();
            throw new Error(`Repository Error - updateAssistant: ${error.message}`);
        }
    }

    async deleteAssistant(userId) {
        const transaction = await sequelize.transaction();
        try {
            const user = await Users.findOne({
                where: { 
                    user_id: userId,
                    is_deleted: false 
                },
                include: [{
                    model: Assistants,
                    as: 'Assistant',
                    required: true
                }],
                transaction
            });

            if (!user) {
                throw new Error('Assistant not found');
            }

            // Soft delete
            await user.update({
                is_deleted: true,
                deleted_at: new Date(),
                is_active: false
            }, { transaction });

            // Deactivate assistant record
            await user.Assistant.update({
                is_active: false
            }, { transaction });

            await transaction.commit();
            return true;
        } catch (error) {
            await transaction.rollback();
            throw new Error(`Repository Error - deleteAssistant: ${error.message}`);
        }
    }

    async restoreAssistant(userId) {
        const transaction = await sequelize.transaction();
        try {
            const user = await Users.findOne({
                where: { 
                    user_id: userId,
                    is_deleted: true
                },
                include: [{
                    model: Assistants,
                    as: 'Assistant',
                    required: true
                }],
                transaction
            });

            if (!user) {
                throw new Error('Assistant not found or not deleted');
            }

            // Restore user
            await user.update({
                is_deleted: false,
                deleted_at: null,
                is_active: true
            }, { transaction });

            // Restore assistant record
            await user.Assistant.update({
                is_active: true
            }, { transaction });

            await transaction.commit();
            return await this.getAssistantById(userId);
        } catch (error) {
            await transaction.rollback();
            throw new Error(`Repository Error - restoreAssistant: ${error.message}`);
        }
    }
    
    async findStudentsByClassWithGrades(classId) {
        return await Enrollment.findAll({
        where: { class_id: classId },
        include: [
            {
            model: Students,
            as: "student",
            include: [
                { model: Users, as: "user" },
                { model: Majors, as: "major" }
            ]
            },
            {
            model: Classes,
            as: "class"
            },
            {
            model: Grades,
            as: "grades",
            include: ["grade_component"]
            }
        ],
        order: [["enrollment_id", "ASC"]]
        });
    }

    async updateEnrollmentScore(classId, studentId, data) {
        return Enrollment.update(
        {
            attendance_rate: data.attendance_rate,
            attendance_score: data.attendance_score,
            midterm_grade: data.midterm,
            final_grade: data.final,
            total_grade: data.average,
            comment: data.comment
        },
        {
            where: {
            class_id: classId,
            student_id: studentId
            }
        }
        );
    }
}

module.exports = new AssistantManagementRepository();
