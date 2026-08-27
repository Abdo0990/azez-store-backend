const { createLogger, format, transports } = require('winston');
const path = require('path');

const logger = createLogger({
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }),
        format.splat(),
        format.json()
    ),
    defaultMeta: { service: 'azez-store-api' },
    transports: [
        // تسجيل الأخطاء فقط في ملف error.log
        new transports.File({
            filename: path.join(__dirname, '../../logs/error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // تسجيل كل الأحداث في ملف combined.log
        new transports.File({
            filename: path.join(__dirname, '../../logs/combined.log'),
            maxsize: 5242880,
            maxFiles: 5,
        }),
    ],
});

// إظهار اللوجز في شاشة الـ Console أثناء التطوير
if (process.env.NODE_ENV === 'development') {
    logger.add(
        new transports.Console({
            format: format.combine(
                format.colorize(),
                format.printf(({ level, message, timestamp, stack }) => {
                    return `${timestamp} [${level}]: ${stack || message}`;
                })
            ),
        })
    );
}

module.exports = logger;