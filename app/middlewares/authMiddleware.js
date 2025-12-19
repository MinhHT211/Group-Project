const { verifyAccessToken } = require('../utils/jwt');
const db = require('../models');

module.exports = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || '';
        const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
        const token = bearerToken || req.cookies?.access_token || null;

        if (!token) {
            if (req.xhr || req.path.includes('/api/')) {
                return res.status(401).json({
                    success: false,
                    message: 'No token provided',
                });
            }
            return res.redirect('/auth/login');
        }

        const decoded = verifyAccessToken(token);
        const userId = decoded.sub;

        const user = await db.Users.findByPk(userId, {
            attributes: [
                'user_id', 'username', 'email', 'first_name', 'last_name', 
                'full_name', 'avatar_url', 'is_active', 'last_login_at'
            ],
            raw: true
        });

        if (!user) {
            if (req.xhr || req.path.includes('/api/')) {
                return res.status(401).json({ success: false, message: 'User not found' });
            }
            return res.redirect('/auth/login');
        }

        if (!user.is_active) {
            if (req.xhr || req.path.includes('/api/')) {
                return res.status(403).json({ success: false, message: 'User account is inactive' });
            }
            return res.redirect('/auth/login');
        }

        const rolesData = await db.sequelize.query(
            `SELECT r.role_name
            FROM UserRoles ur
            JOIN Roles r ON ur.role_id = r.role_id
            WHERE ur.user_id = :uid AND ur.is_active = true AND r.is_active = true`,
            {
                replacements: { uid: userId },
                type: db.sequelize.QueryTypes.SELECT
            }
        );

        const roles = rolesData.map(r => r.role_name);

        let currentRole = 'user';
        if (roles.includes('admin')) currentRole = 'admin';
        else if (roles.includes('assistant')) currentRole = 'assistant';
        else if (roles.includes('lecturer')) currentRole = 'lecturer';
        else if (roles.includes('student')) currentRole = 'student';

        let profileData = null;

        if (currentRole === 'student') {
            profileData = await db.Students.findOne({
                where: { user_id: userId },
                include: [{ 
                    model: db.Majors, 
                    as: 'major', 
                    attributes: ['major_id', 'major_code', 'major_name', 'department_id'] 
                }],
                raw: true,
                nest: true
            });
        } else if (currentRole === 'lecturer') {
            profileData = await db.Lecturers.findOne({
                where: { user_id: userId },
                include: [{ 
                    model: db.Departments, 
                    as: 'department', 
                    attributes: ['department_id', 'department_code', 'department_name'] 
                }],
                raw: true,
                nest: true
            });
        } else if (currentRole === 'assistant') {
            profileData = await db.Assistants.findOne({
                where: { user_id: userId },
                include: [{ 
                    model: db.Departments, 
                    as: 'department', 
                    attributes: ['department_id', 'department_code', 'department_name'] 
                }],
                raw: true,
                nest: true
            });
        } else if (currentRole === 'admin') {
            profileData = await db.Admins.findOne({ 
                where: { user_id: userId },
                raw: true 
            });
        }

        const displayName = user.full_name || `${user.last_name || ''} ${user.first_name || ''}`.trim() || user.username;
        const roleText = currentRole.charAt(0).toUpperCase() + currentRole.slice(1);

        req.user = {
            ...user,
            role: currentRole,
            roles: roles,
            name: displayName,
            avatar: user.avatar_url || '/images/avatar_default.png',
            roleText: roleText,
            roleKey: `role_${currentRole}`,
            hasRole: (r) => roles.includes(r)
        };

        if (profileData) {
            req.user[currentRole.charAt(0).toUpperCase() + currentRole.slice(1)] = profileData;
        }

        res.locals.user = req.user;
        res.locals.role = currentRole;

        return next();

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            if (req.xhr || req.path.includes('/api/')) {
                return res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' });
            }
            return res.redirect('/auth/login');
        }

        if (error.name === 'JsonWebTokenError') {
            if (req.xhr || req.path.includes('/api/')) {
                return res.status(401).json({ success: false, message: 'Invalid token', code: 'INVALID_TOKEN' });
            }
            return res.redirect('/auth/login');
        }

        console.error('Auth middleware error:', error);
        if (req.xhr || req.path.includes('/api/')) {
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
        return res.redirect('/auth/login');
    }
};