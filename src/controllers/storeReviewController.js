const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const StoreReview = require('../models/storeReviewModel');
const ApiError = require('../utils/apiError');

// @desc    Get all store reviews
// @route   GET /api/v1/store-reviews
// @access  Public
exports.getStoreReviews = asyncHandler(async (req, res, next) => {
    const reviews = await StoreReview.find().sort({ createdAt: -1 });
    res.status(200).json({
        success: true,
        count: reviews.length,
        data: reviews,
    });
});

// @desc    Create new public store review
// @route   POST /api/v1/store-reviews
// @access  Public
exports.createStoreReview = asyncHandler(async (req, res, next) => {
    const { name, comment, ratings } = req.body;

    // 1) توليد توكن عشوائي قوي وتشفيره قبل الحفظ
    const rawDeleteToken = crypto.randomBytes(32).toString('hex');
    const hashedDeleteToken = crypto
        .createHash('sha256')
        .update(rawDeleteToken)
        .digest('hex');

    const review = await StoreReview.create({
        name,
        comment,
        ratings,
        deleteToken: hashedDeleteToken,
    });

    res.status(201).json({
        success: true,
        message: 'تمت إضافة التقييم بنجاح',
        data: {
            _id: review._id,
            name: review.name,
            comment: review.comment,
            ratings: review.ratings,
            createdAt: review.createdAt,
        },
        deleteToken: rawDeleteToken, // يُرسل التوكن الأصلي للمتصفح فقط
    });
});

// @desc    Delete store review (By Owner with token OR Admin with auth)
// @route   DELETE /api/v1/store-reviews/:id
// @access  Public / Admin
exports.deleteStoreReview = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const clientToken = req.headers['x-delete-token'] || req.body?.deleteToken;

    const review = await StoreReview.findById(id).select('+deleteToken');
    if (!review) {
        return next(new ApiError('التقييم غير موجود', 404));
    }

    const isAdmin = req.user && req.user.role === 'admin';

    let isOwner = false;
    if (clientToken && review.deleteToken) {
        const hashedClientToken = crypto
            .createHash('sha256')
            .update(String(clientToken).trim())
            .digest('hex');

        isOwner = (hashedClientToken === review.deleteToken);
    }

    if (!isAdmin && !isOwner) {
        return next(new ApiError('غير مصرح لك بحذف هذا التقييم', 403));
    }

    await StoreReview.findByIdAndDelete(id);

    res.status(200).json({
        success: true,
        message: 'تم حذف التقييم بنجاح',
    });
});