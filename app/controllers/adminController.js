const navigation = require('../config/navigation');
const AssistantManagementService = require('../services/assistantManagementService');
const LecturerManagementService = require('../services/lecturerManagementService');
const { parseErrorMessage } = require('../utils/errorHelper');

class AdminController {
    constructor() {
        this.assistantService = AssistantManagementService;
        this.lecturerService = LecturerManagementService;
    }

    index = (req, res) => {
        const adminId = req.user ? req.user.user_id : req.params.userId;
        
        res.render('management/admin/index', {
            layout: 'layouts/management',
            title: 'Admin Dashboard',
            role: 'admin',
            navItems: navigation.admin,
            user: req.user || {
                name: 'Admin User',
                avatar: '/images/avatar_default.png',
                roleKey: 'admin',
                roleText: 'Administrator',
                id: adminId,
            }
        });
    }

    getDepartment = (req, res) => {
        res.render('management/admin/department', {
            layout: 'layouts/management',
            title: 'Manage Department',
            role: 'admin',
            navItems: navigation.admin,
            user: req.user
        });
    }

    getStaffPage = (req, res) => {
        res.render('management/admin/staff', {
            layout: 'layouts/management',
            pageJS: '/js/modules/admin/staff/main.js',
            pageCSS: '/css/modules/management/admin/staff.css',
            title: 'Quản lý Nhân sự',
            role: 'admin',
            navItems: navigation.admin,
            user: req.user,       
        });
    }

    getChangePassword = (req, res) => {
        res.render('components/change_password', {
            layout: 'layouts/management',
            pageJS: '/js/components/change_password.js',
            pageCSS: '/css/modules/auth/change_password.css',
            title: 'Change Password',
            role: 'admin',
            navItems: navigation.admin,
            user: req.user
        });
    }

    getAssistants = async (req, res) => {
        try {
            const { page, limit, department_id, is_active, search } = req.query;
            const options = {
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10,
                search: search || null,
                department_id: department_id ? parseInt(department_id) : null,
                is_active: is_active !== undefined ? is_active === 'true' : null,
                include_deleted: true
            };
            
            const result = await this.assistantService.getAllAssistants(options);
            return res.status(200).json(result);
        } catch (error) {
            console.error('Controller Error - getAssistants:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: parseErrorMessage(error)
            });
        }
    }

    getAssistantById = async (req, res) => {
        try {
            const userId = parseInt(req.params.userId);

            if (!userId || isNaN(userId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID'
                });
            }

            const result = await this.assistantService.getAssistantById(userId);
            return res.status(200).json(result);
        } catch (error) {
            console.error('Controller Error - getAssistantById:', error);
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

    createAssistant = async (req, res) => {
        try {
            const { userData, assistantData } = req.body;

            if (!userData || !assistantData) {
                return res.status(400).json({
                    success: false,
                    message: 'userData and assistantData are required'
                });
            }

            const result = await this.assistantService.createAssistant(userData, assistantData);
            return res.status(201).json(result);
        } catch (error) {
            console.error('Controller Error - createAssistant:', error);
            const errorMessage = parseErrorMessage(error);
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

    updateAssistant = async (req, res) => {
        try {
            const userId = parseInt(req.params.userId);

            if (!userId || isNaN(userId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID'
                });
            }

            const { userData = {}, assistantData = {} } = req.body;

            if (Object.keys(userData).length === 0 && Object.keys(assistantData).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No update data provided'
                });
            }

            const result = await this.assistantService.updateAssistant(
                userId, 
                userData, 
                assistantData
            );
            return res.status(200).json(result);
        } catch (error) {
            console.error('Controller Error - updateAssistant:', error);
            const errorMessage = parseErrorMessage(error);

            if (error.message.includes('not found')) {
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

    deleteAssistant = async (req, res) => {
        try {
            const userId = parseInt(req.params.userId);

            if (!userId || isNaN(userId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID'
                });
            }

            const result = await this.assistantService.deleteAssistant(userId);
            return res.status(200).json(result);
        } catch (error) {
            console.error('Controller Error - deleteAssistant:', error);
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

    restoreAssistant = async (req, res) => {
        try {
            const userId = parseInt(req.params.userId);
            const result = await this.assistantService.restoreAssistant(userId);
            return res.status(200).json(result);
        } catch (error) {
            console.error('Controller Error - restoreAssistant:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: parseErrorMessage(error)
            });
        }
    }

    getLecturers = async (req, res) => {
        try {
            const { page, limit, search, department_id, is_active, academic_rank } = req.query;
            const options = {
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10,
                search: search || null,
                department_id: department_id ? parseInt(department_id) : null,
                is_active: is_active !== undefined ? is_active === 'true' : null,
                academic_rank: academic_rank || null,
                include_deleted: true
            };
            
            const result = await this.lecturerService.getAllLecturers(options);
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

            if (!userId || isNaN(userId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID'
                });
            }

            const result = await this.lecturerService.getLecturerById(userId);
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

    createLecturer = async (req, res) => {
        try {
            const { userData, lecturerData } = req.body;

            if (!userData || !lecturerData) {
                return res.status(400).json({
                    success: false,
                    message: 'userData and lecturerData are required'
                });
            }

            const result = await this.lecturerService.createLecturer(userData, lecturerData);
            return res.status(201).json(result);
        } catch (error) {
            console.error('Controller Error - createLecturer:', error);
            const errorMessage = parseErrorMessage(error);

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

    updateLecturer = async (req, res) => {
        try {
            const userId = parseInt(req.params.userId);

            if (!userId || isNaN(userId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID'
                });
            }

            const { userData = {}, lecturerData = {} } = req.body;

            if (Object.keys(userData).length === 0 && Object.keys(lecturerData).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No update data provided'
                });
            }

            const result = await this.lecturerService.updateLecturer(
                userId, 
                userData, 
                lecturerData
            );
            return res.status(200).json(result);
        } catch (error) {
            console.error('Controller Error - updateLecturer:', error);
            const errorMessage = parseErrorMessage(error);

            if (error.message.includes('not found')) {
                return res.status(404).json({
                    success: false,
                    message: errorMessage
                });
            }

            if (error.message.includes('required') || 
                error.message.includes('Invalid') ||
                error.message.includes('already exists') ||
                error.message.includes('Cannot delete') ||
                error.message.includes('Cannot modify')) {
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

    deleteLecturer = async (req, res) => {
        try {
            const userId = parseInt(req.params.userId);

            if (!userId || isNaN(userId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID'
                });
            }

            const result = await this.lecturerService.deleteLecturer(userId);
            return res.status(200).json(result);
        } catch (error) {
            console.error('Controller Error - deleteLecturer:', error);
            const errorMessage = parseErrorMessage(error);

            if (error.message.includes('not found')) {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            if (error.message.includes('Cannot delete') || 
                error.message.includes('Cannot modify')) {
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

    restoreLecturer = async (req, res) => {
        try {
            const userId = parseInt(req.params.userId);
            const result = await this.lecturerService.restoreLecturer(userId);
            return res.status(200).json(result);
        } catch (error) {
            console.error('Controller Error - restoreLecturer:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: parseErrorMessage(error)
            });
        }
    }
}
module.exports = new AdminController();