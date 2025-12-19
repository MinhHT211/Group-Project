const DepartmentRepository = require('../repositories/departmentRepository');

class DepartmentService {
    constructor() {
        this.repository = DepartmentRepository;
    }

    async getAllDepartments(options = {}) {
        try {
            const result = await this.repository.getAllDepartments(options);

            if (!result.data || result.data.length === 0) {
                return {
                    ...result,
                    data: []
                };
            }

            result.data = result.data.map(dept => this.formatDepartmentData(dept));
            return result;
        } catch (error) {
            throw new Error(`Service Error - getAllDepartments: ${error.message}`);
        }
    }

    async getDepartmentById(departmentId) {
        try {
            const department = await this.repository.getDepartmentById(departmentId);

            if (!department) {
                throw new Error('Department not found');
            }

            return {
                success: true,
                data: this.formatDepartmentData(department)
            };
        } catch (error) {
            throw new Error(`Service Error - getDepartmentById: ${error.message}`);
        }
    }

    async createDepartment(departmentData) {
        try {
            this.validateDepartmentData(departmentData);

            const newDepartment = await this.repository.createDepartment(departmentData);

            return {
                success: true,
                message: 'Department created successfully',
                data: this.formatDepartmentData(newDepartment)
            };
        } catch (error) {
            throw new Error(`Service Error - createDepartment: ${error.message}`);
        }
    }

    async updateDepartment(departmentId, departmentData) {
        try {
            if (departmentData.email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(departmentData.email)) {
                    throw new Error('Invalid email format');
                }
            }

            const updatedDepartment = await this.repository.updateDepartment(
                departmentId,
                departmentData
            );

            return {
                success: true,
                message: 'Department updated successfully',
                data: this.formatDepartmentData(updatedDepartment)
            };
        } catch (error) {
            throw new Error(`Service Error - updateDepartment: ${error.message}`);
        }
    }

    async deleteDepartment(departmentId) {
        try {
            await this.repository.deleteDepartment(departmentId);

            return {
                success: true,
                message: 'Department deactivated successfully'
            };
        } catch (error) {
            throw new Error(`Service Error - deleteDepartment: ${error.message}`);
        }
    }

    async getAllDepartmentsSimple(is_active = true) {
        try {
            const departments = await this.repository.getAllDepartmentsSimple(is_active);
            
            return {
                success: true,
                data: departments
            };
        } catch (error) {
            throw new Error(`Service Error - getAllDepartmentsSimple: ${error.message}`);
        }
    }

    validateDepartmentData(departmentData) {
        if (!departmentData.department_code) {
            throw new Error('department_code is required');
        }
        if (!departmentData.department_name) {
            throw new Error('department_name is required');
        }

        if (departmentData.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(departmentData.email)) {
                throw new Error('Invalid email format');
            }
        }

        if (departmentData.phone) {
            const phoneRegex = /^[0-9\s\-\+\(\)]+$/;
            if (!phoneRegex.test(departmentData.phone)) {
                throw new Error('Invalid phone format');
            }
        }
    }

    formatDepartmentData(deptData) {
        const rawData = deptData.toJSON ? deptData.toJSON() : deptData;
        
        return {
            department_id: rawData.department_id,
            department_code: rawData.department_code,
            department_name: rawData.department_name,
            description: rawData.description || null,
            
            // Head lecturer info
            head_lecturer_id: rawData.head_lecturer_id || null,
            head_lecturer: rawData.head_lecturer ? {
                user_id: rawData.head_lecturer.user_id,
                name: rawData.head_lecturer.user?.full_name || 
                      `${rawData.head_lecturer.user?.last_name} ${rawData.head_lecturer.user?.first_name}`,
                email: rawData.head_lecturer.user?.email || null,
                phone: rawData.head_lecturer.user?.phone || null
            } : null,
            
            // Contact info
            phone: rawData.phone || null,
            email: rawData.email || null,
            location: rawData.location || null,
            
            // Statistics
            statistics: {
                lecturer_count: parseInt(rawData.lecturer_count) || 0,
                assistant_count: parseInt(rawData.assistant_count) || 0,
                major_count: parseInt(rawData.major_count) || 0
            },
            
            // Majors list (if included)
            majors: rawData.majors ? rawData.majors.map(major => ({
                major_id: major.major_id,
                major_code: major.major_code,
                major_name: major.major_name,
                is_active: major.is_active
            })) : [],
            
            // Status
            is_active: rawData.is_active,
            created_at: rawData.created_at,
            updated_at: rawData.updated_at
        };
    }
}
module.exports = new DepartmentService();