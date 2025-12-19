// src/errors/ConflictError.js
const HttpError = require('./HttpError');

class ConflictError extends HttpError {
    constructor(message = "Resource already exists") {
        super(message, 409);  409
    }
}

module.exports = ConflictError;