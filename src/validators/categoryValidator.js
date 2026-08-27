const slugify = require('slugify');
const { check } = require('express-validator');
const validatorMiddleware = require('../middlewares/validatorMiddleware');
const Category = require('../models/categoryModel');
const Service = require('../models/serviceModel');

exports.getCategoryValidator = [
    check('id').isMongoId().withMessage('Invalid category ID format'),
    validatorMiddleware,
];

exports.createCategoryValidator = [
    check('name')
        .notEmpty()
        .withMessage('Category name is required')
        .trim()
        .isLength({ min: 2 })
        .withMessage('Too short category name')
        .isLength({ max: 50 })
        .withMessage('Too long category name')
        .custom(async (val, { req }) => {
            const category = await Category.findOne({ name: val.trim() });
            if (category) {
                throw new Error('Category already exists');
            }
            req.body.slug = slugify(val.trim(), { lower: true });
            return true;
        }),
    validatorMiddleware,
];

exports.updateCategoryValidator = [
    check('id').isMongoId().withMessage('Invalid category ID format'),
    check('name')
        .optional()
        .trim()
        .isLength({ min: 2 })
        .withMessage('Too short category name')
        .isLength({ max: 50 })
        .withMessage('Too long category name')
        .custom(async (val, { req }) => {
            const category = await Category.findOne({ name: val.trim() });
            if (category && category._id.toString() !== req.params.id) {
                throw new Error('Category name already in use');
            }
            req.body.slug = slugify(val.trim(), { lower: true });
            return true;
        }),
    validatorMiddleware,
];

exports.deleteCategoryValidator = [
    check('id')
        .isMongoId()
        .withMessage('Invalid category ID format')
        .custom(async (val) => {
            const category = await Category.findById(val);
            if (!category) {
                throw new Error(`No category found with this ID: ${val}`);
            }
            const servicesCount = await Service.countDocuments({ category: val });
            if (servicesCount > 0) {
                throw new Error(
                    `Cannot delete this category. It contains ${servicesCount} associated service(s). Delete them first.`
                );
            }
            return true;
        }),
    validatorMiddleware,
];