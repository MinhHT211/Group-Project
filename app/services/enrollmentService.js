const EnrollmentRepository = require('../repositories/enrollmentRepository');

class EnrollmentService {
    constructor() {
        this.repository = EnrollmentRepository;
    }

    async getEnrollmentsByStudent(studentId, semesterId = null) {
        try {
            const enrollments = await this.repository.getEnrollmentsByStudent(studentId, semesterId);

            if(!enrollments || enrollments.length === 0) {
                return [];
            }
            const result = enrollments.map(enrollment => this.formatEnrollmentsByStudent(enrollment));
            return result;
        } catch(error) {
            throw new Error(`Service Error - getEnrollmentsByStudent: ${error.message}`);
        }
    }
    formatEnrollmentsByStudent(enrollmentInstance) {
        const enrollmentData = enrollmentInstance.toJSON();
        return {
            enrollment_id: enrollmentData.enrollment_id,
            student_id: enrollmentData.student_id,
            class_id: enrollmentData.class_id,
            enrollment_status: enrollmentData.enrollment_status,
            enrollment_type: enrollmentData.enrollment_type,
            enrollment_date: enrollmentData.enrollment_date,

            grades: {
                midterm: enrollmentData.midterm_grade,
                final: enrollmentData.final_grade,
                total: enrollmentData.total_grade,
                letter: enrollmentData.letter_grade,
                gpa: enrollmentData.gpa_value,
                passed: enrollmentData.is_passed
            },

            attendance: {
                total_sessions: enrollmentData.total_sessions,
                attended_sessions: enrollmentData.attended_sessions,
                rate: enrollmentData.attendance_rate
            },

            course: {
                course_id: enrollmentData.class?.course?.course_id,
                course_code: enrollmentData.class?.course?.course_code,
                course_name: enrollmentData.class?.course?.course_name,
                credits: enrollmentData.class?.course?.credits,
                course_type: enrollmentData.class?.course?.course_type,
                theory_hours: enrollmentData.class?.course?.theory_hours,
                practice_hours: enrollmentData.class?.course?.practice_hours,
            },

            class: {
                class_id: enrollmentData.class?.class_id,
                class_code: enrollmentData.class?.class_code,
                class_name: enrollmentData.class?.class_name,
                max_capacity: enrollmentData.class?.max_capacity,
                current_enrollment: enrollmentData.class?.current_enrollment
            },

            lecturer: {
                user_id: enrollmentData.class.lecturer.user_id,
                lecturer_code: enrollmentData.class.lecturer.lecturer_code,
                name: `${enrollmentData.class.lecturer.user.first_name} ${enrollmentData.class.lecturer.user.last_name}`,
                academic_rank: enrollmentData.class.lecturer.academic_rank,
                degree: enrollmentData.class.lecturer.degree,
                email: enrollmentData.class.lecturer.user.email
            },

            semester: {
                semester_id: enrollmentData.class.semester.semester_id,
                semester_code: enrollmentData.class.semester.semester_code,
                semester_name: enrollmentData.class.semester.semester_name,
                academic_year: enrollmentData.class.semester.academic_year,
                enrollment_date: enrollmentData.class.semester.enrollment_date,
            },
            notes: enrollmentData.notes,
            created_at: enrollmentData.created_at,
            updated_at: enrollmentData.updated_at
        }
    }
}
module.exports = new EnrollmentService();