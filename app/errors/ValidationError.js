// src/errors/ValidationError.js
const HttpError = require('./HttpError');

class ValidationError extends HttpError {
    constructor(message = "Invalid input data") {
        super(message, 422); 
    }
}

module.exports = ValidationError;