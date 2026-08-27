const mongoose = require('mongoose');
const Service = require('./serviceModel');

const reviewSchema = new mongoose.Schema(
    {
        ratings: {
            type: Number,
            min: [1, 'Min ratings value is 1.0'],
            max: [5, 'Max ratings value is 5.0'],
            required: [true, 'Review ratings is required'],
        },
        comment: {
            type: String,
            trim: true,
            maxlength: [500, 'Comment cannot exceed 500 characters'],
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'Review must belong to a user'],
        },
        service: {
            type: mongoose.Schema.ObjectId,
            ref: 'Service',
            required: [true, 'Review must belong to a service'],
        },
    },
    { timestamps: true }
);

// منع المستخدم من عمل أكثر من تقييم لنفس الخدمة
reviewSchema.index({ service: 1, user: 1 }, { unique: true });

// إظهار اسم المستخدم صاحب التقييم تلقائياً
reviewSchema.pre(/^find/, function () {
    this.populate({ path: 'user', select: 'name ' });
});

// دالة حساب المتوسط وتحديث موديل الخدمة
reviewSchema.statics.calcAverageRatingsAndQuantity = async function (serviceId) {
    const result = await this.aggregate([
        { $match: { service: serviceId } },
        {
            $group: {
                _id: '$service',
                avgRatings: { $avg: '$ratings' },
                ratingsQuantity: { $sum: 1 },
            },
        },
    ]);

    if (result.length > 0) {
        await Service.findByIdAndUpdate(serviceId, {
            ratingsAverage: Math.round(result[0].avgRatings * 10) / 10,
            ratingsQuantity: result[0].ratingsQuantity,
        });
    } else {
        await Service.findByIdAndUpdate(serviceId, {
            ratingsAverage: 0,
            ratingsQuantity: 0,
        });
    }
};

// تشغيل الحساب بعد الإنشاء
reviewSchema.post('save', async function () {
    await this.constructor.calcAverageRatingsAndQuantity(this.service);
});

// تشغيل الحساب بعد التعديل أو الحذف المباشر
reviewSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        await doc.constructor.calcAverageRatingsAndQuantity(doc.service);
    }
});

reviewSchema.post('findOneAndUpdate', async function (doc) {
    if (doc) {
        await doc.constructor.calcAverageRatingsAndQuantity(doc.service);
    }
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;