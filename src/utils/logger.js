const { createLogger, format, transports } = require('winston');

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
        // طباعة اللوجز في Console السيرفر ليقرأها Render في لوحة التحكم بدون أخطاء ملفات
        new transports.Console({
            format: format.combine(
                format.colorize(),
                format.printf(({ level, message, timestamp, stack }) => {
                    return `${timestamp} [${level}]: ${stack || message}`;
                })
            ),
        }),
    ],
});

module.exports = logger;