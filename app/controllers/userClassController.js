const userRepository = require("../repositories/userRepository");
const userSvc = require("../services/userService");
const { parseErrorMessage } = require('../utils/errorHelper');
const { NotFoundError } = require("../errors");

class UserClassController {
    constructor(userRepository, userSvc) {
        this.userRepository = userRepository;
        this.userSvc = userSvc;
    }

    getUser = async (req, res) => {
        try {
            const userId = req.params.id;
            const user = await this.userRepository.findById(userId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            return res.status(200).json({
                success: true,
                message: "Success",
                data: user,
            });
        } catch (error) {
            console.error('Controller Error - getUser:', error);
            
            if (error instanceof NotFoundError) {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            return res.status(500).json({
                success: false,
                message: "An internal server error occurred",
                error: parseErrorMessage(error)
            });
        }
    }

    getUserRoles = async (req, res) => {
        try {
            const userId = req.params.userId;
            const roles = await this.userRepository.getUserRoles(userId);

            return res.status(200).json({ 
                success: true,
                roles 
            });
        } catch (error) {
            console.error('Controller Error - getUserRoles:', error);
            return res.status(500).json({
                success: false,
                message: "Failed to retrieve user roles",
                error: parseErrorMessage(error)
            });
        }
    }

    putForceChangePassword = async (req, res) => {
        try {
            const targetUserId = Number(req.params.id);
            const { newPassword } = req.body;
            
            const result = await this.userSvc.forceChangePassword({
                targetUserId,
                newPassword,
                currentUser: req.user,
            });

            return res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Controller Error - putForceChangePassword:', error);
            const errorMessage = parseErrorMessage(error);
            const status = error.status || 500;

            if (status < 500) {
                return res.status(status).json({ 
                    success: false, 
                    message: errorMessage 
                });
            }
            
            return res.status(500).json({ 
                success: false,
                message: "Internal server error",
                error: errorMessage 
            });
        }
    }
}

module.exports = new UserClassController(userRepository, userSvc);