const express = require('express');
const rateLimit = require('express-rate-limit');
const {
    signup,
    verifyEmail,
    login,
    getLoggedUserData,
    forgotPassword,
    verifyPassResetCode,
    resetPassword,
} = require('../controllers/authController');

const {
    signupValidator,
    verifyEmailValidator,
    loginValidator,
    forgotPasswordValidator,
    verifyPassResetCodeValidator,
    resetPasswordValidator,
} = require('../validators/authValidator');

const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// 1) حماية مسار التحقق من التخمين المتكرر للكود
const verifyLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 دقائق
    max: 5, // أقصى حد 5 محاولات
    message: {
        success: false,
        message: 'Too many verification attempts, please try again after 10 minutes',
    },
});

const sendEmailLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // ساعة
    max: process.env.NODE_ENV === 'development' ? 1000 : 10,
    message: {
        success: false,
        message: 'Too many email requests from this IP, please try again after an hour',
    },
});

// 2) حماية مسار التسجيل من استهلاك سيرفر الإيميل (Email Spamming)
const signupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // ساعة
    max: process.env.NODE_ENV === 'development' ? 1000 : 15, // رفع الحد لـ 1000 طلب أثناء التجربة
    message: {
        success: false,
        message: 'Too many accounts created from this IP, please try again after an hour',
    },
});

// 3) حماية مسار تسجيل الدخول من محاولات التخمين (Brute Force)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 دقيقة
    max: process.env.NODE_ENV === 'development' ? 1000 : 20, // رفع الحد لـ 1000 طلب أثناء التجربة
    message: {
        success: false,
        message: 'Too many login attempts from this IP, please try again after 15 minutes',
    },
});

router.post('/signup', sendEmailLimiter, signupValidator, signup);
router.post('/verify-email', verifyLimiter, verifyEmailValidator, verifyEmail);
router.post('/login', loginLimiter, loginValidator, login);
router.get('/me', protect, getLoggedUserData);
router.post('/forgotPassword', sendEmailLimiter, forgotPasswordValidator, forgotPassword);
router.post('/verifyResetCode', verifyLimiter, verifyPassResetCodeValidator, verifyPassResetCode);
router.put('/resetPassword', loginLimiter, resetPasswordValidator, resetPassword);



module.exports = router;