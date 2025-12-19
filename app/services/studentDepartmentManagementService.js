const StudentDepartmentManagementRepository = require('../repositories/studentDepartmentManagementRepository');
class StudentDepartmentManagementService {
    constructor() {
        this.repository = StudentDepartmentManagementRepository;
    }

    async getStudentsByDepartment(departmentId, options = {}) {
        try {
            const result = await this.repository.getStudentsByDepartment(departmentId, options);

            if (!result.data || result.data.length === 0) {
                return {
                    ...result,
                    data: []
                };
            }

            result.data = result.data.map(user => this.formatStudentData(user));
            return result;
        } catch (error) {
            throw new Error(`Service Error - getStudentsByDepartment: ${error.message}`);
        }
    }

    async getStudentById(userId, departmentId = null) {
        try {
            const student = await this.repository.getStudentById(userId, departmentId);

            if (!student) {
                throw new Error('Student not found');
            }

            return {
                success: true,
                data: this.formatStudentData(student)
            };
        } catch (error) {
            throw new Error(`Service Error - getStudentById: ${error.message}`);
        }
    }

    async createStudent(userData, studentData, departmentId) {
        try {
            // Validate required fields
            this.validateUserData(userData);
            this.validateStudentData(studentData);

            const newStudent = await this.repository.createStudent(
                userData, 
                studentData, 
                departmentId
            );

            return {
                success: true,
                message: 'Student created successfully',
                data: this.formatStudentData(newStudent)
            };
        } catch (error) {
            throw new Error(`Service Error - createStudent: ${error.message}`);
        }
    }

    async updateStudent(userId, userData = {}, studentData = {}, departmentId) {
        try {
            // Validate password if provided
            if (userData.password && userData.password.length < 8) {
                throw new Error('Password must be at least 8 characters long');
            }

            const updatedStudent = await this.repository.updateStudent(
                userId,
                userData,
                studentData,
                departmentId
            );

            return {
                success: true,
                message: 'Student updated successfully',
                data: this.formatStudentData(updatedStudent)
            };
        } catch (error) {
            throw new Error(`Service Error - updateStudent: ${error.message}`);
        }
    }

    async deleteStudent(userId, departmentId) {
        try {
            await this.repository.deleteStudent(userId, departmentId);

            return {
                success: true,
                message: 'Student deleted successfully (soft delete)'
            };
        } catch (error) {
            throw new Error(`Service Error - deleteStudent: ${error.message}`);
        }
    }

    async restoreStudent(userId) {
        try {
            const restored = await this.repository.restoreStudent(userId);
            
            return {
                success: true,
                message: 'Student restored successfully',
                data: this.formatStudentData(restored)
            };
        } catch (error) {
            throw new Error(`Service Error - restoreStudent: ${error.message}`);
        }
    }

    // Validation helpers
    validateUserData(userData) {
        if (!userData.username) throw new Error('username is required');
        if (!userData.password) throw new Error('password is required');
        if (!userData.first_name) throw new Error('first_name is required');
        if (!userData.last_name) throw new Error('last_name is required');
        if (!userData.email) throw new Error('email is required');

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userData.email)) {
            throw new Error('Invalid email format');
        }

        // Validate password strength
        if (userData.password.length < 8) {
            throw new Error('Password must be at least 8 characters long');
        }
    }

    validateStudentData(studentData) {
        if (!studentData.student_code) {
            throw new Error('student_code is required');
        }
        if (!studentData.major_id) {
            throw new Error('major_id is required');
        }
        if (!studentData.admission_year) {
            throw new Error('admission_year is required');
        }
    }

    // Format data
    formatStudentData(userData) {
        return {
            user_id: userData.user_id,
            username: userData.username,
            name: userData.full_name || `${userData.last_name} ${userData.first_name}`,
            first_name: userData.first_name,
            last_name: userData.last_name,
            full_name: userData.full_name,
            email: userData.email,
            date_of_birth: userData.date_of_birth,
            gender: userData.gender,
            phone: userData.phone,
            address: userData.address,
            avatar_url: userData.avatar_url,
            student: {
                student_code: userData.Student?.student_code || null,
                admission_year: userData.Student?.admission_year || null,
                expected_graduation_year: userData.Student?.expected_graduation_year || null,
                student_status: userData.Student?.student_status || null,
                major_id: userData.Student?.major_id || null,
                major_code: userData.Student?.major?.major_code || null,
                major_name: userData.Student?.major?.major_name || null,
                degree_type: userData.Student?.major?.degree_type || null,
                department_id: userData.Student?.major?.department?.department_id || null,
                department_code: userData.Student?.major?.department?.department_code || null,
                department_name: userData.Student?.major?.department?.department_name || null,
                academic_advisor_id: userData.Student?.academic_advisor_id || null,
                // academic_advisor_name: userData.Student?.academicAdvisor?.user?.full_name || null
                academic_advisor_name: userData.Student?.lecturer?.user?.full_name || null

            },
            role: userData.user_role?.role?.role_name || 'student',
            is_active: userData.is_active,
            is_deleted: !!userData.is_deleted,
            deleted_at: userData.deleted_at ? userData.deleted_at : null,
            created_at: userData.created_at,
            updated_at: userData.updated_at
        };
    }
}

module.exports = new StudentDepartmentManagementService();
