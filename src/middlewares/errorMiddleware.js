const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

const handleJwtInvalidSignature = () =>
    new ApiError('Invalid token, please login again...', 401);

const handleJwtExpired = () =>
    new ApiError('Expired token, please login again...', 401);

const handleCastErrorDB = (err) =>
    new ApiError(`Invalid value '${err.value}' for field: ${err.path}`, 400);

const handleDuplicateFieldsDB = (err) => {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return new ApiError(`Duplicate field value for '${field}'. Please use another value.`, 400);
};

const globalError = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    error.name = err.name;
    error.statusCode = err.statusCode || 500;
    error.status = err.status || 'error';

    // معالجة أخطاء JWT و Mongoose وتحويلها إلى Status Codes صحيحة
    if (error.name === 'JsonWebTokenError') error = handleJwtInvalidSignature();
    if (error.name === 'TokenExpiredError') error = handleJwtExpired();
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);

    // تسجيل أخطاء السيرفر 500
    if (error.statusCode === 500 && logger) {
        logger.error(`${error.statusCode} - ${error.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`, {
            stack: err.stack,
        });
    }

    if (process.env.NODE_ENV === 'development') {
        res.status(error.statusCode).json({
            status: error.status,
            error: err,
            message: error.message,
            stack: err.stack,
        });
    } else {
        res.status(error.statusCode).json({
            status: error.status,
            message: error.message,
        });
    }
};

module.exports = globalError;