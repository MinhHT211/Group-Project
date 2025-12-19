const authService = require('../services/authService');
const userRepository = require('../repositories/userRepository');
const { pushToast, consumeToasts } = require('../utils/sessionToast');
const { parseErrorMessage } = require('../utils/errorHelper');
const {
  UnauthorizedError,
  ValidationError,
  NotFoundError,
} = require('../errors');

class AuthController {
  constructor(authService, userRepository) {
    this.authService = authService;
    this.userRepository = userRepository;
  }

  // GET /auth/login
  getLogin = (req, res) => {
    if (req.query.logout === '1') {
      pushToast(req, { type: 'success', message: 'You have been logged out successfully.' });
    }

    const toasts = consumeToasts(req);

    return res.render('auth/login', {
      layout: 'layouts/auth',
      title: 'Login',
      pageCSS: '/css/modules/auth/login.css',
      pageJS: '/js/components/fa-eye.js',
      toasts,
    });
  };

  // POST /auth/login
  postLogin = async (req, res) => {
    try {
      const { identifier, password } = req.body;
      if (!identifier || !password) {
        pushToast(req, { type: 'error', message: 'Email/Username and password are required' });
        const toasts = consumeToasts(req);
        return res.render('auth/login', {
          layout: 'layouts/auth',
          title: 'Login',
          pageCSS: '/css/modules/auth/login.css',
          pageJS: '/js/components/fa-eye.js',
          error: 'Email/Username and password are required',
          identifier,
          toasts,
        });
      }

      const uaString = req.useragent?.source || req.headers['user-agent'] || null;
      const ip = req.ip || req.connection?.remoteAddress || null;

      const { accessToken, refreshToken, user } = await this.authService.login({
        identifier,
        password,
        ua: uaString,
        ip,
      });

      // Set cookies
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/auth',
        maxAge: 14 * 24 * 60 * 60 * 1000,
      });

      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 1000,
      });

      const { roles = [] } = user;
      pushToast(req, { type: 'success', message: 'Login successfully.' });

      // Redirect based on roles (priority)
      if (roles.includes('admin')) return res.redirect('/admin');
      if (roles.includes('assistant')) return res.redirect('/assistant');
      if (roles.includes('lecturer')) return res.redirect('/lecturer');
      if (roles.includes('student')) return res.redirect('/student');

      return res.redirect('/');
    } catch (error) {
      console.error('Login error:', error);

      // Use helper to clean error message
      const msg = parseErrorMessage(error);
      
      pushToast(req, { type: 'error', message: msg });
      const toasts = consumeToasts(req);

      return res.render('auth/login', {
        layout: 'layouts/auth',
        title: 'Login',
        pageCSS: '/css/modules/auth/login.css',
        pageJS: '/js/components/fa-eye.js',
        error: msg,
        identifier: req.body.identifier,
        toasts,
      });
    }
  };

  // GET /auth/logout
  getLogout = async (req, res) => {
    try {
      const refreshToken = req.cookies?.refresh_token;
      if (refreshToken) {
        try {
          await this.authService.logout(refreshToken);
        } catch (err) {
          console.error('Failed to revoke refresh token:', err);
        }
      }

      res.clearCookie('access_token', { path: '/' });
      res.clearCookie('refresh_token', { path: '/auth' });
      res.clearCookie('connect.sid');

      if (req.session) {
        return req.session.destroy((err) => {
          if (err) console.error('Session destroy error:', err);
          return res.redirect('/auth/login?logout=1');
        });
      }

      return res.redirect('/auth/login?logout=1');
    } catch (error) {
      console.error('Logout error:', error);
      res.clearCookie('access_token', { path: '/' });
      res.clearCookie('refresh_token', { path: '/auth' });
      res.clearCookie('connect.sid');
      return res.redirect('/auth/login');
    }
  };

  // POST /auth/refresh (API)
  postRefresh = async (req, res) => {
    try {
      const refreshToken = req.cookies?.refresh_token;
      if (!refreshToken) {
        return res.status(401).json({ success: false, message: 'Refresh token not found' });
      }

      const uaString = req.headers['user-agent'] || null;
      const ip = req.ip || req.connection?.remoteAddress || null;

      const { accessToken, refreshToken: newRefreshToken } = await this.authService.refresh({
        refreshToken,
        ua: uaString,
        ip,
      });

      res.cookie('refresh_token', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/auth',
        maxAge: 14 * 24 * 60 * 60 * 1000,
      });

      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 1000,
      });

      return res.json({ success: true, message: 'Token refreshed successfully' });
    } catch (error) {
      console.error('Refresh token error:', error);
      res.clearCookie('refresh_token', { path: '/auth' });
      res.clearCookie('access_token', { path: '/' });
      
      return res.status(401).json({ 
        success: false, 
        message: parseErrorMessage(error) 
      });
    }
  };

  // PUT /auth/change-password (user self-change)
  putChangePassword = async (req, res) => {
    try {
      const { oldPassword, newPassword, confirmPassword, confirm, nowEmail } = req.body || {};
      const confirmPwd = confirmPassword || confirm;

      if (!nowEmail) {
        throw new Error('Please enter your email to validate.');
      }

      if (!oldPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
      }

      if (confirmPwd && newPassword !== confirmPwd) {
        return res.status(400).json({ success: false, message: 'New passwords do not match' });
      }

      const result = await this.authService.changePassword({
        userId: (req.user && (req.user.user_id || req.user.sub)),
        email: nowEmail,
        oldPassword,
        newPassword,
      });

      // Clear cookies to force re-login with new credentials (optional but recommended)
      res.clearCookie('refresh_token', { path: '/auth' });
      res.clearCookie('access_token', { path: '/' });

      return res.json({ success: true, message: result.message });
    } catch (error) {
      console.error('Change password error:', error);
      return res.status(400).json({ 
        success: false, 
        message: parseErrorMessage(error) 
      });
    }
  };
}

module.exports = new AuthController(authService, userRepository);