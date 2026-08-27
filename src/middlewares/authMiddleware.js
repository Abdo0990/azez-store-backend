const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const User = require('../models/userModel');

// توليد الـ Token
exports.generateToken = (userId) =>
    jwt.sign({ userId }, process.env.JWT_SECRET_KEY, {
        expiresIn: process.env.JWT_EXPIRE_TIME,
    });

// التأكد من تسجيل الدخول (Protect Routes)
exports.protect = asyncHandler(async (req, res, next) => {
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(
            new ApiError('You are not logged in, please login to get access', 401)
        );
    }

    // 1) Verify Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    // 2) Check if User still exists
    const currentUser = await User.findById(decoded.userId);
    if (!currentUser) {
        return next(
            new ApiError('The user belonging to this token no longer exists', 401)
        );
    }

    // 3) Check if user is active
    if (!currentUser.isActive) {
        return next(new ApiError('This account has been deactivated', 401));
    }

    // 4) Check if user changed password after token was created
    if (currentUser.passwordChangedAt) {
        const passChangedTimestamp = parseInt(
            currentUser.passwordChangedAt.getTime() / 1000,
            10
        );
        // إلغاء صلاحية التوكن إذا تم تغيير كلمة المرور بعد إنشائه
        if (passChangedTimestamp > decoded.iat) {
            return next(
                new ApiError('User recently changed password! Please login again.', 401)
            );
        }
    }

    req.user = currentUser;
    next();
});

// السماح فقط لأدوار محددة (مثل: Admin)
exports.allowedTo = (...roles) =>
    asyncHandler(async (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(
                new ApiError('You do not have permission to perform this action', 403)
            );
        }
        next();
    });