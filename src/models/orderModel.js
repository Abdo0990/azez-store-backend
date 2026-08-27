const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
        },
        customerName: {
            type: String,
            default: 'عميل',
            trim: true,
        },
        customerPhone: {
            type: String,
            default: 'غير مسجل',
            trim: true,
        },
        service: {
            type: mongoose.Schema.ObjectId,
            ref: 'Service',
            required: [true, 'Service is required for order'],
        },
        serviceName: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            enum: ['USD', 'EGP', 'SAR'],
            default: 'USD',
        },
        paymentMethod: {
            type: String,
            enum: ['vodafone_cash', 'instapay', 'binance_id', 'ltc', 'rajhi_bank'],
            default: 'binance_id',
        },
        customFieldsValues: [
            {
                fieldName: { type: String, required: true },
                value: { type: String, required: true },
            },
        ],
        status: {
            type: String,
            enum: ['pending', 'in-progress', 'completed', 'cancelled'],
            default: 'pending',
        },
        channel: {
            type: String,
            enum: ['whatsapp', 'discord', 'other'],
            default: 'whatsapp',
        },
        notes: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true }
);

// فهارس تسريع استعلامات لوحة التحكم وصفحة طلباتي
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;