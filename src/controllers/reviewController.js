const Review = require('../models/reviewModel');
const factory = require('./handlersFactory');

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

exports.getReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);