
const session = require('express-session');

const SESSION_SECRET = process.env.SESSION_SECRET || 'dev_secret_highly_unsafe_for_prod';

const sessionMiddleware = session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        httpOnly: true, 
        sameSite: 'lax',
        
    }
    });

module.exports = sessionMiddleware;