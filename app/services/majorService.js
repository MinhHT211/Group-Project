const MajorRepository = require('../repositories/majorRepository');

class MajorService {
    constructor() {
        this.repository = MajorRepository;
    }

    async getAllMajors(options = {}) {
        try {
            const result = await this.repository.getAllMajors(options);

            if (!result.data || result.data.length === 0) {
                return {
                    ...result,
                    data: []
                };
            }

            result.data = result.data.map(major => this.formatMajorData(major));
            return result;
        } catch (error) {
            throw new Error(`Service Error - getAllMajors: ${error.message}`);
        }
    }

    async getMajorById(majorId) {
        try {
            const major = await this.repository.getMajorById(majorId);

            if (!major) {
                throw new Error('Major not found');
            }

            return {
                success: true,
                data: this.formatMajorData(major)
            };
        } catch (error) {
            throw new Error(`Service Error - getMajorById: ${error.message}`);
        }
    }

    async getMajorsByDepartment(departmentId, options = {}) {
        try {
            const majors = await this.repository.getMajorsByDepartment(departmentId, options);

            return {
                success: true,
                data: majors.map(major => this.formatMajorData(major))
            };
        } catch (error) {
            throw new Error(`Service Error - getMajorsByDepartment: ${error.message}`);
        }
    }

    async createMajor(majorData) {
        try {
            this.validateMajorData(majorData);

            const newMajor = await this.repository.createMajor(majorData);

            return {
                success: true,
                message: 'Major created successfully',
                data: this.formatMajorData(newMajor)
            };
        } catch (error) {
            throw new Error(`Service Error - createMajor: ${error.message}`);
        }
    }

    async updateMajor(majorId, majorData) {
        try {
            if (majorData.required_credits !== undefined) {
                if (majorData.required_credits < 0 || majorData.required_credits > 200) {
                    throw new Error('Required credits must be between 0 and 200');
                }
            }

            if (majorData.duration_years !== undefined) {
                if (majorData.duration_years < 1 || majorData.duration_years > 10) {
                    throw new Error('Duration years must be between 1 and 10');
                }
            }

            const updatedMajor = await this.repository.updateMajor(majorId, majorData);

            return {
                success: true,
                message: 'Major updated successfully',
                data: this.formatMajorData(updatedMajor)
            };
        } catch (error) {
            throw new Error(`Service Error - updateMajor: ${error.message}`);
        }
    }

    async deleteMajor(majorId) {
        try {
            await this.repository.deleteMajor(majorId);

            return {
                success: true,
                message: 'Major deactivated successfully'
            };
        } catch (error) {
            throw new Error(`Service Error - deleteMajor: ${error.message}`);
        }
    }

    async getMajorsSimple(options = {}) {
        try {
            const majors = await this.repository.getMajorsSimple(options);
            
            return {
                success: true,
                data: majors
            };
        } catch (error) {
            throw new Error(`Service Error - getMajorsSimple: ${error.message}`);
        }
    }

    validateMajorData(majorData) {
        if (!majorData.major_code) {
            throw new Error('major_code is required');
        }
        if (!majorData.major_name) {
            throw new Error('major_name is required');
        }
        if (!majorData.department_id) {
            throw new Error('department_id is required');
        }

        const validDegreeTypes = ['Bachelor', 'Master', 'PhD'];
        if (majorData.degree_type && !validDegreeTypes.includes(majorData.degree_type)) {
            throw new Error(`degree_type must be one of: ${validDegreeTypes.join(', ')}`);
        }

        if (majorData.required_credits !== undefined) {
            if (majorData.required_credits < 0 || majorData.required_credits > 200) {
                throw new Error('Required credits must be between 0 and 200');
            }
        }

        if (majorData.duration_years !== undefined) {
            if (majorData.duration_years < 1 || majorData.duration_years > 10) {
                throw new Error('Duration years must be between 1 and 10');
            }
        }
    }

    formatMajorData(majorData) {
        const rawData = majorData.toJSON ? majorData.toJSON() : majorData;
        
        return {
            major_id: rawData.major_id,
            major_code: rawData.major_code,
            major_name: rawData.major_name,
            
            // Department info
            department_id: rawData.department_id,
            department: rawData.department ? {
                department_id: rawData.department.department_id,
                department_code: rawData.department.department_code,
                department_name: rawData.department.department_name,
                is_active: rawData.department.is_active
            } : null,
            
            // Program details
            degree_type: rawData.degree_type || 'Bachelor',
            required_credits: rawData.required_credits || 120,
            duration_years: rawData.duration_years || 4,
            description: rawData.description || null,
            
            // Statistics
            student_count: parseInt(rawData.student_count) || 0,
            
            // Status
            is_active: rawData.is_active,
            created_at: rawData.created_at,
            updated_at: rawData.updated_at
        };
    }
}
module.exports = new MajorService();