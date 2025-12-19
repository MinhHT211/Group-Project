// src/errors/index.js

const HttpError = require('./HttpError');
const NotFoundError = require('./NotFoundError');
const UnauthorizedError = require('./UnauthorizedError');
const ForbiddenError = require('./ForbiddenError');
const ValidationError = require('./ValidationError');
const ConflictError = require('./ConflictError');

module.exports = {
    HttpError,
    NotFoundError,
    UnauthorizedError,
    ForbiddenError,
    ValidationError,
    ConflictError,
};