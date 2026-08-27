const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
const User = require('../models/userModel');
const factory = require('./handlersFactory');
const ApiError = require('../utils/apiError');

// @desc    Get list of users
// @route   GET /api/v1/users
// @access  Private/Admin
exports.getUsers = factory.getAll(User);

// @desc    Get specific user by id
// @route   GET /api/v1/users/:id
// @access  Private/Admin
exports.getUser = factory.getOne(User);

// @desc    Create user
// @route   POST /api/v1/users
// @access  Private/Admin
exports.createUser = factory.createOne(User);

// @desc    Update specific user (except password)
// @route   PUT /api/v1/users/:id
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const updateFields = {};
    if (req.body.name) updateFields.name = req.body.name;
    if (req.body.email) updateFields.email = req.body.email;
    if (req.body.phone) updateFields.phone = req.body.phone;
    if (req.body.role) updateFields.role = req.body.role;
    if (req.body.isActive !== undefined) updateFields.isActive = req.body.isActive;

    const user = await User.findByIdAndUpdate(id, updateFields, {
        new: true,
        runValidators: true,
    });

    if (!user) {
        return next(new ApiError(`No user found with this id: ${id}`, 404));
    }

    res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: user,
    });
});

// @desc    Change User Password by Admin
// @route   PUT /api/v1/users/changePassword/:id
// @access  Private/Admin
exports.changeUserPassword = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const hashedPassword = await bcrypt.hash(req.body.password, 12);

    const user = await User.findByIdAndUpdate(
        id,
        {
            password: hashedPassword,
            passwordChangedAt: Date.now(),
        },
        { new: true }
    );

    if (!user) {
        return next(new ApiError(`No user found with this id: ${id}`, 404));
    }

    res.status(200).json({
        success: true,
        message: 'User password changed successfully',
    });
});

// @desc    Delete user
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
exports.deleteUser = factory.deleteOne(User);

// -------------------------------------------------------------
// LOGGED USER OPERATIONS
// -------------------------------------------------------------

// @desc    Update logged user personal data
// @route   PUT /api/v1/users/updateMe
// @access  Private/User
exports.updateLoggedUserData = asyncHandler(async (req, res, next) => {
    const updateData = {};
    if (req.body?.name) updateData.name = req.body.name;
    if (req.body?.phone) updateData.phone = req.body.phone;
    if (req.body?.profileImg) updateData.profileImg = req.body.profileImg;

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        updateData,
        { new: true, runValidators: true }
    );

    res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser,
    });
});

// @desc    Change logged user personal password
// @route   PUT /api/v1/users/changeMyPassword
// @access  Private/User
exports.updateLoggedUserPassword = asyncHandler(async (req, res, next) => {
    const hashedPassword = await bcrypt.hash(req.body.password, 12);

    await User.findByIdAndUpdate(req.user._id, {
        password: hashedPassword,
        passwordChangedAt: Date.now(),
    });

    res.status(200).json({
        success: true,
        message: 'Password changed successfully',
    });
});

// @desc    Deactivate logged user account (Soft delete)
// @route   DELETE /api/v1/users/deleteMe
// @access  Private/User
exports.deleteLoggedUserData = asyncHandler(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user._id, {
        isActive: false,
        passwordChangedAt: Date.now(),
    });

    res.status(200).json({
        success: true,
        message: 'Account deactivated successfully',
    });
});