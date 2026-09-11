const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Service name is required'],
            trim: true,
            minlength: [3, 'Too short service name'],
            maxlength: [100, 'Too long service name'],
        },
        slug: {
            type: String,
            lowercase: true,
        },
        description: {
            type: String,
            trim: true,
            maxlength: [1000, 'Description cannot exceed 1000 characters'],
        },
        price: {
            type: Number,
            required: [true, 'Base price (USD) is required'],
            min: [0, 'Price cannot be negative'],
        },
        pricing: {
            vodafone_cash: { type: Number, min: 0, default: 0 },
            instapay: { type: Number, min: 0, default: 0 },
            binance_id: { type: Number, min: 0, default: 0 },
            ltc: { type: Number, min: 0, default: 0 },
            rajhi_bank: { type: Number, min: 0, default: 0 },
        },
        category: {
            type: mongoose.Schema.ObjectId,
            ref: 'Category',
            required: [true, 'Service must belong to a category'],
        },
        image: {
            type: String,
        },
        requiredFields: [
            {
                fieldName: { type: String, required: true, trim: true },
                fieldType: { type: String, enum: ['text', 'number', 'email'], default: 'text' },
                isRequired: { type: Boolean, default: true },
                placeholder: { type: String, trim: true },
            },
        ],
        isAvailable: {
            type: Boolean,
            default: true,
        },
        // حقل الترتيب داخل القسم (الرقم الأقل يظهر أولاً)
        order: {
            type: Number,
            default: 0,
        },
        ratingsAverage: {
            type: Number,
            min: [0, 'Rating must be above or equal 0'],
            max: [5, 'Rating must be below or equal 5'],
            default: 0,
        },
        ratingsQuantity: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

// فهارس تسريع الفرز والبحث حسب القسم والترتيب والسعر والتقييم
serviceSchema.index({ category: 1, order: 1, isAvailable: 1, createdAt: -1 });
serviceSchema.index({ price: 1 });
serviceSchema.index({ ratingsAverage: -1 });

serviceSchema.pre('findOneAndDelete', async function () {
    const query = this.getQuery();
    if (query._id) {
        await mongoose.model('Review').deleteMany({ service: query._id });
    }
});

const Service = mongoose.model('Service', serviceSchema);

module.exports = Service;