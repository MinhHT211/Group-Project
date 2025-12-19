const CourseRepository = require('../repositories/courseRepository');

class CourseService {
    constructor() {
        this.repository = CourseRepository;
    }

    async getAllCourses(options = {}, userDepartmentId = null, lecturerId = null) {
        try {
            // If user has department, only show their department's courses by default
            if (userDepartmentId && !options.department_id) {
                options.department_id = userDepartmentId;
            }

            const result = await this.repository.getAllCourses(options, lecturerId);

            if (!result.data || result.data.length === 0) {
                return {
                    ...result,
                    data: []
                };
            }

            result.data = result.data.map(course => this.formatCourseData(course));
            return result;
        } catch (error) {
            throw new Error(`Service Error - getAllCourses: ${error.message}`);
        }
    }

    async getCourseById(courseId) {
        try {
            const course = await this.repository.getCourseById(courseId);

            if (!course) {
                throw new Error('Course not found');
            }

            return {
                success: true,
                data: this.formatCourseData(course)
            };
        } catch (error) {
            throw new Error(`Service Error - getCourseById: ${error.message}`);
        }
    }

    async createCourse(courseData, creatorDepartmentId = null) {
        try {
            if (creatorDepartmentId && !courseData.department_id) {
                courseData.department_id = creatorDepartmentId;
            }
            this.validateCourseData(courseData);

            const newCourse = await this.repository.createCourse(
                courseData,
                creatorDepartmentId
            );

            return {
                success: true,
                message: 'Course created successfully',
                data: this.formatCourseData(newCourse)
            };
        } catch (error) {
            throw new Error(`Service Error - createCourse: ${error.message}`);
        }
    }

    async updateCourse(courseId, courseData, updaterDepartmentId = null) {
        try {
            const updatedCourse = await this.repository.updateCourse(
                courseId,
                courseData,
                updaterDepartmentId
            );

            return {
                success: true,
                message: 'Course updated successfully',
                data: this.formatCourseData(updatedCourse)
            };
        } catch (error) {
            throw new Error(`Service Error - updateCourse: ${error.message}`);
        }
    }

    async deleteCourse(courseId, deleterDepartmentId = null) {
        try {
            await this.repository.deleteCourse(courseId, deleterDepartmentId);

            return {
                success: true,
                message: 'Course deactivated successfully'
            };
        } catch (error) {
            throw new Error(`Service Error - deleteCourse: ${error.message}`);
        }
    }

    async getCoursesSimple(options = {}, userDepartmentId = null, lecturerId = null) {
        try {
            // If user has department, only show their department's courses by default
            if (userDepartmentId && !options.department_id) {
                options.department_id = userDepartmentId;
            }

            const courses = await this.repository.getCoursesSimple(options, lecturerId);
            
            return {
                success: true,
                data: courses
            };
        } catch (error) {
            throw new Error(`Service Error - getCoursesSimple: ${error.message}`);
        }
    }

    validateCourseData(courseData) {
        if (!courseData.course_code) {
            throw new Error('course_code is required');
        }
        if (!courseData.course_name) {
            throw new Error('course_name is required');
        }
        if (!courseData.department_id) {
            throw new Error('department_id is required');
        }
        if (!courseData.credits || courseData.credits <= 0) {
            throw new Error('credits must be greater than 0');
        }
        if (!courseData.course_type) {
            throw new Error('course_type is required');
        }

        const validCourseTypes = ['mandatory', 'elective', 'general'];
        if (!validCourseTypes.includes(courseData.course_type)) {
            throw new Error('course_type must be: mandatory, elective, or general');
        }

        if (courseData.level) {
            const validLevels = ['beginner', 'intermediate', 'advanced'];
            if (!validLevels.includes(courseData.level)) {
                throw new Error('level must be: beginner, intermediate, or advanced');
            }
        }
    }

    formatCourseData(courseData) {
        const rawData = courseData.toJSON ? courseData.toJSON() : courseData;
        
        return {
            course_id: rawData.course_id,
            course_code: rawData.course_code,
            course_name: rawData.course_name,
            credits: rawData.credits,
            theory_hours: rawData.theory_hours,
            practice_hours: rawData.practice_hours,
            total_hours: (rawData.theory_hours || 0) + (rawData.practice_hours || 0),
            course_type: rawData.course_type,
            level: rawData.level,
            description: rawData.description,
            learning_outcomes: rawData.learning_outcomes,
            department: {
                department_id: rawData.department?.department_id || rawData.department_id,
                department_code: rawData.department?.department_code || null,
                department_name: rawData.department?.department_name || null
            },
            is_active: rawData.is_active,
            created_at: rawData.created_at,
            updated_at: rawData.updated_at
        };
    }
}

module.exports = new CourseService();