const jwt = require("jsonwebtoken");
const UnauthorizedError = require("../errors/UnauthorizedError");


const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'secret_key_access';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'secret_key_refresh';
const ACCESS_TOKEN_EXP = process.env.ACCESS_TOKEN_EXP || '1h';
const REFRESH_TOKEN_EXP = process.env.REFRESH_TOKEN_EXP || '14d';

exports.generateAccessToken = (payload) => {
    return jwt.sign(
        {
            sub: payload.sub,
            email: payload.email,
            roles: payload.roles || [],
        },
        ACCESS_TOKEN_SECRET,
        { expiresIn: ACCESS_TOKEN_EXP }
    );
};

exports.generateRefreshToken = (payload) => {
    return jwt.sign(
        { sub: payload.sub },
        REFRESH_TOKEN_SECRET,
        { expiresIn: REFRESH_TOKEN_EXP }
    );
};

exports.verifyAccessToken = (token) => {
  try{
      return jwt.verify(token, ACCESS_TOKEN_SECRET);

  }catch(err){
    if(err.name === 'TokenExpiredError') throw err;
      throw new UnauthorizedError('Invalid or expired access token');
  }
};

exports.verifyRefreshToken = (token) => {
  try{
    return jwt.verify(token, REFRESH_TOKEN_SECRET);
  }catch(err){
    if (err.name === 'TokenExpiredError') throw err;
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
};