const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Category name is required'],
            unique: [true, 'Category name must be unique'],
            trim: true,
            minlength: [2, 'Too short category name'],
            maxlength: [50, 'Too long category name'],
        },
        slug: {
            type: String,
            lowercase: true,
        },
        image: {
            type: String,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        // حقل ترتيب العرض (الرقم الأقل يظهر أولاً)
        order: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

// فهارس تسريع الاستعلام والفرز (الترتيب ثم تاريخ الإنشاء)
categorySchema.index({ isActive: 1, order: 1, createdAt: -1 });

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;