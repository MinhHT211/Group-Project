const { Op,col,where} = require('sequelize');
const { Users, Students, Majors, Departments, Lecturers, Roles, UserRoles, Enrollment, sequelize } = require('../models');
const bcrypt = require('bcryptjs');

class StudentDepartmentManagementRepository {
    async getStudentsByDepartment(departmentId, options = {}) {
        try {
            const { 
                page = 1, 
                limit = 10, 
                search = null,
                major_id = null,
                major_code = null, 
                admission_year = null,
                student_status = null,
                is_active = null,
                include_deleted = true
            } = options;
            
            const offset = (page - 1) * limit;

            const whereConditions = include_deleted ? {} : { is_deleted: false };

            if (search && search.trim()) {
                const q = `%${search.trim()}%`;
                whereConditions[Op.or] = [
                { first_name: { [Op.like]: q } },   
                { last_name:  { [Op.like]: q } },
                { full_name:  { [Op.like]: q } },
                { email:      { [Op.like]: q } },
                where(col('Student.student_code'),   { [Op.like]: q }),
                where(col('Student->major.major_code'), { [Op.like]: q }),
                where(col('Student->major.major_name'), { [Op.like]: q }),
                ];
            }

            if (is_active !== null) {
                whereConditions.is_active = is_active;
            }

            const studentWhere = {};
            if (major_id)       studentWhere.major_id = major_id;
            if (admission_year) studentWhere.admission_year = admission_year;
            if (student_status) studentWhere.student_status = student_status;
            
            const majorWhere = {};
            if (major_code) majorWhere.major_code = major_code;
            if (departmentId) majorWhere.department_id = departmentId; 

            const studentInclude = {
                model: Students,
                as: 'Student',
                required: true,
                attributes: [
                    'student_code',
                    'major_id',
                    'admission_year',
                    'expected_graduation_year',
                    'student_status',
                    'academic_advisor_id',
                    'created_at',
                    'updated_at'
                ],
                ...(Object.keys(studentWhere).length ? { where: studentWhere } : {}),
                include: [
                    {
                        model: Majors,
                        as: 'major',
                        required: true,
                        attributes: [
                            'major_id',
                            'major_code',
                            'major_name',
                            'degree_type',
                            'required_credits'
                        ],
                        ...(Object.keys(majorWhere).length ? { where: majorWhere } : {}),
                        include: [{
                            model: Departments,
                            as: 'department',
                            // where: { department_id: departmentId },
                            attributes: [
                                'department_id',
                                'department_code',
                                'department_name'
                            ],
                            required: false, 
                        }]
                    },
                    {
                        model: Lecturers,
                        // as: 'academicAdvisor',
                        as: 'lecturer',
                        required: false,
                        attributes: ['lecturer_code'],
                        include: [{
                            model: Users,
                            as: 'user',
                            attributes: ['first_name', 'last_name', 'full_name']
                        }]
                    }
                ]
            };

            // Build student where conditions
            // const studentWhere = {};
            // if (major_id) studentWhere.major_id = major_id;
            // if (admission_year) studentWhere.admission_year = admission_year;
            // if (student_status) studentWhere.student_status = student_status;
            
            // const majorWhere = {};
            // if (major_code) majorWhere.major_code = major_code; 

            // if (Object.keys(studentWhere).length > 0) {
            //     studentInclude.where = studentWhere;
            // }

            const { count, rows } = await Users.findAndCountAll({
                where: whereConditions,
                include: [
                    studentInclude,
                    {
                        model: UserRoles,
                        as: 'user_role',
                        required: true,
                        include: [{
                            model: Roles,
                            as: 'role',
                            where: { role_name: 'student' },
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
                    [{ model: Students, as: 'Student' }, 'admission_year', 'DESC'],
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
            throw new Error(`Repository Error - getStudentsByDepartment: ${error.message}`);
        }
    }

    async getStudentById(userId, departmentId = null) {
        try {
            const includeOptions = [
                {
                    model: Students,
                    as: 'Student',
                    required: true,
                    attributes: [
                        'student_code',
                        'major_id',
                        'admission_year',
                        'expected_graduation_year',
                        'student_status',
                        'academic_advisor_id',
                        'created_at',
                        'updated_at'
                    ],
                    include: [
                        {
                            model: Majors,
                            as: 'major',
                            attributes: [
                                'major_id',
                                'major_code',
                                'major_name',
                                'degree_type',
                                'required_credits',
                                'duration_years'
                            ],
                            include: [{
                                model: Departments,
                                as: 'department',
                                attributes: [
                                    'department_id',
                                    'department_code',
                                    'department_name'
                                ],
                            }]
                        },
                        {
                            model: Lecturers,
                            as: 'lecturer',                            
                            required: false,
                            attributes: ['lecturer_code'],
                            include: [{
                                model: Users,
                                as: 'user',
                                attributes: ['first_name', 'last_name', 'full_name', 'email']
                            }]
                        }
                    ]
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
            ];

            // If departmentId is provided, filter by department
            if (departmentId) {
                includeOptions[0].include[0].include[0].where = { department_id: departmentId };
            }

            const user = await Users.findOne({
                where: { 
                    user_id: userId,
                    is_deleted: false 
                },
                include: includeOptions,
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
            throw new Error(`Repository Error - getStudentById: ${error.message}`);
        }
    }

    async createStudent(userData, studentData, departmentId) {
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

            // Validate student_code
            const codeExists = await Students.count({
                where: { student_code: studentData.student_code }
            });
            if (codeExists > 0) {
                throw new Error('Student code already exists');
            }

            // Validate major and check if it belongs to department
            const major = await Majors.findOne({
                where: { 
                    major_id: studentData.major_id,
                    department_id: departmentId,
                    is_active: true
                }
            });

            if (!major) {
                throw new Error('Major not found or does not belong to your department');
            }

            // Validate academic advisor if provided
            if (studentData.academic_advisor_id) {
                const advisor = await Lecturers.findOne({
                    where: { 
                        user_id: studentData.academic_advisor_id,
                        department_id: departmentId,
                        is_active: true
                    }
                });

                if (!advisor) {
                    throw new Error('Academic advisor not found or does not belong to your department');
                }
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

            // Create student record
            await Students.create({
                user_id: user.user_id,
                student_code: studentData.student_code,
                major_id: studentData.major_id,
                admission_year: studentData.admission_year,
                expected_graduation_year: studentData.expected_graduation_year || null,
                student_status: studentData.student_status || 'active',
                academic_advisor_id: studentData.academic_advisor_id || null
            }, { transaction });

            // Assign role
            const studentRole = await Roles.findOne({
                where: { role_name: 'student', is_active: true }
            });
            
            if (!studentRole) {
                throw new Error('Student role not found');
            }

            await UserRoles.create({
                user_id: user.user_id,
                role_id: studentRole.role_id,
                is_active: true
            }, { transaction });

            await transaction.commit();
            return await this.getStudentById(user.user_id, departmentId);
        } catch (error) {
            await transaction.rollback();
            throw new Error(`Repository Error - createStudent: ${error.message}`);
        }
    }

    async updateStudent(userId, userData, studentData, departmentId) {
        const transaction = await sequelize.transaction();
        try {
            // Get student and verify it belongs to department
            const user = await Users.findOne({
                where: { 
                    user_id: userId,
                    is_deleted: false 
                },
                include: [{
                    model: Students,
                    as: 'Student',
                    required: true,
                    include: [{
                        model: Majors,
                        as: 'major',
                        required: true,
                        where: { department_id: departmentId }
                    }]
                }],
                transaction
            });

            if (!user) {
                throw new Error('Student not found or does not belong to your department');
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

            // Validate student_code if changed
            if (studentData.student_code && 
                studentData.student_code !== user.Student.student_code) {
                const codeExists = await Students.count({
                    where: { 
                        student_code: studentData.student_code,
                        user_id: { [Op.ne]: userId }
                    }
                });
                if (codeExists > 0) {
                    throw new Error('Student code already exists');
                }
            }

            // Validate major if changed (must belong to same department)
            if (studentData.major_id && 
                studentData.major_id !== user.Student.major_id) {
                const major = await Majors.findOne({
                    where: { 
                        major_id: studentData.major_id,
                        department_id: departmentId,
                        is_active: true
                    }
                });

                if (!major) {
                    throw new Error('Major not found or does not belong to your department');
                }
            }

            // Validate academic advisor if changed
            if (studentData.academic_advisor_id && 
                studentData.academic_advisor_id !== user.Student.academic_advisor_id) {
                const advisor = await Lecturers.findOne({
                    where: { 
                        user_id: studentData.academic_advisor_id,
                        department_id: departmentId,
                        is_active: true
                    }
                });

                if (!advisor) {
                    throw new Error('Academic advisor not found or does not belong to your department');
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

            // Update student specific info
            const studentUpdateFields = {};
            const allowedStudentFields = [
                'student_code', 'major_id', 'admission_year',
                'expected_graduation_year', 'student_status', 'academic_advisor_id'
            ];

            allowedStudentFields.forEach(field => {
                if (studentData[field] !== undefined) {
                    studentUpdateFields[field] = studentData[field];
                }
            });

            if (Object.keys(studentUpdateFields).length > 0) {
                await user.Student.update(studentUpdateFields, { transaction });
            }

            await transaction.commit();
            return await this.getStudentById(userId, departmentId);
        } catch (error) {
            await transaction.rollback();
            throw new Error(`Repository Error - updateStudent: ${error.message}`);
        }
    }

    async deleteStudent(userId, departmentId) {
        const transaction = await sequelize.transaction();
        try {
            // Get student and verify it belongs to department
            const user = await Users.findOne({
                where: { 
                    user_id: userId,
                    is_deleted: false 
                },
                include: [{
                    model: Students,
                    as: 'Student',
                    required: true,
                    include: [{
                        model: Majors,
                        as: 'major',
                        required: true,
                        where: { department_id: departmentId }
                    }]
                }],
                transaction
            });

            if (!user) {
                throw new Error('Student not found or does not belong to your department');
            }

            // Check active enrollments
            const activeEnrollments = await Enrollment.count({
                where: { 
                    student_id: userId,
                    enrollment_status: 'enrolled'
                },
                transaction
            });
            
            if (activeEnrollments > 0) {
                throw new Error('Cannot delete student with active enrollments. Please drop all classes first.');
            }

            // Soft delete
            await user.update({
                is_deleted: true,
                deleted_at: new Date(),
                is_active: false
            }, { transaction });

            await transaction.commit();
            return true;
        } catch (error) {
            await transaction.rollback();
            throw new Error(`Repository Error - deleteStudent: ${error.message}`);
        }
    }

    async restoreStudent(userId) {
        const transaction = await sequelize.transaction();
        try {
            const user = await Users.findOne({
                where: { 
                    user_id: userId,
                    is_deleted: true
                },
                include: [{
                    model: Students,
                    as: 'Student',
                    required: true
                }],
                transaction
            });

            if (!user) {
                throw new Error('Student not found or not deleted');
            }

            // Restore user
            await user.update({
                is_deleted: false,
                deleted_at: null,
                is_active: true
            }, { transaction });

            // Restore assistant record
            await user.Student.update({
                is_active: true
            }, { transaction });

            await transaction.commit();
            return await this.getStudentById(userId);
        } catch (error) {
            await transaction.rollback();
            throw new Error(`Repository Error - restoreStudent: ${error.message}`);
        }
    }
}
module.exports = new StudentDepartmentManagementRepository();