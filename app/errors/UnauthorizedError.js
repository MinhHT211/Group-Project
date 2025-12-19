const HttpError = require('./HttpError');

class UnauthorizedError extends HttpError {
    constructor(message = "Authentication failed or token is invalid") {
        super(message, 401); 
    }
}

module.exports = UnauthorizedError;