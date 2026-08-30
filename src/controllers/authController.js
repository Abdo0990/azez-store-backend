const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
const User = require('../models/userModel');
const PendingUser = require('../models/pendingUserModel');
const ApiError = require('../utils/apiError');
const sendEmail = require('../utils/sendEmail');
const { generateToken } = require('../middlewares/authMiddleware');

// @desc    Initiate Signup & Send Confirmation Email
// @route   POST /api/v1/auth/signup
// @access  Public
exports.signup = asyncHandler(async (req, res, next) => {
    const { name, email, password, phone } = req.body;

    // 1) Generate random 6-digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 2) Hash code for security
    const hashedCode = crypto
        .createHash('sha256')
        .update(verificationCode)
        .digest('hex');

    const hashedPassword = await bcrypt.hash(password, 12);

    // 3) Atomic Upsert: Update if exists or Create new one
    await PendingUser.findOneAndUpdate(
        { email },
        {
            name,
            email,
            password: hashedPassword,
            phone,
            verificationCode: hashedCode,
            verificationCodeExpires: Date.now() + 10 * 60 * 1000,
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    // 4) Send Email
    const message = `
    <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #4CAF50;">مرحباً بك في Azez Store!</h2>
      <p>كود التحقق الخاص بحسابك هو:</p>
      <h1 style="letter-spacing: 5px; color: #333; background: #f4f4f4; padding: 10px 20px; display: inline-block; border-radius: 5px;">${verificationCode}</h1>
      <p style="color: #888; font-size: 13px;">هذا الكود صالح لمدة 10 دقائق فقط.</p>
    </div>
  `;

    try {
        await sendEmail({
            email,
            subject: 'Azez Store - كود تفعيل الحساب',
            html: message,
        });
    } catch (error) {
        console.error('❌ Nodemailer Error Details:', error);
        await PendingUser.deleteOne({ email });
        return next(new ApiError(`فشل في إرسال بريد التفعيل: ${error.message || 'خطأ في خادم البريد'}`, 500));
    }

    res.status(200).json({
        success: true,
        message: 'Verification code sent to your email. Please verify to complete registration.',
    });
});

// @desc    Verify Confirmation Code & Create User
// @route   POST /api/v1/auth/verify-email
// @access  Public
exports.verifyEmail = asyncHandler(async (req, res, next) => {
    const { email, code } = req.body;

    const hashedCode = crypto
        .createHash('sha256')
        .update(code)
        .digest('hex');

    const pendingUser = await PendingUser.findOne({
        email,
        verificationCode: hashedCode,
        verificationCodeExpires: { $gt: Date.now() },
    });

    if (!pendingUser) {
        return next(new ApiError('Invalid or expired verification code', 400));
    }

    const user = await User.create({
        name: pendingUser.name,
        email: pendingUser.email,
        password: pendingUser.password,
        phone: pendingUser.phone,
    });

    await PendingUser.deleteOne({ _id: pendingUser._id });

    const token = generateToken(user._id);

    res.status(201).json({
        success: true,
        message: 'Account successfully verified and created',
        data: {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
        },
        token,
    });
});
// @desc    Login user / admin
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return next(new ApiError('Invalid email or password', 401));
    }

    if (!user.isActive) {
        return next(new ApiError('This account is deactivated', 401));
    }

    const token = generateToken(user._id);

    res.status(200).json({
        success: true,
        message: 'Logged in successfully',
        data: {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
        },
        token,
    });
});

// @desc    Get Current Logged in User Profile
// @route   GET /api/v1/auth/me
// @access  Protected
exports.getLoggedUserData = asyncHandler(async (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.status(200).json({
        success: true,
        data: {
            _id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            phone: req.user.phone,
            role: req.user.role,
        },
    });
});

// 1) إرسال كود الاستعادة عبر البريد
exports.forgotPassword = asyncHandler(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email.toLowerCase() });
    if (!user) {
        return next(new ApiError('There is no user with that email address', 404));
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedResetCode = crypto.createHash('sha256').update(resetCode).digest('hex');

    user.passwordResetCode = hashedResetCode;
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 دقائق
    user.passwordResetVerified = false;
    await user.save({ validateBeforeSave: false });

    const message = `
      <div style="direction: rtl; text-align: right; font-family: Arial; padding: 20px;">
        <h2>طلب إعادة تعيين كلمة المرور</h2>
        <p>كود إعادة التعيين الخاص بك هو:</p>
        <h1 style="background: #eee; display: inline-block; padding: 10px 20px;">${resetCode}</h1>
        <p>صالح لمدة 10 دقائق فقط.</p>
      </div>
    `;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Azez Store - كود إعادة تعيين كلمة المرور',
            html: message,
        });
    } catch (err) {
        user.passwordResetCode = undefined;
        user.passwordResetExpires = undefined;
        user.passwordResetVerified = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new ApiError('There was an error sending the email. Try again later.', 500));
    }

    res.status(200).json({
        success: true,
        message: 'Reset code sent to your email',
    });
});

// 2) التحقق من صحة الكود
exports.verifyPassResetCode = asyncHandler(async (req, res, next) => {
    const hashedResetCode = crypto.createHash('sha256').update(req.body.code).digest('hex');

    const user = await User.findOne({
        email: req.body.email.toLowerCase(),
        passwordResetCode: hashedResetCode,
        passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
        return next(new ApiError('Reset code is invalid or has expired', 400));
    }

    user.passwordResetVerified = true;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true,
        message: 'Reset code verified successfully',
    });
});

// 3) تعيين كلمة المرور الجديدة
exports.resetPassword = asyncHandler(async (req, res, next) => {
    const user = await User.findOne({
        email: req.body.email.toLowerCase(),
        passwordResetVerified: true,
    });

    if (!user) {
        return next(new ApiError('Please verify the reset code first', 400));
    }

    user.password = req.body.newPassword;
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetVerified = undefined;
    user.passwordChangedAt = Date.now();
    await user.save();

    const token = generateToken(user._id);
    res.status(200).json({
        success: true,
        message: 'Password reset successfully',
        token,
    });
});