const bcryptjs = require("bcryptjs");
const { sequelize, Users } = require("../models");
const userRepository = require("../repositories/userRepository");
const refreshtokRepo = require("../repositories/authRepository");
const {
    NotFoundError,
    ValidationError,
    ConflictError,
    ForbiddenError,
} = require("../errors");


const mustBeAdmin = (currentUser) => {
    const isAdmin = (currentUser?.roles || []).includes("admin");
    if (!isAdmin) {
        throw new ForbiddenError("Admin only");
    }
};

class UserService {
    constructor(userRepository, refreshTokenRepository, sequelize) {
        this.userRepository = userRepository;
        this.refreshtokRepo = refreshTokenRepository;
        this.sequelize = sequelize;
    }

    async signup({ email, password, fullName, username, studentCode }) {
        if (!email || !password || !username) {
            throw new ValidationError("All fields are required.");
        }
        if (password.length < 8) {
            throw new ValidationError("Password must be at least 8 characters long.");
        }

        if (await this.userRepository.findByEmail(email)) {
            throw new ConflictError("Email already exists");
        }
        
        const passwordHash = await bcryptjs.hash(password, 10);
        
        try {
            const userId = await this.userRepository.createUserWithDefaultRole({
                username,
                email,
                passwordHash,
                fullName,
                studentCode, 
            });
            return { userId, message: "User registered successfully" };
        } catch (err) {
            if (err.name === "SequelizeUniqueConstraintError") {
                throw new ConflictError("Duplicate email or username");
            }
            throw err;
        }
    }

// Admin force change password
    async forceChangePassword({ targetUserId, newPassword, currentUser }) {
        mustBeAdmin(currentUser); 

        if (!newPassword || newPassword.length < 8) {
            throw new ValidationError("New password too short (min 8)");
        }

        const user = await Users.findByPk(targetUserId);
        if (!user) {
            throw new NotFoundError("User not found");
        }

        const newHash = await bcryptjs.hash(newPassword, 10);
        await Users.update(
            { password_hash: newHash, updated_at: new Date() },
            { where: { user_id: targetUserId } }
        );

        if (this.refreshtokRepo) await this.refreshtokRepo.RevokeAllOfUser(targetUserId);

        return { message: "Password changed by admin", userId: targetUserId };
    }
}

module.exports = new UserService(userRepository, refreshtokRepo, sequelize);