const asyncHandler = require('express-async-handler');
const Category = require('../models/categoryModel');
const factory = require('./handlersFactory');
const ApiError = require('../utils/apiError');
const { deleteFromCloudinary } = require('../middlewares/uploadImageMiddleware');
const { clearCacheByPrefix } = require('../utils/cache');

exports.createFilterObj = (req, res, next) => {
    let filterObject = {};
    if (!req.user || req.user.role !== 'admin') {
        filterObject.isActive = true;
    }
    req.filterObj = filterObject;
    next();
};

exports.getCategories = factory.getAll(Category, 'Category', 'categories');
exports.getCategory = factory.getOne(Category, null, 'categories');
exports.createCategory = factory.createOne(Category, 'categories');

exports.updateCategory = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const existingCategory = await Category.findById(id);

    if (!existingCategory) {
        return next(new ApiError(`No category found with ID: ${id}`, 404));
    }

    if (req.body.image && existingCategory.image) {
        await deleteFromCloudinary(existingCategory.image);
    }

    const updatedCategory = await Category.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
    });

    clearCacheByPrefix('categories');

    res.status(200).json({
        success: true,
        message: 'Category updated successfully',
        data: updatedCategory,
    });
});

exports.deleteCategory = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const category = await Category.findByIdAndDelete(id);

    if (!category) {
        return next(new ApiError(`No category found with ID: ${id}`, 404));
    }

    if (category.image) {
        await deleteFromCloudinary(category.image);
    }

    clearCacheByPrefix('categories');

    res.status(204).send();
});