const { check } = require('express-validator');
const validatorMiddleware = require('../middlewares/validatorMiddleware');
const User = require('../models/userModel');

exports.signupValidator = [
    check('name')
        .notEmpty()
        .withMessage('User name is required')
        .isLength({ min: 3 })
        .withMessage('Too short user name')
        .isLength({ max: 50 })
        .withMessage('Too long user name'),

    check('email')
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Invalid email address')
        .toLowerCase() // توحيد الحروف الصغيرة
        .custom(async (val) => {
            const user = await User.findOne({ email: val });
            if (user) {
                throw new Error('E-mail already in use');
            }
            return true;
        }),

    check('phone')
        .optional()
        .isMobilePhone(['ar-EG', 'ar-SA', 'ar-AE'])
        .withMessage('Invalid phone number'),

    check('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),

    check('passwordConfirm')
        .notEmpty()
        .withMessage('Password confirmation is required')
        .custom((val, { req }) => {
            if (val !== req.body.password) {
                throw new Error('Password confirmation incorrect');
            }
            return true;
        }),

    check('role')
        .not()
        .exists()
        .withMessage('You cannot specify a role during registration'),

    validatorMiddleware,
];

exports.verifyEmailValidator = [
    check('email')
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Invalid email address')
        .toLowerCase(),

    check('code')
        .notEmpty()
        .withMessage('Verification code is required')
        .isNumeric()
        .withMessage('Verification code must be numeric only')
        .isLength({ min: 6, max: 6 })
        .withMessage('Verification code must be exactly 6 digits'),

    validatorMiddleware,
];

exports.loginValidator = [
    check('email')
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Invalid email address')
        .toLowerCase(),

    check('password')
        .notEmpty()
        .withMessage('Password is required'),

    validatorMiddleware,
];

exports.forgotPasswordValidator = [
    check('email')
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Invalid email address')
        .toLowerCase(),
    validatorMiddleware,
];

exports.verifyPassResetCodeValidator = [
    check('email')
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Invalid email address')
        .toLowerCase(),
    check('code')
        .notEmpty()
        .withMessage('Reset code is required')
        .isNumeric()
        .isLength({ min: 6, max: 6 })
        .withMessage('Reset code must be exactly 6 digits'),
    validatorMiddleware,
];

exports.resetPasswordValidator = [
    check('email')
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Invalid email address')
        .toLowerCase(),
    check('newPassword')
        .notEmpty()
        .withMessage('New password is required')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
    check('passwordConfirm')
        .notEmpty()
        .withMessage('Password confirmation is required')
        .custom((val, { req }) => {
            if (val !== req.body.newPassword) {
                throw new Error('Password confirmation incorrect');
            }
            return true;
        }),
    validatorMiddleware,
];