const slugify = require('slugify');
const { check } = require('express-validator');
const validatorMiddleware = require('../middlewares/validatorMiddleware');
const Category = require('../models/categoryModel');
const Service = require('../models/serviceModel');

exports.getServiceValidator = [
    check('id').isMongoId().withMessage('Invalid service ID format'),
    validatorMiddleware,
];

exports.createServiceValidator = [
    check('name')
        .notEmpty()
        .withMessage('Service name is required')
        .trim()
        .isLength({ min: 3 })
        .withMessage('Too short service name')
        .isLength({ max: 100 })
        .withMessage('Too long service name')
        .custom((val, { req }) => {
            req.body.slug = slugify(val.trim(), { lower: true });
            return true;
        }),
    check('description')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Description cannot exceed 1000 characters'),
    check('price')
        .notEmpty()
        .withMessage('Base USD price is required')
        .isFloat({ min: 0 })
        .withMessage('Price must be a valid positive number'),
    check('pricing')
        .optional()
        .customSanitizer((val) => {
            if (typeof val === 'string') {
                try {
                    return JSON.parse(val);
                } catch {
                    return val;
                }
            }
            return val;
        }),
    check('category')
        .notEmpty()
        .withMessage('Service category is required')
        .isMongoId()
        .withMessage('Invalid category ID format')
        .custom(async (categoryId) => {
            const category = await Category.findById(categoryId);
            if (!category) {
                throw new Error(`No category found with this ID: ${categoryId}`);
            }
            return true;
        }),
    check('requiredFields')
        .optional()
        .customSanitizer((val) => {
            if (typeof val === 'string') {
                try {
                    return JSON.parse(val);
                } catch {
                    return val;
                }
            }
            return val;
        })
        .isArray()
        .withMessage('requiredFields must be an array of field objects'),
    validatorMiddleware,
];

exports.updateServiceValidator = [
    check('id').isMongoId().withMessage('Invalid service ID format'),
    check('name')
        .optional()
        .trim()
        .isLength({ min: 3 })
        .withMessage('Too short service name')
        .isLength({ max: 100 })
        .withMessage('Too long service name')
        .custom((val, { req }) => {
            req.body.slug = slugify(val.trim(), { lower: true });
            return true;
        }),
    check('description')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Description cannot exceed 1000 characters'),
    check('price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Price must be a valid positive number'),
    check('pricing')
        .optional()
        .customSanitizer((val) => {
            if (typeof val === 'string') {
                try {
                    return JSON.parse(val);
                } catch {
                    return val;
                }
            }
            return val;
        }),
    check('category')
        .optional()
        .isMongoId()
        .withMessage('Invalid category ID format')
        .custom(async (categoryId) => {
            const category = await Category.findById(categoryId);
            if (!category) {
                throw new Error(`No category found with this ID: ${categoryId}`);
            }
            return true;
        }),
    check('requiredFields')
        .optional()
        .customSanitizer((val) => {
            if (typeof val === 'string') {
                try {
                    return JSON.parse(val);
                } catch {
                    return val;
                }
            }
            return val;
        })
        .isArray()
        .withMessage('requiredFields must be an array of field objects'),
    validatorMiddleware,
];

exports.deleteServiceValidator = [
    check('id')
        .isMongoId()
        .withMessage('Invalid service ID format')
        .custom(async (val) => {
            const service = await Service.findById(val);
            if (!service) {
                throw new Error(`No service found with this ID: ${val}`);
            }
            return true;
        }),
    validatorMiddleware,
];