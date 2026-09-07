const asyncHandler = require('express-async-handler');
const Review = require('../models/reviewModel');
const factory = require('./handlersFactory');
const ApiError = require('../utils/apiError');
const { clearCacheByPrefix } = require('../utils/cache');

// ضبط filterObject لجلب تقييمات خدمة معينة من الـ Nested Route
exports.createFilterObj = (req, res, next) => {
    let filterObject = {};
    if (req.params.serviceId) filterObject = { service: req.params.serviceId };
    req.filterObj = filterObject;
    next();
};

// ضبط معرف الخدمة والمستخدم تلقائياً عند إنشاء تقييم
exports.setServiceIdAndUserIdToBody = (req, res, next) => {
    if (!req.body.service) req.body.service = req.params.serviceId;
    if (!req.body.user) req.body.user = req.user._id;
    next();
};

exports.getReviews = factory.getAll(Review, 'Review', 'reviews');
exports.getReview = factory.getOne(Review, undefined, 'reviews');

// إنشاء تقييم مع تفريغ كاش الخدمات والتقييمات
exports.createReview = asyncHandler(async (req, res, next) => {
    const newDoc = await Review.create(req.body);

    // مسح كاش الخدمات لتحديث التقييم في الكروت فوراً
    clearCacheByPrefix('services');
    clearCacheByPrefix('reviews');

    res.status(201).json({
        success: true,
        message: 'Review created successfully',
        data: newDoc,
    });
});

// تعديل تقييم مع إعادة الحساب
exports.updateReview = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const document = await Review.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
    });

    if (!document) {
        return next(new ApiError(`No review found with this id: ${id}`, 404));
    }

    // تشغيل الحساب يدوياً للتأكيد
    await Review.calcAverageRatingsAndQuantity(document.service);

    clearCacheByPrefix('services');
    clearCacheByPrefix('reviews');

    res.status(200).json({
        success: true,
        message: 'Review updated successfully',
        data: document,
    });
});

// حذف تقييم مع إعادة الحساب فوراً
exports.deleteReview = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const document = await Review.findById(id);

    if (!document) {
        return next(new ApiError(`No review found with this id: ${id}`, 404));
    }

    const serviceId = document.service;

    // حذف التقييم
    await Review.findByIdAndDelete(id);

    // إعادة حساب المتوسط فوراً بعد الحذف
    await Review.calcAverageRatingsAndQuantity(serviceId);

    // تفريغ كاش الخدمات والتقييمات
    clearCacheByPrefix('services');
    clearCacheByPrefix('reviews');

    res.status(200).json({
        success: true,
        message: 'Review deleted successfully',
        data: null,
    });
});