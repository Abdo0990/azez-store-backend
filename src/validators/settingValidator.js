const { check } = require('express-validator');
const validatorMiddleware = require('../middlewares/validatorMiddleware');

exports.updateSettingValidator = [
    check('storeName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Store name must be between 2 and 50 characters'),

    check('whatsappNumber')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('WhatsApp number cannot be empty')
        .isNumeric()
        .withMessage('WhatsApp number must contain numbers only'),

    check('discordInviteUrl')
        .optional({ checkFalsy: true })
        .trim()
        .isURL()
        .withMessage('Invalid Discord invite URL'),

    check('facebookUrl')
        .optional({ checkFalsy: true })
        .trim()
        .isURL()
        .withMessage('Invalid Facebook URL'),

    check('announcementText')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 500 })
        .withMessage('Announcement text cannot exceed 500 characters'),

    check('isStoreOpen')
        .optional()
        .isBoolean()
        .withMessage('isStoreOpen must be a boolean (true / false)'),

    validatorMiddleware,
];