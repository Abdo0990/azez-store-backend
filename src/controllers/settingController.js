const asyncHandler = require('express-async-handler');
const Setting = require('../models/settingModel');
const { cache, clearCacheByPrefix } = require('../utils/cache');

// @desc    Get Store Settings (Cached)
// @route   GET /api/v1/settings
// @access  Public
exports.getSettings = asyncHandler(async (req, res, next) => {
    const cacheKey = 'store_settings';
    if (cache.has(cacheKey)) {
        return res.status(200).json(cache.get(cacheKey));
    }

    let settings = await Setting.findOne();
    if (!settings) {
        settings = await Setting.create({
            storeName: 'Azez Store',
            whatsappNumber: '201000000000',
        });
    }

    const response = {
        success: true,
        data: settings,
    };

    cache.set(cacheKey, response);
    res.status(200).json(response);
});

// @desc    Update Store Settings
// @route   PUT /api/v1/settings
// @access  Private/Admin
exports.updateSettings = asyncHandler(async (req, res, next) => {
    let settings = await Setting.findOne();
    if (!settings) {
        settings = await Setting.create(req.body);
    } else {
        settings = await Setting.findByIdAndUpdate(settings._id, req.body, {
            new: true,
            runValidators: true,
        });
    }

    clearCacheByPrefix('store_settings');

    res.status(200).json({
        success: true,
        message: 'Settings updated successfully',
        data: settings,
    });
});