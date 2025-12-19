const { Op } = require('sequelize');
const { Classes, Courses, Semesters, Lecturers, Users, Departments, Enrollment, Students, Majors, sequelize } = require('../models');

class ClassRepository {
    async getAllClasses(options = {}) {
        try {
            const { 
                page = 1, 
                limit = 10, 
                search = null,
                course_id = null,
                semester_id = null,
                lecturer_id = null,
                department_id = null,
                class_status = null,
                class_type = null
            } = options;
            
            const offset = (page - 1) * limit;
            const whereConditions = {};

            if (search) {
                whereConditions[Op.or] = [
                    { class_code: { [Op.like]: `%${search}%` } },
                    { class_name: { [Op.like]: `%${search}%` } }
                ];
            }

            if (course_id) whereConditions.course_id = course_id;
            if (semester_id) whereConditions.semester_id = semester_id;
            if (lecturer_id) whereConditions.lecturer_id = lecturer_id;
            if (class_status) whereConditions.class_status = class_status;
            if (class_type) whereConditions.class_type = class_type;

            const includeOptions = [
                {
                    model: Courses,
                    as: 'course',
                    attributes: ['course_id', 'course_code', 'course_name', 'credits', 'department_id'],
                    include: [{
                        model: Departments,
                        as: 'department',
                        attributes: ['department_id', 'department_code', 'department_name']
                    }]
                },
                {
                    model: Semesters,
                    as: 'semester',
                    attributes: ['semester_id', 'semester_code', 'semester_name', 'academic_year']
                },
                {
                    model: Lecturers,
                    as: 'lecturer',
                    attributes: ['user_id', 'lecturer_code', 'department_id'],
                    include: [{
                        model: Users,
                        as: 'user',
                        attributes: ['first_name', 'last_name', 'full_name', 'email']
                    }]
                }
            ];

            if (department_id) {
                includeOptions[0].include[0].where = { department_id };
            }

            const { count, rows } = await Classes.findAndCountAll({
                where: whereConditions,
                include: includeOptions,
                limit,
                offset,
                order: [['created_at', 'DESC']],
                distinct: true
            });

            return {
                total: count,
                total_pages: Math.ceil(count / limit),
                current_page: page,
                data: rows
            };
        } catch (error) {
            throw new Error(`Repository Error - getAllClasses: ${error.message}`);
        }
    }

    async getClassById(classId) {
        try {
            const classData = await Classes.findOne({
                where: { class_id: classId },
                include: [
                    {
                        model: Courses,
                        as: 'course',
                        include: [{
                            model: Departments,
                            as: 'department',
                            attributes: ['department_id', 'department_code', 'department_name']
                        }]
                    },
                    {
                        model: Semesters,
                        as: 'semester'
                    },
                    {
                        model: Lecturers,
                        as: 'lecturer',
                        include: [{
                            model: Users,
                            as: 'user',
                            attributes: ['user_id', 'first_name', 'last_name', 'full_name', 'email', 'phone']
                        }]
                    }
                ]
            });

            return classData ? classData.toJSON() : null;
        } catch (error) {
            throw new Error(`Repository Error - getClassById: ${error.message}`);
        }
    }

    async createClass(classData, creatorId, creatorDepartmentId = null) {
        const transaction = await sequelize.transaction();
        try {
            const codeExists = await Classes.count({
                where: { class_code: classData.class_code }
            });
            if (codeExists > 0) {
                throw new Error('Class code already exists');
            }

            const course = await Courses.findOne({
                where: { course_id: classData.course_id, is_active: true },
                include: [{
                    model: Departments,
                    as: 'department'
                }]
            });
            if (!course) {
                throw new Error('Course not found or inactive');
            }

            if (creatorDepartmentId && course.department_id !== creatorDepartmentId) {
                throw new Error('You can only create classes for courses in your department');
            }

            const semester = await Semesters.findByPk(classData.semester_id);
            if (!semester) {
                throw new Error('Semester not found');
            }

            const lecturer = await Lecturers.findOne({
                where: { 
                    user_id: classData.lecturer_id,
                    is_active: true
                }
            });
            if (!lecturer) {
                throw new Error('Lecturer not found or inactive');
            }

            const newClass = await Classes.create({
                course_id: classData.course_id,
                semester_id: classData.semester_id,
                lecturer_id: classData.lecturer_id,
                class_code: classData.class_code,
                class_name: classData.class_name || null,
                max_capacity: classData.max_capacity || 50,
                current_enrollment: 0,
                class_type: classData.class_type || 'regular',
                class_status: classData.class_status || 'planning',
                start_date: classData.start_date,
                end_date: classData.end_date,
                syllabus_url: classData.syllabus_url || null,
                notes: classData.notes || null,
                created_by: creatorId
            }, { transaction });

            await transaction.commit();
            return await this.getClassById(newClass.class_id);
        } catch (error) {
            await transaction.rollback();
            throw new Error(`Repository Error - createClass: ${error.message}`);
        }
    }

    async updateClass(classId, classData, updaterDepartmentId = null) {
        const transaction = await sequelize.transaction();
        try {
            const classRecord = await Classes.findOne({
                where: { class_id: classId },
                include: [{
                    model: Courses,
                    as: 'course',
                    attributes: ['department_id']
                }],
                transaction
            });

            if (!classRecord) {
                throw new Error('Class not found');
            }

            if (updaterDepartmentId && classRecord.course.department_id !== updaterDepartmentId) {
                throw new Error('You can only update classes from your department');
            }

            if (classData.class_code && classData.class_code !== classRecord.class_code) {
                const codeExists = await Classes.count({
                    where: { 
                        class_code: classData.class_code,
                        class_id: { [Op.ne]: classId }
                    }
                });
                if (codeExists > 0) {
                    throw new Error('Class code already exists');
                }
            }

            if (classData.lecturer_id && classData.lecturer_id !== classRecord.lecturer_id) {
                const lecturer = await Lecturers.findOne({
                    where: { 
                        user_id: classData.lecturer_id,
                        is_active: true
                    }
                });
                if (!lecturer) {
                    throw new Error('Lecturer not found or inactive');
                }
            }

            const updateFields = {};
            const allowedFields = [
                'lecturer_id', 'class_code', 'class_name', 'max_capacity',
                'class_type', 'class_status', 'start_date', 'end_date',
                'syllabus_url', 'notes'
            ];

            allowedFields.forEach(field => {
                if (classData[field] !== undefined) {
                    updateFields[field] = classData[field];
                }
            });

            if (Object.keys(updateFields).length > 0) {
                await classRecord.update(updateFields, { transaction });
            }

            await transaction.commit();
            return await this.getClassById(classId);
        } catch (error) {
            await transaction.rollback();
            throw new Error(`Repository Error - updateClass: ${error.message}`);
        }
    }

    async deleteClass(classId, deleterDepartmentId = null) {
        const transaction = await sequelize.transaction();
        try {
            const classRecord = await Classes.findOne({
                where: { class_id: classId },
                include: [{
                    model: Courses,
                    as: 'course',
                    attributes: ['department_id']
                }],
                transaction
            });

            if (!classRecord) {
                throw new Error('Class not found');
            }

            if (deleterDepartmentId && classRecord.course.department_id !== deleterDepartmentId) {
                throw new Error('You can only delete classes from your department');
            }

            const enrollmentCount = await Enrollment.count({
                where: { class_id: classId },
                transaction
            });
            
            if (enrollmentCount > 0) {
                throw new Error('Cannot delete class with existing enrollments');
            }

            await classRecord.destroy({ transaction });
            await transaction.commit();
            return true;
        } catch (error) {
            await transaction.rollback();
            throw new Error(`Repository Error - deleteClass: ${error.message}`);
        }
    }

    async getClassesByLecturer(lecturerId, options = {}) {
        try {
            const { semester_id = null, class_status = null } = options;
            const whereConditions = { lecturer_id: lecturerId };

            if (semester_id) whereConditions.semester_id = semester_id;
            if (class_status) whereConditions.class_status = class_status;

            return await Classes.findAll({
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
                        attributes: ['semester_id', 'semester_code', 'semester_name']
                    }
                ],
                order: [['start_date', 'DESC']]
            });
        } catch (error) {
            throw new Error(`Repository Error - getClassesByLecturer: ${error.message}`);
        }
    }

    async getClassesByDepartment(departmentId, options = {}) {
        try {
            const { semester_id = null, class_status = null } = options;
            const whereConditions = {};

            if (semester_id) whereConditions.semester_id = semester_id;
            if (class_status) whereConditions.class_status = class_status;

            return await Classes.findAll({
                where: whereConditions,
                include: [
                    {
                        model: Courses,
                        as: 'course',
                        where: { department_id: departmentId },
                        attributes: ['course_id', 'course_code', 'course_name', 'credits']
                    },
                    {
                        model: Semesters,
                        as: 'semester',
                        attributes: ['semester_id', 'semester_code', 'semester_name']
                    },
                    {
                        model: Lecturers,
                        as: 'lecturer',
                        attributes: ['user_id', 'lecturer_code'],
                        include: [{
                            model: Users,
                            as: 'user',
                            attributes: ['first_name', 'last_name', 'full_name']
                        }]
                    }
                ],
                order: [['created_at', 'DESC']]
            });
        } catch (error) {
            throw new Error(`Repository Error - getClassesByDepartment: ${error.message}`);
        }
    }

    async addStudentsToClass(classId, studentIds, enrollmentType = 'regular') {
        const transaction = await sequelize.transaction();
        try {
            const classRecord = await Classes.findOne({
                where: { class_id: classId },
                transaction,
                lock: transaction.LOCK.UPDATE
            });
            
            if (!classRecord) {
                throw new Error('Class not found');
            }

            const results = { success: [], failed: [] };
            let currentEnrollment = classRecord.current_enrollment || 0;
            const maxCapacity = classRecord.max_capacity || 0;

            for (const userId of studentIds) {
                try {
                    if (!userId || isNaN(userId)) {
                        results.failed.push({
                            student_id: userId,
                            reason: 'Invalid user ID'
                        });
                        continue;
                    }

                    if (currentEnrollment >= maxCapacity) {
                        results.failed.push({
                            student_id: userId,
                            reason: 'Class is full'
                        });
                        continue;
                    }

                    const student = await Students.findOne({
                        where: { user_id: userId },
                        attributes: ['user_id', 'student_code'],
                        transaction
                    });

                    if (!student) {
                        results.failed.push({
                            student_id: userId,
                            reason: 'Student profile not found'
                        });
                        continue;
                    }

                    const user = await Users.findOne({
                        where: { 
                            user_id: userId,
                            is_active: true,
                            is_deleted: false
                        },
                        transaction
                    });

                    if (!user) {
                        results.failed.push({
                            student_id: userId,
                            reason: 'User not found or inactive'
                        });
                        continue;
                    }

                    const existingEnrollment = await Enrollment.findOne({
                        where: {
                            student_id: userId,
                            class_id: classId
                        },
                        transaction
                    });

                    if (existingEnrollment) {
                        if (existingEnrollment.enrollment_status === 'dropped') {
                            await existingEnrollment.update({
                                enrollment_status: 'enrolled',
                                enrollment_type: enrollmentType,
                                enrollment_date: new Date(),
                                drop_date: null
                            }, { transaction });

                            currentEnrollment++;
                            await classRecord.increment('current_enrollment', { by: 1, transaction });

                            results.success.push({
                                student_id: userId,
                                message: 'Re-enrolled successfully'
                            });
                            continue;
                        } else {
                            results.failed.push({
                                student_id: userId,
                                reason: 'Already enrolled'
                            });
                            continue;
                        }
                    }

                    await Enrollment.create({
                        student_id: userId,
                        class_id: classId,
                        enrollment_status: 'enrolled',
                        enrollment_type: enrollmentType,
                        enrollment_date: new Date()
                    }, { transaction });

                    currentEnrollment++;
                    await classRecord.increment('current_enrollment', { by: 1, transaction });

                    results.success.push({
                        student_id: userId,
                        message: 'Successfully enrolled'
                    });

                } catch (err) {
                    console.error(`[Enrollment Error] User ${userId}:`, err.message);
                    results.failed.push({
                        student_id: userId,
                        reason: err.message || 'Unknown error'
                    });
                }
            }

            await transaction.commit();
            return results;
        } catch (error) {
            await transaction.rollback();
            throw new Error(`Repository Error - addStudentsToClass: ${error.message}`);
        }
    }

    async removeStudentFromClass(classId, userId) {
        const transaction = await sequelize.transaction();
        try {
            const studentRecord = await Students.findOne({
                where: { user_id: userId },
                attributes: ['user_id', 'student_code'],
                transaction
            });

            if (!studentRecord) {
                throw new Error('Student profile not found');
            }

            const enrollment = await Enrollment.findOne({
                where: {
                    student_id: userId,
                    class_id: classId
                },
                transaction
            });

            if (!enrollment) {
                await transaction.commit();
                return true;
            }

            const { Grades } = require('../models');
            const hasGrades = await Grades.count({
                where: { enrollment_id: enrollment.enrollment_id },
                transaction
            });

            if (hasGrades > 0) {
                await enrollment.update({
                    enrollment_status: 'dropped',
                    enrollment_type: 'dropped',
                    drop_date: new Date()
                }, { transaction });
            } else {
                await enrollment.destroy({ transaction });
            }

            const classRecord = await Classes.findByPk(classId, { transaction });
            if (classRecord && classRecord.current_enrollment > 0) {
                await classRecord.decrement('current_enrollment', { transaction });
            }

            await transaction.commit();
            return true;
        } catch (error) {
            await transaction.rollback();
            throw new Error(`Repository Error - removeStudentFromClass: ${error.message}`);
        }
    }

   async getClassStudents(classId, departmentId = null) {
    try {
        // BƯỚC 1: Nếu có departmentId, kiểm tra class có thuộc department không
        if (departmentId) {
            const classRecord = await Classes.findOne({
                where: { class_id: classId },
                include: [{
                    model: Courses,
                    as: 'course',
                    attributes: ['department_id'],
                    where: { department_id: departmentId }
                }]
            });

            if (!classRecord) {
                throw new Error('Class not found or does not belong to your department');
            }
        }

        const whereConditions = { class_id: classId };
            const includeOptions = [
                {
                    model: Students,
                    as: 'student',
                    required: true,
                    include: [
                        {
                            model: Users,
                            as: 'user',
                            attributes: ['user_id', 'username', 'first_name', 'last_name', 'full_name', 'email', 'phone'],
                            where: { is_deleted: false }
                        },
                        {
                            model: Majors,
                            as: 'major',
                            attributes: ['major_id', 'major_code', 'major_name', 'department_id'],
                            include: [{
                                model: Departments,
                                as: 'department',
                                attributes: ['department_id', 'department_code', 'department_name']
                            }]
                        }
                    ]
                }
            ];
            
            const enrollments = await Enrollment.findAll({
                where: whereConditions,
                include: includeOptions,
                attributes: [
                    'enrollment_id',
                    'student_id',
                    'class_id',
                    'enrollment_status',
                    'enrollment_type',
                    'enrollment_date',
                    'drop_date',
                    'attendance_rate',
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
                    [{ model: Students, as: 'student' }, { model: Users, as: 'user' }, 'last_name', 'ASC']
                ]
            });

            return enrollments.map(e => {
                const enrollment = e.toJSON();
                return {
                    ...enrollment,
                    grades: {
                        mini: enrollment.mini_test_grade,
                        assignment: enrollment.assignment_grade,
                        lab: enrollment.lab_work_grade,
                        midterm: enrollment.midterm_grade,
                        final: enrollment.final_grade,
                        total: enrollment.total_grade,
                        letter: enrollment.letter_grade,
                        gpa: enrollment.gpa_value
                    }
                };
            });
        } catch (error) {
            throw new Error(`Repository Error - getClassStudents: ${error.message}`);
        }
    }

    async getAvailableStudents(departmentId = null, options = {}) {
        try {
            const { 
                search = null, 
                major_id = null, 
                admission_year = null,
                exclude_class_id = null
            } = options;

            const whereConditions = { is_active: true, is_deleted: false };

            if (search) {
                whereConditions[Op.or] = [
                    { first_name: { [Op.like]: `%${search}%` } },
                    { last_name: { [Op.like]: `%${search}%` } },
                    { full_name: { [Op.like]: `%${search}%` } },
                    { email: { [Op.like]: `%${search}%` } },
                    { '$Student.student_code$': { [Op.like]: `%${search}%` } }
                ];
            }

            const studentWhere = {};
            if (admission_year) studentWhere.admission_year = admission_year;

            const majorWhere = {};
            if (major_id) majorWhere.major_id = major_id;
            if (departmentId) majorWhere.department_id = departmentId;

            const students = await Users.findAll({
                where: whereConditions,
                include: [
                    {
                        model: Students,
                        as: 'Student',
                        required: true,
                        where: Object.keys(studentWhere).length > 0 ? studentWhere : undefined,
                        attributes: ['student_code', 'major_id', 'admission_year', 'student_status'],
                        include: [{
                            model: Majors,
                            as: 'major',
                            required: true,
                            where: Object.keys(majorWhere).length > 0 ? majorWhere : undefined,
                            attributes: ['major_id', 'major_code', 'major_name', 'department_id'],
                            include: [{
                                model: Departments,
                                as: 'department',
                                attributes: ['department_id', 'department_code', 'department_name']
                            }]
                        }]
                    }
                ],
                attributes: ['user_id', 'username', 'first_name', 'last_name', 'full_name', 'email'],
                order: [['last_name', 'ASC']],
            });

            // Filter out students already enrolled in the class
            if (exclude_class_id) {
                const enrolledStudents = await Enrollment.findAll({
                    where: {
                        class_id: exclude_class_id,
                        enrollment_status: { [Op.ne]: 'dropped' }
                    },
                    attributes: ['student_id'],
                    raw: true
                });

                const enrolledUserIds = new Set(enrolledStudents.map(e => e.student_id));
                return students.filter(s => !enrolledUserIds.has(s.user_id));
            }

            return students; 
        } catch (error) {
            throw new Error(`Repository Error - getAvailableStudents: ${error.message}`);
        }
    }

    async updateEnrollmentType(classId, studentId, payload = {}) {
        const { enrollment_type, enrollment_status } = payload;
        const transaction = await sequelize.transaction();
        
        try {
            // Verify student profile exists
            const studentRecord = await Students.findOne({
                where: { user_id: studentId },
                attributes: ['user_id', 'student_code'],
                transaction
            });

            if (!studentRecord) {
                throw new Error('Student profile not found');
            }

            // Find enrollment record
            const enrollment = await Enrollment.findOne({
                where: {
                    student_id: studentId,
                    class_id: classId
                },
                order: [['created_at', 'DESC']],
                transaction
            });

            if (!enrollment) {
                throw new Error('Enrollment not found for this student in the class');
            }

            // Lock class row to safely update counts
            const classRecord = await Classes.findOne({
                where: { class_id: classId },
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            if (!classRecord) {
                throw new Error('Class not found');
            }

            const prevStatus = enrollment.enrollment_status;
            const prevType = enrollment.enrollment_type;

            // Build update object
            const updateFields = {};
            
            if (typeof enrollment_type !== 'undefined' && enrollment_type !== prevType) {
                updateFields.enrollment_type = enrollment_type;
                console.log('[updateEnrollmentType] Updating type:', prevType, '->', enrollment_type);
            }
            
            if (typeof enrollment_status !== 'undefined' && enrollment_status !== prevStatus) {
                updateFields.enrollment_status = enrollment_status;
                console.log('[updateEnrollmentType] Updating status:', prevStatus, '->', enrollment_status);
                
                // Handle status transitions affecting class enrollment count
                const currentEnrollment = classRecord.current_enrollment || 0;
                const maxCapacity = classRecord.max_capacity || 0;
                
                // from enrolled -> dropped: decrement count
                if (prevStatus === 'enrolled' && enrollment_status === 'dropped') {
                    const newCount = Math.max(0, currentEnrollment - 1);
                    await classRecord.update({ current_enrollment: newCount }, { transaction });
                }
                
                // from dropped -> enrolled: increment if capacity allows
                else if (prevStatus === 'dropped' && enrollment_status === 'enrolled') {
                    if (currentEnrollment >= maxCapacity) {
                        throw new Error('Class is full. Cannot re-enroll student.');
                    }
                    await classRecord.update({ current_enrollment: currentEnrollment + 1 }, { transaction });
                }
                
                else if (prevStatus === 'dropped' && enrollment_status === 'completed') {
                    if (currentEnrollment >= maxCapacity) {
                        throw new Error('Class is full. Cannot change status to completed.');
                    }
                    await classRecord.update({ current_enrollment: currentEnrollment + 1 }, { transaction });
                }
                
                // completed -> dropped: decrement count
                else if (prevStatus === 'completed' && enrollment_status === 'dropped') {
                    const newCount = Math.max(0, currentEnrollment - 1);
                    await classRecord.update({ current_enrollment: newCount }, { transaction });
                }
            }

            // Apply update to enrollment
            if (Object.keys(updateFields).length > 0) {
                await enrollment.update(updateFields, { transaction });
            } else {
                console.log('[updateEnrollmentType] No changes to apply');
            }

            await transaction.commit();
            return true;
            
        } catch (error) {
            await transaction.rollback();
            console.error('[updateEnrollmentType] Error:', error.message);
            throw new Error(`Repository Error - updateEnrollmentType: ${error.message}`);
        }
    }
}

module.exports = new ClassRepository();