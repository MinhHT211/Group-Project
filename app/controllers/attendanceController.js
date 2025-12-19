const AttendanceService = require('../services/attendanceService');
const { parseErrorMessage } = require('../utils/errorHelper');

class AttendanceController {
    constructor() {
        this.attendanceService = AttendanceService;
    }

    // GET /classes/:classId/attendance
    getAttendance = async (req, res) => {
        try {
            const { classId } = req.params;
            const { date, session_number, student_id } = req.query;

            const resolvedClassId = Number(classId);
            if (!resolvedClassId || isNaN(resolvedClassId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid class ID'
                });
            }

            const options = {
                attendance_date: date || null,
                session_number: session_number ? parseInt(session_number) : null,
                student_id: student_id ? parseInt(student_id) : null
            };

            const result = await this.attendanceService.getAttendanceRecords(resolvedClassId, options);
            return res.status(200).json(result);

        } catch (error) {
            console.error('[AttendanceController] Get Error:', error);
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

    // POST /classes/:classId/attendance/bulk
    postBulkAttendance = async (req, res) => {
        try {
            const { classId } = req.params;
            const body = req.body || {};
            const resolvedClassId = Number(classId || body.class_id);

            if (!resolvedClassId || isNaN(resolvedClassId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid class ID'
                });
            }

            // Normalize input: body can be array or object with array
            let attendanceArray = [];
            if (Array.isArray(body)) attendanceArray = body;
            else if (Array.isArray(body.attendanceArray)) attendanceArray = body.attendanceArray;
            else if (Array.isArray(body.attendances)) attendanceArray = body.attendances;

            // Extract Context from body (Global settings for this batch)
            const options = {
                recorded_by: body.recorded_by || (req.user && req.user.user_id) || null,
                schedule_id: body.schedule_id,
                session_number: body.session_number,
                attendance_date: body.attendance_date,
                // Auto-create for all students if requested OR if array is empty but contexts are provided
                create_for_all: (body.create_for_all === true || body.create_for_all === 'true' || (attendanceArray.length === 0 && !body.attendanceArray))
            };

            const result = await this.attendanceService.markAttendanceBulk(resolvedClassId, attendanceArray, options);

            return res.status(201).json(result);
        } catch (error) {
            console.error('[AttendanceController] Bulk Error:', error);
            const errorMessage = parseErrorMessage(error);

            if (error.message.includes('required') || 
                error.message.includes('Invalid') ||
                error.message.includes('closed')) {
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

    // PATCH /classes/:classId/attendance
    patchAttendance = async (req, res) => {
        try {
            const { classId } = req.params;
            const body = req.body || {};
            const resolvedClassId = Number(classId || body.class_id);

            if (!resolvedClassId || isNaN(resolvedClassId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid class ID'
                });
            }

            let identifier = null;

            if (body.attendance_id) {
                identifier = Number(body.attendance_id);
            } else {
                // Use composite keys
                identifier = {
                    class_id: resolvedClassId,
                    student_id: body.student_id ? Number(body.student_id) : undefined,
                    attendance_date: body.attendance_date,
                    schedule_id: body.schedule_id ? Number(body.schedule_id) : undefined,
                    session_number: body.session_number !== undefined ? Number(body.session_number) : undefined
                };
            }

            // Prepare Update Data
            const updateData = { ...body };
            
            delete updateData.attendance_id;
            delete updateData.class_id;
            delete updateData.student_id; 
            
            // Ensure recorded_by is present
            if (!updateData.recorded_by && req.user && req.user.user_id) {
                updateData.recorded_by = req.user.user_id;
            }

            const result = await this.attendanceService.updateAttendanceRecord(identifier, updateData);

            return res.status(200).json(result);
        } catch (error) {
            console.error('[AttendanceController] Patch Error:', error);
            const errorMessage = parseErrorMessage(error);

            if (error.message.includes('not found')) {
                return res.status(404).json({
                    success: false,
                    message: errorMessage
                });
            }

            if (error.message.includes('required') || error.message.includes('Invalid')) {
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
}

module.exports = new AttendanceController();