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
    },
    { timestamps: true }
);

// فهارس تسريع الاستعلام والفرز
categorySchema.index({ isActive: 1, createdAt: -1 });

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;