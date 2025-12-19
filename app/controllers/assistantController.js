const navigation = require('../config/navigation');
const LecturerManagementService = require('../services/lecturerManagementService');
const StudentDepartmentManagementService = require('../services/studentDepartmentManagementService');
const db = require("../models"); 
const ExcelJS = require('exceljs');
const assistantManagementService = require("../services/assistantManagementService");
const { parseErrorMessage } = require('../utils/errorHelper');

class AssistantController {
    constructor() {
        this.lecturerService = LecturerManagementService;
        this.studentService = StudentDepartmentManagementService;
    }

    index = (req, res) => {
        res.render('management/assistant/index', {
            layout: 'layouts/management',
            title: 'Assistant Dashboard',
            role: 'assistant',
            navItems: navigation.assistant,
            user: req.user || {
                name: 'Assistant User',
                avatar: '/images/avatar_default.png',
                roleKey: 'assistant',
                roleText: 'Assistant Department'
            }
        });
    }

    getSchedule = (req, res) => {
        res.render('management/assistant/timetable', {
            layout: 'layouts/management',
            pageJS: '/js/modules/common/timetable.js', 
            pageCSS: '/css/modules/management/common/_timetable.css',
            title: 'Schedule Manage',
            role: 'assistant',
            navItems: navigation.assistant,
            user: req.user
        });
    }

    getLecturerPage = (req, res) => {
        res.render('management/assistant/lecturer', {
            layout: 'layouts/management',
            pageJS: '/js/modules/assistant/lecturer.js', 
            pageCSS: '/css/modules/management/assistant/lecturer.css',
            title: 'Lecturer Manage',
            role: 'assistant',
            navItems: navigation.assistant,
            user: req.user
        });
    }

    getStudent = (req, res) => {
        res.render('management/assistant/student', {
            layout: 'layouts/management',
            title: 'Student Manage',
            role: 'assistant',
            navItems: navigation.assistant,
            pageCSS: '/css/modules/management/assistant/studentmanage.css',
            pageJS: '/js/modules/assistant/studentmanage.js',
            user: req.user
        });
    }

    getStudentCreatePage = (req, res) => {
        res.render('management/assistant/student_create', {
            layout: 'layouts/management',
            title: 'Create Student',
            role: 'assistant',
            navItems: navigation.assistant,
            pageCSS: '/css/modules/management/assistant/studentCreate.css',
            pageJS: '/js/modules/assistant/studentCreate.js',
            user: req.user,
            departmentId: req.user?.Assistant?.department_id || ''
        });
    }

    getStudentEditPage = (req, res) => {
        res.render('management/assistant/student_edit', {
            layout: 'layouts/management',
            title: 'Edit Student',
            role: 'assistant',
            navItems: navigation.assistant,
            pageCSS: '/css/modules/management/assistant/studentEdit.css',
            pageJS: '/js/modules/assistant/studentEdit.js',
            user: req.user,
            departmentId: req.user?.Assistant?.department_id || ''
        });
    }

    getChangePassword = (req, res) => {
        res.render('components/change_password', {
            layout: 'layouts/management',
            title: 'Change Password',
            pageJS: '/js/components/change_password.js',
            pageCSS: '/css/modules/auth/change_password.css',
            role: 'assistant',
            navItems: navigation.assistant,
            user: req.user
        });
    }

    // ===== LECTURER MANAGEMENT =====
    getLecturers = async (req, res) => {
        try {
            const departmentId = req.user?.Assistant?.department_id || null;

            if (!departmentId) {
                return res.status(403).json({
                    success: false,
                    message: 'Department information not found'
                });
            }

            const { page, limit, search, is_active, academic_rank } = req.query;
            const options = {
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 20,
                search: search || null,
                is_active: is_active !== undefined ? is_active === 'true' : null,
                academic_rank: academic_rank || null
            };

            const result = await this.lecturerService.getLecturersByDepartment(
                departmentId,
                options
            );
            return res.status(200).json(result);
        } catch (error) {
            console.error('Controller Error - getLecturers:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: parseErrorMessage(error)
            });
        }
    }

    getLecturerById = async (req, res) => {
        try {
            const userId = parseInt(req.params.userId);
            const departmentId = req.user?.Assistant?.department_id;

            if (!userId || isNaN(userId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID'
                });
            }

            if (!departmentId) {
                return res.status(403).json({
                    success: false,
                    message: 'Department information not found'
                });
            }

            const result = await this.lecturerService.getLecturerById(userId);

            if (result.data.lecturer.department_id !== departmentId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Lecturer does not belong to your department'
                });
            }

            return res.status(200).json(result);
        } catch (error) {
            console.error('Controller Error - getLecturerById:', error);
            const errorMessage = parseErrorMessage(error);
            
            if (error.message.includes('not found')) {
                return res.status(404).json({
                    success: false,
                    message: errorMessage
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: errorMessage
            });
        }
    }

    // ===== STUDENT MANAGEMENT =====
    getStudents = async (req, res) => {
        try {
            const departmentId = req.user?.Assistant?.department_id;

            if (!departmentId) {
                return res.status(403).json({
                    success: false,
                    message: 'Department information not found'
                });
            }

            const { 
                page, 
                limit, 
                search, 
                major_id, 
                major_code,
                admission_year, 
                student_status,
                is_active 
            } = req.query;

            const options = {
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 20,
                search: search || null,
                major_id: major_id ? parseInt(major_id) : null,
                major_code: major_code || null,                       
                admission_year: admission_year ? parseInt(admission_year) : null,
                student_status: student_status || null,
                is_active: is_active !== undefined ? is_active === 'true' : null,
                include_deleted: true
            };

            const result = await this.studentService.getStudentsByDepartment(
                departmentId,
                options
            );
            return res.status(200).json(result);
        } catch (error) {
            console.error('Controller Error - getStudents:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: parseErrorMessage(error)
            });
        }
    }

    getStudentById = async (req, res) => {
        try {
            const userId = parseInt(req.params.userId);
            const departmentId = req.user?.Assistant?.department_id;

            if (!userId || isNaN(userId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID'
                });
            }

            if (!departmentId) {
                return res.status(403).json({
                    success: false,
                    message: 'Department information not found'
                });
            }

            const result = await this.studentService.getStudentById(
                userId,
                departmentId
            );
            return res.status(200).json(result);
        } catch (error) {
            console.error('Controller Error - getStudentById:', error);
            const errorMessage = parseErrorMessage(error);
            
            if (error.message.includes('not found')) {
                return res.status(404).json({
                    success: false,
                    message: errorMessage
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: errorMessage
            });
        }
    }

    createStudent = async (req, res) => {
        try {
            const departmentId = req.user?.Assistant?.department_id;

            if (!departmentId) {
                return res.status(403).json({
                    success: false,
                    message: 'Department information not found'
                });
            }

            const { userData, studentData } = req.body;

            if (!userData || !studentData) {
                return res.status(400).json({
                    success: false,
                    message: 'userData and studentData are required'
                });
            }

            const result = await this.studentService.createStudent(
                userData,
                studentData,
                departmentId
            );
            return res.status(201).json(result);
        } catch (error) {
            console.error('Controller Error - createStudent:', error);
            const errorMessage = parseErrorMessage(error);

            if (error.message.includes('required') || 
                error.message.includes('Invalid') ||
                error.message.includes('already exists') ||
                error.message.includes('does not belong')) {
                return res.status(400).json({
                    success: false,
                    message: errorMessage
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: errorMessage
            });
        }
    }

    updateStudent = async (req, res) => {
        try {
            const userId = parseInt(req.params.userId);
            const departmentId = req.user?.Assistant?.department_id;

            if (!userId || isNaN(userId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID'
                });
            }

            if (!departmentId) {
                return res.status(403).json({
                    success: false,
                    message: 'Department information not found'
                });
            }

            const { userData = {}, studentData = {} } = req.body;

            if (Object.keys(userData).length === 0 && Object.keys(studentData).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No update data provided'
                });
            }

            const result = await this.studentService.updateStudent(
                userId,
                userData,
                studentData,
                departmentId
            );
            return res.status(200).json(result);
        } catch (error) {
            console.error('Controller Error - updateStudent:', error);
            const errorMessage = parseErrorMessage(error);

            if (error.message.includes('not found') || 
                error.message.includes('does not belong')) {
                return res.status(404).json({
                    success: false,
                    message: errorMessage
                });
            }

            if (error.message.includes('required') || 
                error.message.includes('Invalid') ||
                error.message.includes('already exists')) {
                return res.status(400).json({
                    success: false,
                    message: errorMessage
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: errorMessage
            });
        }
    }

    deleteStudent = async (req, res) => {
        try {
            const userId = parseInt(req.params.userId);
            const departmentId = req.user?.Assistant?.department_id;

            if (!userId || isNaN(userId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID'
                });
            }

            if (!departmentId) {
                return res.status(403).json({
                    success: false,
                    message: 'Department information not found'
                });
            }

            const result = await this.studentService.deleteStudent(
                userId,
                departmentId
            );
            return res.status(200).json(result);
        } catch (error) {
            console.error('Controller Error - deleteStudent:', error);
            const errorMessage = parseErrorMessage(error);

            if (error.message.includes('not found') || 
                error.message.includes('does not belong')) {
                return res.status(404).json({
                    success: false,
                    message: errorMessage
                });
            }

            if (error.message.includes('Cannot delete') ||
                error.message.includes('active enrollments')) {
                return res.status(400).json({
                    success: false,
                    message: errorMessage
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: errorMessage
            });
        }
    }

     restoreStudent = async (req, res) => {
        try {
            const userId = parseInt(req.params.userId);
            const result = await this.studentService.restoreStudent(userId);
            return res.status(200).json(result);
        } catch (error) {
            console.error('Controller Error - restoreStudent:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: parseErrorMessage(error)
            });
        }
    }


    // ===== GRADE MANAGEMENT - CLASS LIST =====
    async getAllClassesForGrade(req, res) {
        try {
            const assistantId = req.user.user_id;
            const classes = await assistantManagementService.getClassesByAssistant(assistantId);

            return res.render("management/assistant/grade/class_list", {
                layout: "layouts/management",
                title: "Quản lý điểm - Danh sách lớp",
                role: "assistant",
                navItems: navigation.assistant,
                pageCSS: "/css/modules/management/assistant/grade/class_list.css",
                user: req.user,
                classes,
                message: null
            });
        } catch (error) {
            console.error("Error loading class list for grades:", error);
            const errorMessage = parseErrorMessage(error);

            return res.render("management/assistant/grade/class_list", {
                layout: "layouts/management",
                title: "Quản lý điểm - Danh sách lớp",
                role: "assistant",
                navItems: navigation.assistant,
                pageCSS: "/css/modules/management/assistant/grade/class_list.css",
                user: req.user,
                classes: [],
                message: errorMessage
            });
        }
    }

    // ===== GRADE MANAGEMENT - RENDER GRADE PAGE =====
    async renderGradeImportPage(req, res) {
        try {
            const classId = req.params.classId;
            const upload = req.query.upload || null;

            const classData = await db.Classes.findOne({
                where: { class_id: classId },
                attributes: ["class_id", "class_name"]
            });

            if (!classData) {
                return res.status(404).render("errors/404", {
                    layout: "layouts/management",
                    title: "Không tìm thấy lớp học",
                    role: "assistant",
                    navItems: navigation.assistant,
                    user: req.user
                });
            }

            const result = await assistantManagementService.getStudentsByClassWithGrades(classId);

            const gradeComponents = await db.GradeComponents.findAll({
                where: {
                    class_id: classId,
                    is_active: 1
                },
                order: [["order_index", "ASC"]],
                attributes: ["component_id", "component_name", "component_type", "weight"]
            });

            const gradeWeights = {
                attendance: 0,
                mini_test: 0,
                assignment: 0,
                lab_work: 0,
                midterm: 0,
                final: 0
            };

            gradeComponents.forEach(c => {
                const name = c.component_name.toLowerCase();
                const weight = Number(c.weight);

                if (name.includes("chuyên cần")) gradeWeights.attendance = weight;
                else if (name.includes("mini")) gradeWeights.mini_test = weight;
                else if (name.includes("assignment")) gradeWeights.assignment = weight;
                else if (name.includes("lab")) gradeWeights.lab_work = weight;
                else if (name.includes("giữa")) gradeWeights.midterm = weight;
                else if (name.includes("cuối")) gradeWeights.final = weight;
            });

            res.render("management/assistant/grade/grades", {
                layout: "layouts/management",
                title: `Quản lý điểm - ${classData.class_name}`,
                role: "assistant",
                navItems: navigation.assistant,
                pageCSS: "/css/modules/management/assistant/grade/grades.css",
                pageJS: "/js/modules/assistant/grades.js",
                user: req.user,
                classId,
                className: classData.class_name,
                gradeComponents,
                gradeWeights, 
                data: result.data,
                upload,
                errorMessage: null
            });

        } catch (err) {
            console.error("Error loading grade page:", err);
            const errorMessage = parseErrorMessage(err);
            
            res.status(500).render("errors/500", {
                layout: "layouts/management",
                title: "Lỗi hệ thống",
                role: "assistant",
                navItems: navigation.assistant,
                user: req.user,
                error: errorMessage
            });
        }
    }

    // ===== GRADE MANAGEMENT - UPDATE WEIGHTS =====
    async updateGradeWeights(req, res) {
        try {
            const { classId, components } = req.body;

            if (!classId) {
                return res.status(400).json({
                    success: false,
                    message: "classId is required"
                });
            }

            if (!Array.isArray(components) || components.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "No weight data provided"
                });
            }

            await assistantManagementService.updateGradeWeightsAndRecalculate(classId, components);

            return res.json({
                success: true,
                message: "Cập nhật trọng số và tính lại điểm thành công"
            });

        } catch (error) {
            console.error("Update grade weights error:", error);
            return res.status(500).json({
                success: false,
                message: parseErrorMessage(error)
            });
        }
    }

    // ===== GRADE MANAGEMENT - EXPORT TO EXCEL =====
    async exportGradesTemplate(req, res) {
        try {
            const classId = req.params.classId;

            const result = await assistantManagementService.getStudentsByClassWithGrades(classId);
            const data = result.data;
            
            if (!data || data.length === 0) {
                return res.status(404).send("Không có dữ liệu sinh viên");
            }

            let className = data[0]?.class?.class_name || `class_${classId}`;
            className = className
                .replace(/[\/\\?%*:|"<>]/g, "_")
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");

            const gradeComponents = await db.GradeComponents.findAll({
                where: { class_id: classId, is_active: 1 },
                order: [["order_index", "ASC"]]
            });

            const weightMap = {
                mini_test: 0,
                assignment: 0,
                lab_work: 0,
                midterm: 0,
                final: 0
            };

            gradeComponents.forEach(c => {
                const name = c.component_name.toLowerCase();
                if (name.includes("mini")) weightMap.mini_test = c.weight;
                else if (name.includes("assignment")) weightMap.assignment = c.weight;
                else if (name.includes("lab")) weightMap.lab_work = c.weight;
                else if (name.includes("giữa")) weightMap.midterm = c.weight;
                else if (name.includes("cuối")) weightMap.final = c.weight;
            });

            const workbook = new ExcelJS.Workbook();
            const ws = workbook.addWorksheet("Grades");

            ws.getCell("A1").value = `CLASS_ID=${classId}`;
            ws.addRow([]);

            const headers = [
                "STT",
                "Họ và tên",
                "Mã SV",
                "Ngày sinh",
                "Chuyên ngành",
                "Chuyên cần"
            ];

            if (weightMap.mini_test > 0) headers.push("Mini test");
            if (weightMap.assignment > 0) headers.push("Assignment");
            if (weightMap.lab_work > 0) headers.push("Lab work");
            if (weightMap.midterm > 0) headers.push("Giữa kỳ");
            if (weightMap.final > 0) headers.push("Cuối kỳ");

            headers.push("Trung bình", "Điểm chữ", "GPA", "Ghi chú");
            ws.addRow(headers);

            let index = 1;
            data.forEach(s => {
                const row = [
                    index++,
                    `${s.student.user.first_name} ${s.student.user.last_name}`,
                    s.student.student_code,
                    s.student.user.date_of_birth
                        ? new Date(s.student.user.date_of_birth).toLocaleDateString("vi-VN")
                        : "",
                    s.student.major?.major_name ?? "",
                    s.attendance_rate != null ? Number(s.attendance_rate) * 0.2 : 0
                ];

                if (weightMap.mini_test > 0) row.push(s.mini_test_grade ?? "");
                if (weightMap.assignment > 0) row.push(s.assignment_grade ?? "");
                if (weightMap.lab_work > 0) row.push(s.lab_work_grade ?? "");
                if (weightMap.midterm > 0) row.push(s.grades_summary.midterm ?? "");
                if (weightMap.final > 0) row.push(s.grades_summary.final ?? "");

                row.push(
                    s.grades_summary.total ?? "",
                    s.grades_summary.letter ?? "",
                    s.grades_summary.gpa ?? "",
                    s.notes ?? ""
                );

                ws.addRow(row);
            });

            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${className}.xlsx"`
            );

            await workbook.xlsx.write(res);
            res.end();

        } catch (err) {
            console.error("Export grades error:", err);
            res.status(500).send(`Xuất file Excel thất bại: ${parseErrorMessage(err)}`);
        }
    }

    // ===== GRADE MANAGEMENT - IMPORT FROM EXCEL =====
    async importGradesFromExcel(req, res) {
        try {
            const classId = req.params.classId;

            if (!req.file) {
                return res.redirect(`/assistant/grade/${classId}?upload=invalid_file`);
            }

            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(req.file.path);
            const sheet = workbook.getWorksheet(1);

            const firstCell = sheet.getCell("A1").value;
            if (!firstCell || !String(firstCell).startsWith("CLASS_ID=")) {
                return res.redirect(`/assistant/grade/${classId}?upload=invalid_file`);
            }

            const fileClassId = String(firstCell).split("=")[1];
            if (String(fileClassId) !== String(classId)) {
                return res.redirect(`/assistant/grade/${classId}?upload=wrong_class`);
            }

            const headerRow = sheet.getRow(3);
            const headerMap = {};

            headerRow.eachCell((cell, col) => {
                if (cell.value) {
                    headerMap[String(cell.value).toLowerCase().trim()] = col;
                }
            });

            const result = await assistantManagementService.getStudentsByClassWithGrades(classId);
            const mapCodeToId = {};
            result.data.forEach(s => {
                mapCodeToId[String(s.student.student_code)] = s.student_id;
            });

            const cleanNumber = v => {
                if (v === null || v === undefined || v === "") return null;
                const n = Number(v);
                return isNaN(n) ? null : n;
            };

            const updates = [];

            sheet.eachRow((row, idx) => {
                if (idx <= 3) return;

                const studentCodeCol = headerMap["mã sv"];
                if (!studentCodeCol) return;

                const studentCode = String(row.getCell(studentCodeCol).value || "").trim();
                const studentId = mapCodeToId[studentCode];
                if (!studentId) return;

                const update = { studentId };

                if (headerMap["mini test"])
                    update.mini_test = cleanNumber(row.getCell(headerMap["mini test"]).value);

                if (headerMap["assignment"])
                    update.assignment = cleanNumber(row.getCell(headerMap["assignment"]).value);

                if (headerMap["lab work"])
                    update.lab_work = cleanNumber(row.getCell(headerMap["lab work"]).value);

                if (headerMap["giữa kỳ"])
                    update.midterm = cleanNumber(row.getCell(headerMap["giữa kỳ"]).value);

                if (headerMap["cuối kỳ"])
                    update.final = cleanNumber(row.getCell(headerMap["cuối kỳ"]).value);

                if (headerMap["ghi chú"])
                    update.notes = row.getCell(headerMap["ghi chú"]).value
                        ? String(row.getCell(headerMap["ghi chú"]).value).trim()
                        : null;

                updates.push(update);
            });

            await assistantManagementService.updateStudentGrades(classId, updates);

            return res.redirect(`/assistant/grade/${classId}?upload=success`);

        } catch (err) {
            console.error("Import grades error:", err);
            return res.redirect(`/assistant/grade/${req.params.classId}?upload=invalid_file`);
        }
    }

    // ===== GRADE MANAGEMENT - BULK UPDATE =====
    async bulkUpdateGrades(req, res) {
        try {
            const { classId, updates } = req.body;

            if (!classId || !updates) {
                return res.status(400).json({
                    success: false,
                    message: "classId và updates là bắt buộc"
                });
            }

            await assistantManagementService.bulkUpdateGrades(updates);
            await assistantManagementService.recalculateGradesByClass(classId);

            res.json({
                success: true,
                message: "Cập nhật và tính lại điểm thành công"
            });

        } catch (e) {
            console.error("Bulk update grades error:", e);
            return res.status(500).json({
                success: false,
                message: parseErrorMessage(e)
            });
        }
    }
}

module.exports = new AssistantController();