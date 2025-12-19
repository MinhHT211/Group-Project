const AssistantManagementRepository = require('../repositories/assistantManagementRepository');
const db = require("../models");
const { Assistants, Courses, Classes } = require('../models');

class AssistantManagementService {
    constructor() {
        this.repository = AssistantManagementRepository;
    }

    async getAllAssistants(options = {}) {
        try {
            const result = await this.repository.getAllAssistants(options);

            if (!result.data || result.data.length === 0) {
                return {
                    ...result,
                    data: []
                };
            }

            result.data = result.data.map(user => this.formatAssistantData(user));
            return result;
        } catch (error) {
            throw new Error(`Service Error - getAllAssistants: ${error.message}`);
        }
    }

    async getAssistantById(userId) {
        try {
            const assistant = await this.repository.getAssistantById(userId);

            if (!assistant) {
                throw new Error('Assistant not found');
            }

            return {
                success: true,
                data: this.formatAssistantData(assistant)
            };
        } catch (error) {
            throw new Error(`Service Error - getAssistantById: ${error.message}`);
        }
    }

    async createAssistant(userData, assistantData) {
        try {
            // Validate required fields
            this.validateUserData(userData);
            this.validateAssistantData(assistantData);

            const newAssistant = await this.repository.createAssistant(userData, assistantData);

            return {
                success: true,
                message: 'Assistant created successfully',
                data: this.formatAssistantData(newAssistant)
            };
        } catch (error) {
            throw new Error(`Service Error - createAssistant: ${error.message}`);
        }
    }

    async updateAssistant(userId, userData = {}, assistantData = {}) {
        try {
            // Validate password if provided
            if (userData.password && userData.password.length < 8) {
                throw new Error('Password must be at least 8 characters long');
            }

            const updatedAssistant = await this.repository.updateAssistant(
                userId,
                userData,
                assistantData
            );

            return {
                success: true,
                message: 'Assistant updated successfully',
                data: this.formatAssistantData(updatedAssistant)
            };
        } catch (error) {
            throw new Error(`Service Error - updateAssistant: ${error.message}`);
        }
    }

    async deleteAssistant(userId) {
        try {
            await this.repository.deleteAssistant(userId);

            return {
                success: true,
                message: 'Assistant deleted successfully (soft delete)'
            };
        } catch (error) {
            throw new Error(`Service Error - deleteAssistant: ${error.message}`);
        }
    }

    async restoreAssistant(userId) {
        try {
            const restored = await this.repository.restoreAssistant(userId);
            
            return {
                success: true,
                message: 'Assistant restored successfully',
                data: this.formatAssistantData(restored)
            };
        } catch (error) {
            throw new Error(`Service Error - restoreAssistant: ${error.message}`);
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

    validateAssistantData(assistantData) {
        if (!assistantData.assistant_code) {
            throw new Error('assistant_code is required');
        }
        if (!assistantData.department_id) {
            throw new Error('department_id is required');
        }
    }

    // Format data
    formatAssistantData(userData) {
        const rawAssistant = userData.Assistant || null;
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
            Assistant: rawAssistant,
            assistant: {
                assistant_code: rawAssistant?.assistant_code ?? null,
                academic_rank: rawAssistant?.academic_rank ?? null,
                degree: rawAssistant?.degree ?? null,
                office_room: rawAssistant?.office_room ?? null,
                office_hours: rawAssistant?.office_hours ?? null,
                bio: rawAssistant?.bio ?? null,
                department_id: rawAssistant?.department_id ?? null,
                department_code: rawAssistant?.department?.department_code ?? null,
                department_name: rawAssistant?.department?.department_name ?? null,
                is_active: typeof rawAssistant?.is_active === 'boolean' ? rawAssistant.is_active : (userData.is_active ?? false)
            },
            is_active: userData.is_active,
is_deleted: !!userData.is_deleted,
deleted_at: userData.deleted_at ? userData.deleted_at : null,
created_at: userData.created_at,
updated_at: userData.updated_at
        };
    }
    // GET ALL CLASSES FOR GRADE PAGE
    async getAllClasses() {
        try {
            const classes = await db.Classes.findAll({
                attributes: {
                    include: [
                        [
                            db.sequelize.literal(`(
                                SELECT COUNT(*)
                                FROM Enrollment AS e
                                WHERE e.class_id = Classes.class_id
                                AND e.enrollment_status = 'enrolled'
                            )`),
                            "student_count"
                        ]
                    ]
                },
                include: [
                    {
                        model: db.Courses,
                        as: "course",
                        attributes: ["course_code", "course_name"]
                    },
                    {
                        model: db.Lecturers,
                        as: "lecturer",
                        include: [
                            {
                                model: db.Users,
                                as: "user",
                                attributes: ["first_name", "last_name"]
                            }
                        ]
                    }
                ],
                raw: true
            });

            return { success: true, data: classes };

        } catch (err) {
            throw new Error("Service Error - getAllClasses: " + err.message);
        }
    }

    // GRADE MANAGEMENT
    async getAllClassesForGrade(req, res) {
        try {
            const result = await AssistantManagementService.getAllClasses();

            res.render("management/assistant/grade/class_list", {
                title: "Danh sách lớp",
                classes: result.data
            });
        } catch (e) {
            res.render("management/assistant/grade/class_list", {
                title: "Danh sách lớp",
                classes: [],
                message: "Error loading class list"
            });
        }
    }

    // Class Students with Grades
    async getStudentsByClassWithGrades(classId) {
        if (!classId) throw new Error("Class ID is required");

        const enrollments = await db.Enrollment.findAll({
            where: { class_id: classId },
            attributes: [
                "enrollment_id",
                "student_id",
                "class_id",
                "notes",
                "attendance_rate",
                "mini_test_grade",
                "assignment_grade",
                "lab_work_grade",
                "midterm_grade",
                "final_grade",
                "total_grade",
                "letter_grade",
                "gpa_value"
            ],

            include: [
                {
                    model: db.Students,
                    as: "student",
                    attributes: ["user_id", "student_code"],
                    include: [
                        { model: db.Users, as: "user" },
                        { model: db.Majors, as: "major" }
                    ]
                },
                {
                    model: db.Classes,
                    as: "class"
                }
            ]
        });

        const data = enrollments.map(e => ({
            enrollment_id: e.enrollment_id,
            student_id: e.student_id,
            class_id: e.class_id,
            student: e.student,
            class: e.class,
            mini_test_grade: e.mini_test_grade ?? "",
            assignment_grade: e.assignment_grade ?? "",
            lab_work_grade: e.lab_work_grade ?? "",

            grades_summary: {
                midterm: e.midterm_grade ?? "",
                final: e.final_grade ?? "",
                total: e.total_grade ?? "",
                letter: e.letter_grade ?? "N/A",
                gpa: e.gpa_value ?? ""
            },

            notes: e.notes ?? "",
            attendance_rate: e.attendance_rate ?? null, 
            attendance_display: e.attendance_rate
                ? Number(e.attendance_rate) * 0.2
                : 0
        }));

        return { success: true, data, count: data.length };
    }
    
    // IMPORT EXCEL
    async updateStudentGrades(classId, updates) {
    if (!classId) throw new Error("Class ID is required");

    for (const u of updates) {

        const enrollment = await db.Enrollment.findOne({
            where: {
                class_id: classId,
                student_id: u.studentId
            },
            attributes: ["attendance_rate"]
        });

        const weights = await this.getGradeWeights(classId);

        const scores = {
            attendance_rate: enrollment?.attendance_rate ?? null,
            mini_test: u.mini_test ?? null,
            assignment: u.assignment ?? null,
            lab_work: u.lab_work ?? null,
            midterm: u.midterm ?? null,
            final: u.final ?? null
        };

        const { total, letter, gpa } =
            this.calculateTotalAndGPA(scores, weights);

        await db.Enrollment.update(
            {
                mini_test_grade: scores.mini_test,
                assignment_grade: scores.assignment,
                lab_work_grade: scores.lab_work,
                midterm_grade: scores.midterm,
                final_grade: scores.final,

                total_grade: total,
                letter_grade: letter,
                gpa_value: gpa,

                notes: u.notes ?? null
            },
            {
                where: {
                    class_id: classId,
                    student_id: u.studentId
                }
            }
        );
    }

    return true;
}

            
    // BULK UPDATE GRADES (INLINE EDIT)
    async bulkUpdateGrades(updates) {

        const normalize = (v) =>
            v === "" || v === null || v === undefined ? null : Number(v);

        for (const enrollmentId of Object.keys(updates)) {

            const enrollment = await db.Enrollment.findByPk(enrollmentId);
            if (!enrollment) continue;

            const weights = await this.getGradeWeights(enrollment.class_id);
            const row = updates[enrollmentId];

            const scores = {
                attendance_rate: enrollment.attendance_rate ?? null,
                assignment: normalize(row.assignment_grade ?? enrollment.assignment_grade),
                mini_test: normalize(row.mini_test_grade ?? enrollment.mini_test_grade),
                lab_work: normalize(row.lab_work_grade ?? enrollment.lab_work_grade),
                midterm: normalize(row.midterm_grade ?? enrollment.midterm_grade),
                final: normalize(row.final_grade ?? enrollment.final_grade)
            };

            const { total, letter, gpa } =
                this.calculateTotalAndGPA(scores, weights);

            await db.Enrollment.update(
                {
                    assignment_grade: scores.assignment,
                    mini_test_grade: scores.mini_test,
                    lab_work_grade: scores.lab_work,
                    midterm_grade: scores.midterm,
                    final_grade: scores.final,

                    total_grade: total,
                    letter_grade: letter,
                    gpa_value: gpa,

                    notes: row.notes ?? enrollment.notes
                },
                { where: { enrollment_id: enrollmentId } }
            );
        }

        return true;
    }


    // GET CLASSES BY ASSISTANT'S DEPARTMENT
    async getClassesByAssistant(assistantId) {
        const assistant = await Assistants.findOne({
            where: { user_id: assistantId }
        });

        if (!assistant) {
            throw new Error("Assistant not found");
        }

        const departmentId = assistant.department_id;

        // Lấy tất cả khóa học thuộc khoa
        const courses = await Courses.findAll({
            where: { department_id: departmentId },
            attributes: ['course_id']
        });

        const courseIds = courses.map(c => c.course_id);

        // Lấy tất cả lớp thuộc những khóa học đó
        const classes = await Classes.findAll({
            where: {
                course_id: courseIds
            },
            include: [
                {
                    model: Courses,
                    as: 'course',
                    attributes: ['course_name', 'course_code']
                }
            ]
        });

        return classes;
    }

    // GET GRADE WEIGHTS
    async getGradeWeights(classId) {
        const components = await db.GradeComponents.findAll({
            where: { class_id: classId, is_active: 1 }
        });

        const weights = {};
        components.forEach(c => {
            weights[c.component_type] = Number(c.weight);
        });

        return weights;
    }


    // CALCULATE TOTAL & GPA
    calculateTotalAndGPA(scores, weights) {
        let total = 0;

        const add = (value, weight) => {
            if (value == null || weight == null) return;
            total += Number(value) * Number(weight);
        };

        if (scores.attendance_rate != null && weights.attendance) {
            const attendance20 =
                (Number(scores.attendance_rate) / 100) * 20;
            add(attendance20, weights.attendance);
        }

        add(scores.assignment, weights.assignment);
        add(scores.mini_test, weights.mini_test);
        add(scores.lab_work, weights.lab_work);
        add(scores.midterm, weights.exam_midterm);
        add(scores.final, weights.exam_final);

        total = Math.min(Number(total.toFixed(2)), 20);

        let letter = "F", gpa = 0, notes = "Fail";

        if (total >= 18) { letter = "A+"; gpa = 4.0; }
        else if (total >= 16) { letter = "A"; gpa = 3.7;  notes = "Pass"; }
        else if (total >= 14) { letter = "B+"; gpa = 3.5; notes = "Pass"; }
        else if (total >= 13) { letter = "B"; gpa = 3.0; notes = "Pass"; }
        else if (total >= 12) { letter = "C+"; gpa = 2.5; notes = "Pass"; }
        else if (total >= 11) { letter = "C"; gpa = 2.0;  notes = "Pass"; }
        else if (total >= 10) { letter = "D"; gpa = 1.5; notes = "Pass"; }

        return { total, letter, gpa, notes };
    }

    // UPDATE GRADE WEIGHTS & RECALCULATE
    async updateGradeWeightsAndRecalculate(classId, components) {
    if (!classId) throw new Error("Class ID is required");
    if (!Array.isArray(components) || components.length === 0) {
        throw new Error("No weight data provided");
    }

    let totalWeight = 0;
    components.forEach(c => {
        totalWeight += Number(c.weight || 0);
    });

    if (Math.abs(totalWeight - 1) > 0.001) {
        throw new Error("Total weight must be 1");
    }

    const transaction = await db.sequelize.transaction();

    try {
        for (const c of components) {
            await db.GradeComponents.update(
                {
                    weight: Number(c.weight),
                    is_active: c.is_active ?? 1
                },
                {
                    where: {
                        component_id: c.component_id,
                        class_id: classId
                    },
                    transaction
                }
            );
        }

        const componentsInDb = await db.GradeComponents.findAll({
            where: { class_id: classId, is_active: 1 },
            transaction
        });

        const weights = {};
        componentsInDb.forEach(c => {
            weights[c.component_type] = Number(c.weight);
        });

        const enrollments = await db.Enrollment.findAll({
            where: { class_id: classId },
            transaction
        });

        for (const e of enrollments) {

            const hasAnyScore =
                e.attendance_rate != null ||
                e.assignment_grade != null ||
                e.mini_test_grade != null ||
                e.lab_work_grade != null ||
                e.midterm_grade != null ||
                e.final_grade != null;

            if (!hasAnyScore) continue;

            const scores = {
                attendance_rate: e.attendance_rate,
                assignment: e.assignment_grade,
                mini_test: e.mini_test_grade,
                lab_work: e.lab_work_grade,
                midterm: e.midterm_grade,
                final: e.final_grade
            };

            const { total, letter, gpa } =
                this.calculateTotalAndGPA(scores, weights);

            await db.Enrollment.update(
                {
                    total_grade: total,
                    letter_grade: letter,
                    gpa_value: gpa
                },
                {
                    where: { enrollment_id: e.enrollment_id },
                    transaction
                }
            );
        }

        await transaction.commit();
        return true;

    } catch (err) {
        await transaction.rollback();
        throw new Error("Update weights & recalc failed: " + err.message);
    }
}


    // RECALCULATE GRADES FOR ENTIRE CLASS
    async recalculateGradesByClass(classId) {
        if (!classId) throw new Error("Class ID is required");

        const weights = await this.getGradeWeights(classId);

        const enrollments = await db.Enrollment.findAll({
            where: { class_id: classId }
        });

        for (const e of enrollments) {

            // 🔥 FIX: attendance cũng được tính
            const hasAnyScore =
                e.attendance_rate != null ||
                e.assignment_grade != null ||
                e.mini_test_grade != null ||
                e.lab_work_grade != null ||
                e.midterm_grade != null ||
                e.final_grade != null;

            if (!hasAnyScore) continue;

            const scores = {
                attendance_rate: e.attendance_rate ?? null,
                assignment: e.assignment_grade,
                mini_test: e.mini_test_grade,
                lab_work: e.lab_work_grade,
                midterm: e.midterm_grade,
                final: e.final_grade
            };

            const { total, letter, gpa } =
                this.calculateTotalAndGPA(scores, weights);

            await db.Enrollment.update(
                {
                    total_grade: total,
                    letter_grade: letter,
                    gpa_value: gpa
                },
                { where: { enrollment_id: e.enrollment_id } }
            );
        }

        return true;
    }


}

module.exports = new AssistantManagementService()