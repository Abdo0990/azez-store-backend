const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            required: [true, 'User name is required'],
            minlength: [3, 'Too short user name'],
            maxlength: [50, 'Too long user name'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        phone: {
            type: String,
            trim: true,
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false,
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        wishlist: [
            {
                type: mongoose.Schema.ObjectId,
                ref: 'Service',
            },
        ],
        passwordChangedAt: Date,

        passwordResetCode: String,
        passwordResetExpires: Date,
        passwordResetVerified: Boolean,
    },
    { timestamps: true }
);

// فهارس تسريع فلترة المستخدمين والفرز الزمني
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const isAlreadyHashed = /^\$2[abxy]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(this.password);
    if (isAlreadyHashed) return;

    this.password = await bcrypt.hash(this.password, 12);
});

userSchema.pre('findOneAndDelete', async function () {
    const query = this.getQuery();
    if (query._id) {
        const Review = mongoose.model('Review');
        const userReviews = await Review.find({ user: query._id });
        await Review.deleteMany({ user: query._id });

        for (const review of userReviews) {
            await Review.calcAverageRatingsAndQuantity(review.service);
        }
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;