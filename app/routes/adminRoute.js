const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const AuthMiddleware = require('../middlewares/authMiddleware');
const DepartmentRouter = require('./departmentRoute'); 
const roleGuard = require('../middlewares/roleguard');

router.use(AuthMiddleware);
router.use(roleGuard(['admin']));

router.get('/', AdminController.index);
router.get('/home', AdminController.index);
router.get('/staff', AdminController.getStaffPage);
router.get('/change_password', AdminController.getChangePassword);

router.use('/', DepartmentRouter); 

// --- API ROUTES---
// Assistant
router.get('/api/assistants', AdminController.getAssistants);
router.get('/api/assistants/:userId', AdminController.getAssistantById);
router.post('/api/assistants', AdminController.createAssistant);
router.put('/api/assistants/:userId', AdminController.updateAssistant);
router.delete('/api/assistants/:userId', AdminController.deleteAssistant);
router.post('/api/assistants/:userId/restore', AdminController.restoreAssistant);

// Lecturer
router.get('/api/lecturers', AdminController.getLecturers);
router.get('/api/lecturers/:userId', AdminController.getLecturerById);
router.post('/api/lecturers', AdminController.createLecturer);
router.put('/api/lecturers/:userId', AdminController.updateLecturer);
router.delete('/api/lecturers/:userId', AdminController.deleteLecturer);
router.post('/api/lecturers/:userId/restore', AdminController.restoreLecturer);

module.exports = router;