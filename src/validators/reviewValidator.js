const { check } = require('express-validator');
const validatorMiddleware = require('../middlewares/validatorMiddleware');
const Review = require('../models/reviewModel');
const Service = require('../models/serviceModel');

exports.getReviewValidator = [
    check('id').isMongoId().withMessage('Invalid Review ID format'),
    validatorMiddleware,
];

exports.createReviewValidator = [
    check('ratings')
        .notEmpty()
        .withMessage('Rating value is required')
        .isFloat({ min: 1, max: 5 })
        .withMessage('Rating value must be between 1 and 5'),
    check('comment')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Comment cannot exceed 500 characters'),
    check('service')
        .notEmpty()
        .withMessage('Service ID is required')
        .isMongoId()
        .withMessage('Invalid Service ID format')
        .custom(async (val, { req }) => {
            // 1) التأكد من وجود الخدمة في قاعدة البيانات
            const service = await Service.findById(val);
            if (!service) {
                throw new Error(`No service found with ID: ${val}`);
            }

            // 2) فحص عدم تكرار التقييم لنفس المستخدم والخدمة
            const review = await Review.findOne({ user: req.user._id, service: val });
            if (review) {
                throw new Error('You have already created a review for this service');
            }
            return true;
        }),
    validatorMiddleware,
];

exports.updateReviewValidator = [
    check('id')
        .isMongoId()
        .withMessage('Invalid Review ID format')
        .custom(async (val, { req }) => {
            const review = await Review.findById(val);
            if (!review) {
                throw new Error(`No review found with ID: ${val}`);
            }
            // التأكد أن صاحب التقييم فقط هو من يعدله
            if (review.user._id.toString() !== req.user._id.toString()) {
                throw new Error('You are not allowed to update this review');
            }
            return true;
        }),
    check('ratings')
        .optional()
        .isFloat({ min: 1, max: 5 })
        .withMessage('Rating value must be between 1 and 5'),
    check('comment')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Comment cannot exceed 500 characters'),
    validatorMiddleware,
];

exports.deleteReviewValidator = [
    check('id')
        .isMongoId()
        .withMessage('Invalid Review ID format')
        .custom(async (val, { req }) => {
            if (req.user.role === 'user') {
                const review = await Review.findById(val);
                if (!review) {
                    throw new Error(`No review found with ID: ${val}`);
                }
                if (review.user._id.toString() !== req.user._id.toString()) {
                    throw new Error('You are not allowed to delete this review');
                }
            }
            return true;
        }),
    validatorMiddleware,
];