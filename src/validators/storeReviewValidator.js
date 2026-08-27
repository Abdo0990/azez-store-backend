const { check } = require('express-validator');
const validatorMiddleware = require('../middlewares/validatorMiddleware');

const RESERVED_NAMES = ['admin', 'owner', 'عزيز', 'azez', 'الدعم', 'support', 'azez store', 'ادمن', 'مدير'];

exports.createStoreReviewValidator = [
    check('name')
        .notEmpty()
        .withMessage('اسم صاحب التقييم مطلوب')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('الاسم يجب أن يكون بين حرفين و 50 حرف')
        .custom((val) => {
            const normalized = val.toLowerCase().trim();
            if (RESERVED_NAMES.some((name) => normalized.includes(name))) {
                throw new Error('لا يمكن استخدام هذا الاسم لأنه محجوز لإدارة المتجر');
            }
            return true;
        }),

    check('comment')
        .notEmpty()
        .withMessage('نص التقييم مطلوب')
        .trim()
        .isLength({ min: 2, max: 500 })
        .withMessage('التعليق يجب ألا يتجاوز 500 حرف'),

    check('ratings')
        .notEmpty()
        .withMessage('التقييم بالنجوم مطلوب')
        .isFloat({ min: 1, max: 5 })
        .withMessage('التقييم يجب أن يكون بين 1 و 5 نجوم'),

    validatorMiddleware,
];

exports.deleteStoreReviewValidator = [
    check('id')
        .isMongoId()
        .withMessage('معرف التقييم غير صالح'),
    validatorMiddleware,
];