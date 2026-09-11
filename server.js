const path = require('path');
const dotenv = require('dotenv');

// Load Environment Variables
dotenv.config();

const logger = require('./src/utils/logger');

// 1) Catch Uncaught Exceptions
process.on('uncaughtException', (err) => {
    logger.error(`Uncaught Exception: ${err.name} | ${err.message}`, { stack: err.stack });
    process.exit(1);
});

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

const dbConnection = require('./src/config/db');
const ApiError = require('./src/utils/apiError');
const globalError = require('./src/middlewares/errorMiddleware');

const authRoute = require('./src/routes/authRoutes');
const userRoute = require('./src/routes/userRoutes');
const categoryRoute = require('./src/routes/categoryRoutes');
const serviceRoute = require('./src/routes/serviceRoutes');
const settingRoute = require('./src/routes/settingRoutes');
const orderRoute = require('./src/routes/orderRoutes');
const reviewRoute = require('./src/routes/reviewRoutes');
const storeReviewRoutes = require('./src/routes/storeReviewRoutes');
const wishlistRoute = require('./src/routes/wishlistRoutes');

// Connect to Database
dbConnection();

// Express App
const app = express();

app.set('trust proxy', 1);

// Serve Static Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Security Middlewares
app.use(helmet());

// Enable CORS
app.use(
    cors({
        origin: process.env.FRONTEND_URL || '*',
        credentials: true,
    })
);

// Rate Limiting
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: process.env.NODE_ENV === 'development' ? 1000 : 600,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 10 minutes',
    },
});
app.use('/api', limiter);

// Built-in Parsers
app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: true, limit: '20kb' }));

// Sanitize Data against NoSQL Injection
app.use((req, res, next) => {
    if (req.body) mongoSanitize.sanitize(req.body);
    if (req.params) mongoSanitize.sanitize(req.params);
    next();
});

// Prevent Parameter Pollution
app.use(
    hpp({
        whitelist: ['price', 'ratingsAverage', 'ratingsQuantity'],
    })
);

// Development Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
    logger.info('MODE: development');
} else {
    logger.info('MODE: production');
}

// Base Route
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Welcome to Azez Store API',
    });
});

// Mount Routes
app.use('/api/v1/auth', authRoute);
app.use('/api/v1/users', userRoute);
app.use('/api/v1/categories', categoryRoute);
app.use('/api/v1/services', serviceRoute);
app.use('/api/v1/settings', settingRoute);
app.use('/api/v1/orders', orderRoute);
app.use('/api/v1/reviews', reviewRoute);
app.use('/api/v1/store-reviews', storeReviewRoutes);
app.use('/api/v1/wishlist', wishlistRoute);

// Handle Unhandled Routes
app.use((req, res, next) => {
    next(new ApiError(`Cannot find this route: ${req.originalUrl}`, 404));
});

// Global Error Handling Middleware
app.use(globalError);

const PORT = process.env.PORT;
const server = app.listen(PORT, () => {
    logger.info(`Server is working `);
});

// Handle Rejections Outside Express
process.on('unhandledRejection', (err) => {
    logger.error(`Unhandled Rejection: ${err.name} | ${err.message}`, { stack: err.stack });
    server.close(() => {
        process.exit(1);
    });
});