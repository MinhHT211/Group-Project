const express = require('express');
const router = express.Router();
const DepartmentController = require('../controllers/departmentController');

// --- VIEW ---
router.get('/department', DepartmentController.getDepartmentPage);

// --- API Department ---
router.get('/api/departments', DepartmentController.getDepartments);
router.get('/api/departments/simple', DepartmentController.getDepartmentsSimple);
router.get('/api/departments/:departmentId', DepartmentController.getDepartmentById);
router.post('/api/departments', DepartmentController.createDepartment);
router.put('/api/departments/:departmentId', DepartmentController.updateDepartment);
router.delete('/api/departments/:departmentId', DepartmentController.deleteDepartment);

// --- API Major ---
router.get('/api/majors', DepartmentController.getMajors);
router.get('/api/majors/simple', DepartmentController.getMajorsSimple);
router.get('/api/majors/by-department/:departmentId', DepartmentController.getMajorsByDepartment);
router.get('/api/majors/:majorId', DepartmentController.getMajorById);
router.post('/api/majors', DepartmentController.createMajor);
router.put('/api/majors/:majorId', DepartmentController.updateMajor);
router.delete('/api/majors/:majorId', DepartmentController.deleteMajor);

module.exports = router;