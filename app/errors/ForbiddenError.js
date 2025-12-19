const HttpError = require('./HttpError');

class ForbiddenError extends HttpError {
    constructor(message = "Access denied") {
        super(message, 403); 
    }
}

module.exports = ForbiddenError;