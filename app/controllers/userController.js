const { verifyAccessToken } = require('../utils/jwt');
const authService = require('../services/authService');
const userRepo = require('../repositories/userRepository');
const { parseErrorMessage } = require('../utils/errorHelper');

// Helper: map role -> dashboard path
function getDashboardPath(roles = []) {
  if (roles.includes('admin')) return '/admin';
  if (roles.includes('assistant')) return '/assistant';
  if (roles.includes('lecturer')) return '/lecturer';
  if (roles.includes('student')) return '/student';
  return '/user';
}

exports.getLoadingCheck = async (req, res) => {
  try {
    const accessToken = req.cookies?.access_token || null;
    const refreshToken = req.cookies?.refresh_token || null;

    if (accessToken) {
      try {
        const decoded = verifyAccessToken(accessToken); 
        const roles = await userRepo.getUserRoles(decoded.sub);
        return res.redirect(getDashboardPath(roles));
      } catch (error) {

      }
    }

    if (refreshToken) {
      try {
        const { accessToken: newAccess, refreshToken: newRefresh } =
          await authService.refresh({
            refreshToken,
            ua: req.headers['user-agent'],
            ip: req.ip,
          });

        res.cookie('refresh_token', newRefresh, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/auth',
          maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
        });
        res.cookie('access_token', newAccess, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
          maxAge: 60 * 60 * 1000, // 1 hour
        });

        const decoded = verifyAccessToken(newAccess);
        const roles = await userRepo.getUserRoles(decoded.sub);
        return res.redirect(getDashboardPath(roles));
      } catch (error) {
        console.error('Refresh token failed in loading check:', parseErrorMessage(error));
      }
    }
    
    return res.render('shared/loadingCheck', {
      layout: 'layouts/shared',
      title: 'Checking User',
      message: 'You are not logged in',
      redirectUrl: '/auth/login',
    });
  } catch (err) {
    console.error('Controller Error - getLoadingCheck:', parseErrorMessage(err));
    return res.redirect('/auth/login');
  }
};