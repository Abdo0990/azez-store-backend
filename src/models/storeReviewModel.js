const mongoose = require('mongoose');

const storeReviewSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'اسم صاحب التقييم مطلوب'],
            trim: true,
            maxlength: [50, 'الاسم طويل جداً'],
        },
        comment: {
            type: String,
            required: [true, 'نص التقييم مطلوب'],
            trim: true,
            maxlength: [500, 'التعليق لا يمكن أن يتجاوز 500 حرف'],
        },
        ratings: {
            type: Number,
            required: [true, 'التقييم بالنجوم مطلوب'],
            min: [1, 'أقل تقييم هو 1'],
            max: [5, 'أعلى تقييم هو 5'],
        },
        deleteToken: {
            type: String,
            required: true,
            select: false,
        },
    },
    { timestamps: true }
);

// فهرس الترتيب الزمني لجلب أحدث التقييمات فوراً
storeReviewSchema.index({ createdAt: -1 });

module.exports = mongoose.model('StoreReview', storeReviewSchema);