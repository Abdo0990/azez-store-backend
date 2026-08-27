const { check } = require('express-validator');
const bcrypt = require('bcrypt');
const validatorMiddleware = require('../middlewares/validatorMiddleware');
const User = require('../models/userModel');

// 1) Get User / Delete User Validator
exports.getUserValidator = [
    check('id').isMongoId().withMessage('Invalid User id format'),
    validatorMiddleware,
];

exports.deleteUserValidator = [
    check('id').isMongoId().withMessage('Invalid User id format'),
    validatorMiddleware,
];

// 2) Create User Validator (Admin)
exports.createUserValidator = [
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
        .toLowerCase()
        .custom(async (val) => {
            const user = await User.findOne({ email: val });
            if (user) {
                throw new Error('E-mail already in use');
            }
            return true;
        }),

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
        .optional()
        .isIn(['user', 'admin'])
        .withMessage('Invalid role'),

    check('phone')
        .optional()
        .isMobilePhone(['ar-EG', 'ar-SA', 'ar-AE'])
        .withMessage('Invalid phone number'),

    validatorMiddleware,
];

// 3) Update User Validator (Admin)
exports.updateUserValidator = [
    check('id').isMongoId().withMessage('Invalid User id format'),

    check('name')
        .optional()
        .isLength({ min: 3 })
        .withMessage('Too short user name')
        .isLength({ max: 50 })
        .withMessage('Too long user name'),

    check('email')
        .optional()
        .isEmail()
        .withMessage('Invalid email address')
        .toLowerCase()
        .custom(async (val, { req }) => {
            const user = await User.findOne({ email: val });
            if (user && user._id.toString() !== req.params.id) {
                throw new Error('E-mail already in use by another user');
            }
            return true;
        }),

    check('phone')
        .optional()
        .isMobilePhone(['ar-EG', 'ar-SA', 'ar-AE'])
        .withMessage('Invalid phone number'),

    check('role')
        .optional()
        .isIn(['user', 'admin'])
        .withMessage('Invalid role'),

    validatorMiddleware,
];

// 4) Change User Password Validator (Admin)
exports.changeUserPasswordValidator = [
    check('id').isMongoId().withMessage('Invalid User id format'),
    check('password')
        .notEmpty()
        .withMessage('New password is required')
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
    validatorMiddleware,
];

// 5) Change Logged User Password Validator
exports.changeLoggedUserPasswordValidator = [
    check('currentPassword')
        .notEmpty()
        .withMessage('Current password is required')
        .custom(async (val, { req }) => {
            const user = await User.findById(req.user._id).select('+password');
            const isCorrectPassword = await bcrypt.compare(val, user.password);
            if (!isCorrectPassword) {
                throw new Error('Current password is wrong');
            }
            return true;
        }),
    check('password')
        .notEmpty()
        .withMessage('New password is required')
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
    validatorMiddleware,
];

// 6) Update Logged User Data Validator
exports.updateLoggedUserValidator = [
    check('name')
        .optional()
        .isLength({ min: 3 })
        .withMessage('Too short user name')
        .isLength({ max: 50 })
        .withMessage('Too long user name'),
    check('phone')
        .optional()
        .isMobilePhone(['ar-EG', 'ar-SA', 'ar-AE'])
        .withMessage('Invalid phone number'),
    check('email')
        .not()
        .exists()
        .withMessage('Email cannot be changed from this endpoint'),
    validatorMiddleware,
];