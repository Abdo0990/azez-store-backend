const { check } = require('express-validator');
const validatorMiddleware = require('../middlewares/validatorMiddleware');
const Service = require('../models/serviceModel');

exports.createOrderValidator = [
    // الاسم ورقم الهاتف أصبحا اختياريين
    check('customerName')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Customer name cannot exceed 50 characters'),

    check('customerPhone')
        .optional()
        .trim(),

    check('paymentMethod')
        .notEmpty()
        .withMessage('Payment method is required')
        .isIn(['vodafone_cash', 'instapay', 'binance_id', 'ltc', 'rajhi_bank'])
        .withMessage('Invalid payment method selected'),

    check('service')
        .notEmpty()
        .withMessage('Service ID is required')
        .isMongoId()
        .withMessage('Invalid service ID format')
        .custom(async (serviceId, { req }) => {
            const service = await Service.findById(serviceId);
            if (!service) {
                throw new Error('Service not found');
            }
            if (!service.isAvailable) {
                throw new Error('This service is currently unavailable');
            }

            // التحقق فقط من الحقول المخصصة الإلزامية الخاصة بالخدمة
            if (service.requiredFields && service.requiredFields.length > 0) {
                const incomingFields = req.body.customFieldsValues || [];
                for (const field of service.requiredFields) {
                    if (field.isRequired) {
                        const providedField = incomingFields.find(
                            (f) => f.fieldName === field.fieldName && f.value && f.value.trim() !== ''
                        );
                        if (!providedField) {
                            throw new Error(`The field '${field.fieldName}' is required for this service`);
                        }
                    }
                }
            }

            req.serviceDoc = service;
            return true;
        }),

    check('customFieldsValues')
        .optional()
        .customSanitizer((val) => {
            if (typeof val === 'string') {
                try {
                    return JSON.parse(val);
                } catch {
                    return val;
                }
            }
            return val;
        })
        .isArray()
        .withMessage('customFieldsValues must be an array'),

    check('channel')
        .optional()
        .isIn(['whatsapp', 'discord', 'other'])
        .withMessage('Invalid channel type'),

    check('notes')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Notes cannot exceed 500 characters'),

    validatorMiddleware,
];

exports.getOrderValidator = [
    check('id').isMongoId().withMessage('Invalid order ID format'),
    validatorMiddleware,
];

exports.updateOrderStatusValidator = [
    check('id').isMongoId().withMessage('Invalid order ID format'),
    check('status')
        .notEmpty()
        .withMessage('Status is required')
        .isIn(['pending', 'in-progress', 'completed', 'cancelled'])
        .withMessage('Invalid status value'),
    validatorMiddleware,
];