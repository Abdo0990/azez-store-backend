const asyncHandler = require('express-async-handler');
const Category = require('../models/categoryModel');
const factory = require('./handlersFactory');
const ApiError = require('../utils/apiError');
const { deleteFromCloudinary } = require('../middlewares/uploadImageMiddleware');
const { clearCacheByPrefix } = require('../utils/cache');
const mongoose = require('mongoose');

exports.createFilterObj = (req, res, next) => {
    let filterObject = {};
    if (!req.user || req.user.role !== 'admin') {
        filterObject.isActive = true;
    }
    req.filterObj = filterObject;

    // الفرز الافتراضي: حسب حقل order تصاعدياً ثم الأحدث
    if (!req.query.sort) {
        req.query.sort = 'order,createdAt';
    }

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

// ميزة إعادة ترتيب كل الأقسام دفعة واحدة (Bulk Update)
// تستقبل مصفوفة: [{ id: "...", order: 1 }, { id: "...", order: 2 }]
exports.reorderCategories = asyncHandler(async (req, res, next) => {
    const { orders } = req.body;

    if (!Array.isArray(orders)) {
        return next(new ApiError('Orders must be an array of objects containing id and order', 400));
    }

    const bulkOps = orders.map((item) => ({
        updateOne: {
            filter: { _id: new mongoose.Types.ObjectId(item.id) },
            update: { $set: { order: Number(item.order) } },
        },
    }));

    await Category.bulkWrite(bulkOps);

    // تفريغ كاش الأقسام بالكامل لضمان جلب البيانات المحدثة
    clearCacheByPrefix('categories');

    res.status(200).json({
        success: true,
        message: 'Categories reordered successfully',
    });
});