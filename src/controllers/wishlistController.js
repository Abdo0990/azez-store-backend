const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');

// @desc    إضافة خدمة إلى المفضلة
// @route   POST /api/v1/wishlist
// @access  Protected/User
exports.addToWishlist = asyncHandler(async (req, res, next) => {
    // $addToSet تضمن عدم تكرار الـ ID في المصفوفة
    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $addToSet: { wishlist: req.body.serviceId } },
        { new: true }
    ).populate('wishlist');

    res.status(200).json({
        status: 'success',
        message: 'تمت إضافة الخدمة إلى المفضلة بنجاح',
        data: user.wishlist,
    });
});

// @desc    حذف خدمة من المفضلة
// @route   DELETE /api/v1/wishlist/:serviceId
// @access  Protected/User
exports.removeFromWishlist = asyncHandler(async (req, res, next) => {
    // $pull لحذف الـ ID من المصفوفة
    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $pull: { wishlist: req.params.serviceId } },
        { new: true }
    ).populate('wishlist');

    res.status(200).json({
        status: 'success',
        message: 'تم حذف الخدمة من المفضلة',
        data: user.wishlist,
    });
});

// @desc    جلب قائمة المفضلة للمستخدم الحالي
// @route   GET /api/v1/wishlist
// @access  Protected/User
exports.getLoggedUserWishlist = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user._id).populate('wishlist');

    res.status(200).json({
        status: 'success',
        count: user.wishlist.length,
        data: user.wishlist,
    });
});