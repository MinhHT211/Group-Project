const SemesterRepository = require('../repositories/semesterRepository');

class SemesterService {
    constructor() {
        this.repository = SemesterRepository;
    }

    async getAllSemesters(options = {}, lecturerId = null) {
        try {
            const result = await this.repository.getAllSemesters(options, lecturerId);

            if (!result.data || result.data.length === 0) {
                return {
                    ...result,
                    data: []
                };
            }

            return result;
        } catch (error) {
            throw new Error(`Service Error - getAllSemesters: ${error.message}`);
        }
    }

    async getSemesterById(semesterId) {
        try {
            const semester = await this.repository.getSemesterById(semesterId);

            if (!semester) {
                throw new Error('Semester not found');
            }

            return {
                success: true,
                data: semester
            };
        } catch (error) {
            throw new Error(`Service Error - getSemesterById: ${error.message}`);
        }
    }

    async createSemester(semesterData) {
        try {
            this.validateSemesterData(semesterData);

            const newSemester = await this.repository.createSemester(semesterData);

            return {
                success: true,
                message: 'Semester created successfully',
                data: newSemester
            };
        } catch (error) {
            throw new Error(`Service Error - createSemester: ${error.message}`);
        }
    }

    async updateSemester(semesterId, semesterData) {
        try {
            const updatedSemester = await this.repository.updateSemester(
                semesterId,
                semesterData
            );

            return {
                success: true,
                message: 'Semester updated successfully',
                data: updatedSemester
            };
        } catch (error) {
            throw new Error(`Service Error - updateSemester: ${error.message}`);
        }
    }

    async deleteSemester(semesterId) {
        try {
            await this.repository.deleteSemester(semesterId);

            return {
                success: true,
                message: 'Semester deleted successfully'
            };
        } catch (error) {
            throw new Error(`Service Error - deleteSemester: ${error.message}`);
        }
    }

    async getActiveSemester() {
        try {
            const semester = await this.repository.getActiveSemester();

            return {
                success: true,
                data: semester
            };
        } catch (error) {
            throw new Error(`Service Error - getActiveSemester: ${error.message}`);
        }
    }

    async getSemestersSimple() {
        try {
            const semesters = await this.repository.getSemestersSimple();
            
            return {
                success: true,
                data: semesters
            };
        } catch (error) {
            throw new Error(`Service Error - getSemestersSimple: ${error.message}`);
        }
    }

    validateSemesterData(semesterData) {
        if (!semesterData.semester_code) {
            throw new Error('semester_code is required');
        }
        if (!semesterData.semester_name) {
            throw new Error('semester_name is required');
        }
        if (!semesterData.academic_year) {
            throw new Error('academic_year is required');
        }
        if (!semesterData.enrollment_date) {
            throw new Error('enrollment_date is required');
        }
    }
}

module.exports = new SemesterService();