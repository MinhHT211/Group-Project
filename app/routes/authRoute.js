const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const { 
    validateLogin, 
    validateChangePasswordByUser 
} = require('../middlewares/validators/authValidators');

router.get('/login', authController.getLogin);
router.get('/logout', authController.getLogout);

router.post('/login', validateLogin, authController.postLogin);
router.post('/refresh', authController.postRefresh);

router.put(
    '/password',
    authMiddleware,
    validateChangePasswordByUser,
    authController.putChangePassword
);



module.exports = router;