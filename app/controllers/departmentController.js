const navigation = require('../config/navigation');
const DepartmentService = require('../services/departmentService');
const MajorService = require('../services/majorService');
const { parseErrorMessage } = require('../utils/errorHelper');

class DepartmentController {
    constructor() {
        this.departmentService = DepartmentService;
        this.majorService = MajorService;
    }

    getDepartmentPage = (req, res) => {
        res.render('management/admin/department', {
            layout: 'layouts/management',
            pageCSS: '/css/modules/management/admin/department.css',
            title: 'Quản lý Khoa',
            role: 'admin',
            navItems: navigation.admin,
            user: req.user
        });
    }

    getDepartments = async (req, res) => {
        try {
            const { page, limit, search, is_active } = req.query;
            const options = {
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10,
                search: search || null,
                is_active: is_active !== undefined ? is_active === 'true' : null
            };
            
            const result = await this.departmentService.getAllDepartments(options);
            return res.status(200).json(result);
        } catch (error) {
            console.error('Controller Error - getDepartments:', error);
            const errorMessage = parseErrorMessage(error)
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: errorMessage
            });
        }
    }

    getDepartmentById = async (req, res) => {
        try {
            const departmentId = parseInt(req.params.departmentId);

            if (!departmentId || isNaN(departmentId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid department ID'
                });
            }

            const result = await this.departmentService.getDepartmentById(departmentId);
            return res.status(200).json(result);
        } catch (error) {
            console.error('Controller Error - getDepartmentById:', error);
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

    createDepartment = async (req, res) => {
        try {
            const departmentData = req.body;

            if (!departmentData) {
                return res.status(400).json({
                    success: false,
                    message: 'Department data is required'
                });
            }

            const result = await this.departmentService.createDepartment(departmentData);
            return res.status(201).json(result);
        } catch (error) {
            console.error('Controller Error - createDepartment:', error);
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

    updateDepartment = async (req, res) => {
        try {
            const departmentId = parseInt(req.params.departmentId);

            if (!departmentId || isNaN(departmentId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid department ID'
                });
            }

            const departmentData = req.body;

            if (!departmentData || Object.keys(departmentData).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No update data provided'
                });
            }

            const result = await this.departmentService.updateDepartment(
                departmentId,
                departmentData
            );
            return res.status(200).json(result);
        } catch (error) {
            console.error('Controller Error - updateDepartment:', error);
            const clearMessage = parseErrorMessage(error);

            if (error.message.includes('not found')) {
                return res.status(404).json({
                    success: false,
                    message: clearMessage
                });
            }

            if (error.message.includes('required') || 
                error.message.includes('Invalid') ||
                error.message.includes('already exists')) {
                return res.status(400).json({
                    success: false,
                    message: clearMessage
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: clearMessage
            });
        }
    }

    deleteDepartment = async (req, res) => {
        try {
            const departmentId = parseInt(req.params.departmentId);

            if (!departmentId || isNaN(departmentId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid department ID'
                });
            }

            const result = await this.departmentService.deleteDepartment(departmentId);
            return res.status(200).json(result);
        } catch (error) {
            console.error('Controller Error - deleteDepartment:', error);
            const errorMessage = parseErrorMessage(error);

            if (error.message.includes('not found')) {
                return res.status(404).json({
                    success: false,
                    message: errorMessage
                });
            }

            if (error.message.includes('Cannot delete')) {
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

    getDepartmentsSimple = async (req, res) => {
        try {
            const { is_active } = req.query;
            const result = await this.departmentService.getAllDepartmentsSimple(
                is_active !== undefined ? is_active === 'true' : true
            );
            return res.status(200).json(result);
        } catch (error) {
            console.error('Controller Error - getDepartmentsSimple:', error);
            const errorMessage = parseErrorMessage(error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: errorMessage
            });
        }
    }

    getMajors = async (req, res) => {
        try {
            const { page, limit, search, department_id, is_active, degree_type } = req.query;
            const options = {
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10,
                search: search || null,
                department_id: department_id ? parseInt(department_id) : null,
                is_active: is_active !== undefined ? is_active === 'true' : null,
                degree_type: degree_type || null
            };
            
            const result = await this.majorService.getAllMajors(options);
            return res.status(200).json(result);
        } catch (error) {
            console.error('Controller Error - getMajors:', error);
            const errorMessage = parseErrorMessage(error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: errorMessage
            });
        }
    }

    getMajorsByDepartment = async (req, res) => {
        try {
            const departmentId = parseInt(req.params.departmentId);
            
            if (!departmentId || isNaN(departmentId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid department ID'
                });
            }

            const { is_active } = req.query;
            const result = await this.majorService.getMajorsByDepartment(
                departmentId,
                { is_active: is_active !== undefined ? is_active === 'true' : null }
            );
            return res.status(200).json(result);
        } catch (error) {
            console.error('Controller Error - getMajorsByDepartment:', error);
            const errorMessage = parseErrorMessage(error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: errorMessage
            });
        }
    }

    getMajorById = async (req, res) => {
        try {
            const majorId = parseInt(req.params.majorId);

            if (!majorId || isNaN(majorId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid major ID'
                });
            }

            const result = await this.majorService.getMajorById(majorId);
            return res.status(200).json(result);
        } catch (error) {
            console.error('Controller Error - getMajorById:', error);
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

    createMajor = async (req, res) => {
        try {
            const majorData = req.body;

            if (!majorData) {
                return res.status(400).json({
                    success: false,
                    message: 'Major data is required'
                });
            }

            const result = await this.majorService.createMajor(majorData);
            return res.status(201).json(result);
        } catch (error) {
            console.error('Controller Error - createMajor:', error);
            const errorMessage = parseErrorMessage(error);

            if (error.message.includes('required') || 
                error.message.includes('Invalid') ||
                error.message.includes('already exists') ||
                error.message.includes('must be')) {
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

    updateMajor = async (req, res) => {
        try {
            const majorId = parseInt(req.params.majorId);

            if (!majorId || isNaN(majorId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid major ID'
                });
            }

            const majorData = req.body;

            if (!majorData || Object.keys(majorData).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No update data provided'
                });
            }

            const result = await this.majorService.updateMajor(majorId, majorData);
            return res.status(200).json(result);
        } catch (error) {
            console.error('Controller Error - updateMajor:', error);
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
                error.message.includes('Cannot change') ||
                error.message.includes('must be')) {
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

    deleteMajor = async (req, res) => {
        try {
            const majorId = parseInt(req.params.majorId);

            if (!majorId || isNaN(majorId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid major ID'
                });
            }

            const result = await this.majorService.deleteMajor(majorId);
            return res.status(200).json(result);
        } catch (error) {
            console.error('Controller Error - deleteMajor:', error);
            const errorMessage = parseErrorMessage(error);

            if (error.message.includes('not found')) {
                return res.status(404).json({
                    success: false,
                    message: errorMessage
                });
            }

            if (error.message.includes('Cannot delete')) {
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

    getMajorsSimple = async (req, res) => {
        try {
            const { department_id, is_active } = req.query;
            const result = await this.majorService.getMajorsSimple({
                department_id: department_id ? parseInt(department_id) : null,
                is_active: is_active !== undefined ? is_active === 'true' : true
            });
            return res.status(200).json(result);
        } catch (error) {
            console.error('Controller Error - getMajorsSimple:', error);
            const errorMessage = parseErrorMessage(error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: errorMessage
            });
        }
    }
}
module.exports = new DepartmentController();