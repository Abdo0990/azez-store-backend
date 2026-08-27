const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

const handleJwtInvalidSignature = () =>
    new ApiError('Invalid token, please login again...', 401);

const handleJwtExpired = () =>
    new ApiError('Expired token, please login again...', 401);

const handleCastErrorDB = (err) =>
    new ApiError(`Invalid value '${err.value}' for field: ${err.path}`, 400);

const handleDuplicateFieldsDB = (err) => {
    const field = Object.keys(err.keyValue)[0];
    return new ApiError(`Duplicate field value for '${field}'. Please use another value.`, 400);
};

const handleSyntaxError = () =>
    new ApiError('Invalid JSON payload provided. Please check request body syntax.', 400);

const globalError = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // تسجيل أي خطأ سيرفر 500 تلقائياً في ملف error.log
    if (err.statusCode === 500) {
        logger.error(`${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`, {
            stack: err.stack,
        });
    }

    if (process.env.NODE_ENV === 'development') {
        res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack,
        });
    } else {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    }
};

module.exports = globalError;