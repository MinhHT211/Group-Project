const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/userRepository');
const authRepository = require('../repositories/authRepository');
const jwtUtil = require('../utils/jwt');
const { sequelize } = require('../models');
const {
    NotFoundError,
    UnauthorizedError,
    ValidationError,
} = require('../errors');

function sha256(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

function identifyLoginType(identifier) {
    if (identifier.includes('@')) return 'email';
    if (/^[A-Za-z0-9]{6,12}$/.test(identifier)) return 'student_code';
    return 'username';
}

class AuthService {
    constructor(userRepository, authRepository, sequelize) {
        this.userRepository = userRepository;
        this.authRepository = authRepository;
        this.sequelize = sequelize;
    }

    // User login: returns { accessToken, refreshToken, user }
    async login({ identifier, password, ua, ip }) {
        try {
            if (!identifier || !password) {
                throw new ValidationError('Identifier and password are required');
            }
            const normalized = String(identifier).trim();
            let user = null;

            if (normalized.includes('@')) {
                user = await this.userRepository.findByEmail(normalized);
            }

            if (!user) {
                user = await this.userRepository.findByUsername(normalized);
            }

            if (!user) {
                user = await this.userRepository.findByStudentCode(normalized);
            }

            if (!user) throw new NotFoundError('User not found');
            if (!user.is_active) throw new UnauthorizedError('User account is inactive');
            if (user.is_deleted) throw new UnauthorizedError('User account has been deleted');

            const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);
            if (!isPasswordCorrect) throw new UnauthorizedError('Invalid password');

            const roles = await this.userRepository.getUserRoles(user.user_id);
            if (!roles || roles.length === 0) throw new UnauthorizedError('User has no assigned roles');

            const accessToken = jwtUtil.generateAccessToken({
                sub: user.user_id,
                email: user.email,
                roles,
            });

            const refreshToken = jwtUtil.generateRefreshToken({ sub: user.user_id });

            const transaction = await this.sequelize.transaction();
            try {
                const tokenData = {
                    user_id: user.user_id,
                    refresh_token_hash: sha256(refreshToken),
                    user_agent: ua || null,
                    ip: ip || null,
                    refresh_expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                    is_revoked: false,
                    last_used_at: new Date(),
                    created_at: new Date(),
                };
                await this.authRepository.CreateRefreshTokens(tokenData, transaction);
                await transaction.commit();
            } catch (err) {
                await transaction.rollback();
                console.error('Error saving refresh token:', err);
                throw new Error('Failed to create session. Please try again.');
            }

            return {
                accessToken,
                refreshToken,
                user: {
                    user_id: user.user_id,
                    email: user.email,
                    username: user.username,
                    full_name: user.full_name,
                    student_code: user.Student?.student_code || null,
                    avatar_url: user.avatar_url || null,
                    roles,
                },
            };
        } catch (error) {
            if (error instanceof NotFoundError ||
                error instanceof UnauthorizedError ||
                error instanceof ValidationError) {
                throw error;
            }
            console.error('Login error:', error);
            throw new Error('Login failed. Please try again later.');
        }
    }

    // Refresh access token: returns { accessToken, refreshToken }
    async refresh({ refreshToken, ua, ip }) {
        try {
            if (!refreshToken) throw new ValidationError('Refresh token is required');

            let payload;
            try {
                payload = jwtUtil.verifyRefreshToken(refreshToken);
            } catch (err) {
                throw new UnauthorizedError('Invalid refresh token');
            }

            const tokenHash = sha256(refreshToken);
            const storedToken = await this.authRepository.FindValidByHash(tokenHash);
            if (!storedToken) throw new UnauthorizedError('Refresh token not found');

            if (new Date(storedToken.refresh_expires_at).getTime() <= Date.now()) {
                throw new UnauthorizedError('Refresh token has expired');
            }
            if (storedToken.is_revoked) throw new UnauthorizedError('Refresh token has been revoked');
            if (storedToken.user_id !== payload.sub) throw new UnauthorizedError('Token user mismatch');

            const user = await this.userRepository.findById(payload.sub);
            if (!user || !user.is_active || user.is_deleted) {
                throw new UnauthorizedError('User account is inactive or deleted');
            }

            const transaction = await this.sequelize.transaction();
            try {
                await this.authRepository.RevokeById(storedToken.user_token_id, transaction);

                const roles = await this.userRepository.getUserRoles(payload.sub);

                const newAccessToken = jwtUtil.generateAccessToken({
                    sub: payload.sub,
                    email: user.email,
                    roles,
                });

                const newRefreshToken = jwtUtil.generateRefreshToken({ sub: payload.sub });

                const newTokenData = {
                    user_id: payload.sub,
                    refresh_token_hash: sha256(newRefreshToken),
                    user_agent: ua || null,
                    ip: ip || null,
                    refresh_expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                    is_revoked: false,
                    last_used_at: new Date(),
                    created_at: new Date(),
                };

                await this.authRepository.CreateRefreshTokens(newTokenData, transaction);
                await transaction.commit();

                return {
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken,
                };
            } catch (err) {
                await transaction.rollback();
                console.error('Error refreshing token:', err);
                throw new Error('Failed to refresh token. Please try again.');
            }
        } catch (error) {
            if (error instanceof UnauthorizedError || error instanceof ValidationError) throw error;
            console.error('Refresh token error:', error);
            throw new Error('Token refresh failed. Please login again.');
        }
    }


    // Change password (revokes all refresh tokens)
    async changePassword({ userId, email, oldPassword, newPassword }) {
        try {
            if (!userId || !oldPassword || !newPassword) {
                throw new ValidationError('All fields are required');
            }
            if (newPassword.length < 8) {
                throw new ValidationError('New password must be at least 8 characters');
            }

            // Load user first
            const user = await this.userRepository.findById(userId);
            if (!user) throw new NotFoundError('User not found');

            const submittedEmail = email ? String(email).toLowerCase().trim() : null;
            const userEmail = user.email ? String(user.email).toLowerCase().trim() : null;

            if (!submittedEmail || userEmail !== submittedEmail) {
                throw new UnauthorizedError("Email is not correct.");
            }

            const isOldPasswordCorrect = await bcrypt.compare(oldPassword, user.password_hash);
            if (!isOldPasswordCorrect) throw new UnauthorizedError('Current password is incorrect');

            const isSamePassword = await bcrypt.compare(newPassword, user.password_hash);
            if (isSamePassword) throw new ValidationError('New password must be different from current password');

            const newPasswordHash = await bcrypt.hash(newPassword, 10);
            await this.userRepository.updatePasswordHash(userId, newPasswordHash);

            try {
                await this.authRepository.RevokeAllOfUser(userId);
            } catch (err) {
                console.error('Error revoking tokens after password change:', err);
            }

            return { message: 'Password changed successfully. Please login again.' };
        } catch (error) {
            if (error instanceof NotFoundError ||
                error instanceof UnauthorizedError ||
                error instanceof ValidationError) {
                throw error;
            }
            console.error('Change password error:', error);
            throw new Error('Failed to change password. Please try again.');
        }
    }

    // Logout single refresh token (graceful)
    async logout(refreshToken) {
        try {
            if (!refreshToken) return { success: true, message: 'No active session found' };

            const tokenHash = sha256(refreshToken);
            const storedToken = await this.authRepository.FindValidByHash(tokenHash);

            if (storedToken && !storedToken.is_revoked) {
                // Revoke without transaction; repository handles update
                await this.authRepository.RevokeById(storedToken.user_token_id);
            }

            return { success: true, message: 'Logged out successfully' };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: true, message: 'Logged out successfully' };
        }
    }

    // Logout from all devices
    async logoutAll(userId) {
        try {
            if (!userId) throw new ValidationError('User ID is required');
            await this.authRepository.RevokeAllOfUser(userId);
            return { success: true, message: 'Logged out from all devices successfully' };
        } catch (error) {
            console.error('Logout all error:', error);
            throw new Error('Failed to logout from all devices');
        }
    }
}

module.exports = new AuthService(userRepository, authRepository, sequelize);