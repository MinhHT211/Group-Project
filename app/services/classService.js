const ClassRepository = require('../repositories/classRepository');

class ClassService {
    constructor() {
        this.repository = ClassRepository;
    }
    
    async getAllClasses(options = {}, userDepartmentId = null) {
        try {
            // If user has department, only show their department's classes by default
            if (userDepartmentId && !options.department_id) {
                options.department_id = userDepartmentId;
            }

            const result = await this.repository.getAllClasses(options);

            if (!result.data || result.data.length === 0) {
                return {
                    ...result,
                    data: []
                };
            }

            result.data = result.data.map(classData => this.formatClassData(classData));
            return result;
        } catch (error) {
            throw new Error(`Service Error - getAllClasses: ${error.message}`);
        }
    }

    async getClassById(classId) {
        try {
            const classData = await this.repository.getClassById(classId);

            if (!classData) {
                throw new Error('Class not found');
            }

            return {
                success: true,
                data: this.formatClassData(classData)
            };
        } catch (error) {
            throw new Error(`Service Error - getClassById: ${error.message}`);
        }
    }

    async createClass(classData, creatorId, creatorDepartmentId = null) {
        try {
            this.validateClassData(classData);

            const newClass = await this.repository.createClass(
                classData,
                creatorId,
                creatorDepartmentId
            );

            return {
                success: true,
                message: 'Class created successfully',
                data: this.formatClassData(newClass)
            };
        } catch (error) {
            throw new Error(`Service Error - createClass: ${error.message}`);
        }
    }

    async updateClass(classId, classData, updaterDepartmentId = null) {
        try {
            const updatedClass = await this.repository.updateClass(
                classId,
                classData,
                updaterDepartmentId
            );

            return {
                success: true,
                message: 'Class updated successfully',
                data: this.formatClassData(updatedClass)
            };
        } catch (error) {
            throw new Error(`Service Error - updateClass: ${error.message}`);
        }
    }

    async deleteClass(classId, deleterDepartmentId = null) {
        try {
            await this.repository.deleteClass(classId, deleterDepartmentId);

            return {
                success: true,
                message: 'Class deleted successfully'
            };
        } catch (error) {
            throw new Error(`Service Error - deleteClass: ${error.message}`);
        }
    }

    async getClassesByLecturer(lecturerId, options = {}) {
        try {
            const classes = await this.repository.getClassesByLecturer(lecturerId, options);
            
            return {
                success: true,
                data: classes.map(c => this.formatClassData(c))
            };
        } catch (error) {
            throw new Error(`Service Error - getClassesByLecturer: ${error.message}`);
        }
    }

    async getClassesByDepartment(departmentId, options = {}) {
        try {
            const classes = await this.repository.getClassesByDepartment(departmentId, options);
            
            return {
                success: true,
                data: classes.map(c => this.formatClassData(c))
            };
        } catch (error) {
            throw new Error(`Service Error - getClassesByDepartment: ${error.message}`);
        }
    }

    // --- ENROLLMENT MANAGEMENT ---

    async addStudentsToClass(classId, studentIds, enrollmentType = 'regular') {
        try {
            // Validate inputs
            if (!classId) {
                throw new Error('classId is required');
            }
            
            if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
                throw new Error('student_ids array is required and must not be empty');
            }

            // Validate enrollment type
            const validTypes = ['regular', 'retake', 'improve'];
            if (!validTypes.includes(enrollmentType)) {
                throw new Error('Invalid enrollment_type. Must be: regular, retake, or improve');
            }

            // Call repository method
            const results = await this.repository.addStudentsToClass(
                classId,
                studentIds,
                enrollmentType
            );

            // Build response message
            const successCount = results.success.length;
            const failCount = results.failed.length;
            
            let message = '';
            if (successCount > 0) {
                message = `Successfully enrolled ${successCount} student(s)`;
            }
            if (failCount > 0) {
                message += (message ? '. ' : '') + `${failCount} student(s) failed`;
            }
            if (!message) {
                message = 'No students were enrolled';
            }

            return {
                success: successCount > 0,
                message: message,
                data: results
            };
            
        } catch (error) {
            console.error('Service Error - addStudentsToClass:', error);
            throw new Error(`Service Error - addStudentsToClass: ${error.message}`);
        }
    }

    async getClassStudents(classId, departmentId = null) {
        try {
            if (!classId) {
                throw new Error('classId is required');
            }

            const enrollments = await this.repository.getClassStudents(classId, departmentId);

            return {
                success: true,
                total: enrollments.length,
                data: enrollments.map(e => this.formatEnrollmentData(e))
            };
            
        } catch (error) {
            console.error('Service Error - getClassStudents:', error);
            throw new Error(`Service Error - getClassStudents: ${error.message}`);
        }
    }

    async removeStudentFromClass(classId, studentId) {
        try {
            if (!classId) {
                throw new Error('classId is required');
            }
            
            if (!studentId) {
                throw new Error('studentId is required');
            }

            await this.repository.removeStudentFromClass(classId, studentId);

            return {
                success: true,
                message: 'Student removed from class successfully'
            };
            
        } catch (error) {
            console.error('Service Error - removeStudentFromClass:', error);
            throw new Error(`Service Error - removeStudentFromClass: ${error.message}`);
        }
    }

    async updateEnrollmentType(classId, studentId, payload = {}) {
        try {
            if (!classId) {
                throw new Error('classId is required');
            }

            if (!studentId) {
                throw new Error('studentId is required');
            }

            // Validate type if provided
            if (payload.hasOwnProperty('enrollment_type')) {
                const validTypes = ['regular', 'retake', 'improve'];
                if (!validTypes.includes(payload.enrollment_type)) {
                    throw new Error('Invalid enrollment_type. Must be: regular, retake, or improve');
                }
            }

            // Validate status if provided
            if (payload.hasOwnProperty('enrollment_status')) {
                const validStatuses = ['enrolled', 'dropped', 'completed'];
                if (!validStatuses.includes(payload.enrollment_status)) {
                    throw new Error('Invalid enrollment_status. Must be: enrolled, dropped, or completed');
                }
            }

            // Call repository to update
            await this.repository.updateEnrollmentType(classId, studentId, payload);

            return {
                success: true,
                message: 'Enrollment updated successfully'
            };

        } catch (error) {
            console.error('Service Error - updateEnrollmentType:', error);
            throw new Error(`Service Error - updateEnrollmentType: ${error.message}`);
        }
    }

    async getAvailableStudents(departmentId = null, options = {}) {
        try {
            const students = await this.repository.getAvailableStudents(departmentId, options);

            return {
                success: true,
                total: students.length,
                data: students.map(s => this.formatStudentData(s))
            };
            
        } catch (error) {
            console.error('Service Error - getAvailableStudents:', error);
            throw new Error(`Service Error - getAvailableStudents: ${error.message}`);
        }
    }

    // --- VALIDATION & FORMATTING ---

    validateClassData(classData) {
        if (!classData.class_code) {
            throw new Error('class_code is required');
        }
        if (!classData.course_id) {
            throw new Error('course_id is required');
        }
        if (!classData.semester_id) {
            throw new Error('semester_id is required');
        }
        if (!classData.lecturer_id) {
            throw new Error('lecturer_id is required');
        }
        if (!classData.start_date) {
            throw new Error('start_date is required');
        }
        if (!classData.end_date) {
            throw new Error('end_date is required');
        }

        const startDate = new Date(classData.start_date);
        const endDate = new Date(classData.end_date);
        
        if (endDate <= startDate) {
            throw new Error('end_date must be after start_date');
        }

        if (classData.class_type) {
            const validTypes = ['regular', 'online', 'hybrid'];
            if (!validTypes.includes(classData.class_type)) {
                throw new Error('class_type must be: regular, online, or hybrid');
            }
        }

        if (classData.class_status) {
            const validStatuses = ['planning', 'open', 'closed', 'in_progress', 'completed', 'cancelled'];
            if (!validStatuses.includes(classData.class_status)) {
                throw new Error('Invalid class_status');
            }
        }

        if (classData.max_capacity && classData.max_capacity < 1) {
            throw new Error('max_capacity must be at least 1');
        }
    }

    formatEnrollmentData(enrollmentData) {
    const student = enrollmentData.student || {};
    const user = student.user || {};
    const major = student.major || {};
    const department = major.department || {};
    
    return {
        enrollment_id: enrollmentData.enrollment_id,
        student_id: enrollmentData.student_id,
        
        student: {
            user_id: user.user_id || enrollmentData.student_id,
            username: user.username || '',
            student_code: student.student_code || '',
            name: user.full_name || `${user.last_name || ''} ${user.first_name || ''}`.trim(),
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            full_name: user.full_name || `${user.last_name || ''} ${user.first_name || ''}`.trim(),
            
            email: user.email || '',
            phone: user.phone || '',
            admission_year: student.admission_year || null,
            
            major: {
                major_id: major.major_id || null,
                major_code: major.major_code || '',
                major_name: major.major_name || '',
                department: {
                    department_id: department.department_id || null,
                    department_code: department.department_code || '',
                    department_name: department.department_name || ''
                }
            }
        },
        
        enrollment_status: enrollmentData.enrollment_status || 'enrolled',
        enrollment_type: enrollmentData.enrollment_type || 'regular',
        enrollment_date: enrollmentData.enrollment_date || null,
        drop_date: enrollmentData.drop_date || null,
        
        // Attendance
        attendance_rate: enrollmentData.attendance_rate || 0,
        
        // Grades
        grades: {
            mini: enrollmentData.mini_test_grade || enrollmentData.grades?.mini || null,
            assignment: enrollmentData.assignment_grade || enrollmentData.grades?.assignment || null,
            lab: enrollmentData.lab_work_grade || enrollmentData.grades?.lab || null,
            midterm: enrollmentData.midterm_grade || enrollmentData.grades?.midterm || null,
            final: enrollmentData.final_grade || enrollmentData.grades?.final || null,
            total: enrollmentData.total_grade || enrollmentData.grades?.total || null,
            letter: enrollmentData.letter_grade || enrollmentData.grades?.letter || null,
            gpa: enrollmentData.gpa_value || enrollmentData.grades?.gpa || null
        },
        
        notes: enrollmentData.notes || ''
    };
}

    formatStudentData(studentData) {
        const studentProfile = studentData.Student || {};
        const major = studentProfile.major || {};
        const department = major.department || {};
        
        return {
            user_id: studentData.user_id,
            username: studentData.username || '',
            
            name: studentData.full_name || `${studentData.last_name || ''} ${studentData.first_name || ''}`.trim(),
            first_name: studentData.first_name || '',
            last_name: studentData.last_name || '',
            full_name: studentData.full_name || `${studentData.last_name || ''} ${studentData.first_name || ''}`.trim(),
            email: studentData.email || '',
            
            student_code: studentProfile.student_code || '',
            admission_year: studentProfile.admission_year || null,
            student_status: studentProfile.student_status || 'active',
            
            major: {
                major_id: major.major_id || null,
                major_code: major.major_code || '',
                major_name: major.major_name || '',
                department: {
                    department_id: department.department_id || null,
                    department_code: department.department_code || '',
                    department_name: department.department_name || ''
                }
            }
        };
    }

    formatClassData(classData) {
        const rawData = classData.toJSON ? classData.toJSON() : classData;
        
        return {
            class_id: rawData.class_id,
            class_code: rawData.class_code,
            class_name: rawData.class_name,
            course: {
                course_id: rawData.course?.course_id,
                course_code: rawData.course?.course_code,
                course_name: rawData.course?.course_name,
                credits: rawData.course?.credits,
                department: {
                    department_id: rawData.course?.department?.department_id,
                    department_code: rawData.course?.department?.department_code,
                    department_name: rawData.course?.department?.department_name
                }
            },
            semester: {
                semester_id: rawData.semester?.semester_id,
                semester_code: rawData.semester?.semester_code,
                semester_name: rawData.semester?.semester_name,
                academic_year: rawData.semester?.academic_year
            },
            lecturer: {
                user_id: rawData.lecturer?.user_id,
                lecturer_code: rawData.lecturer?.lecturer_code,
                name: rawData.lecturer?.user?.full_name,
                email: rawData.lecturer?.user?.email
            },
            enrollment: {
                current: rawData.current_enrollment || 0,
                max: rawData.max_capacity || 0,
                available: (rawData.max_capacity || 0) - (rawData.current_enrollment || 0),
                percentage: rawData.max_capacity > 0 
                    ? Math.round(((rawData.current_enrollment || 0) / rawData.max_capacity) * 100) 
                    : 0
            },
            class_type: rawData.class_type,
            class_status: rawData.class_status,
            start_date: rawData.start_date,
            end_date: rawData.end_date,
            syllabus_url: rawData.syllabus_url,
            notes: rawData.notes,
            created_by: rawData.created_by,
            creator: rawData.creator ? {
                user_id: rawData.creator.user_id,
                name: rawData.creator.full_name
            } : null,
            created_at: rawData.created_at,
            updated_at: rawData.updated_at
        };
    }
}

module.exports = new ClassService();