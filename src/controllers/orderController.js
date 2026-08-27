const asyncHandler = require('express-async-handler');
const Order = require('../models/orderModel');
const Setting = require('../models/settingModel');
const factory = require('./handlersFactory');
const ApiError = require('../utils/apiError');

const PAYMENT_METHODS_MAP = {
    vodafone_cash: { label: 'فودافون كاش (Vodafone Cash)', currency: 'EGP', symbol: 'ج.م' },
    instapay: { label: 'انستا باي (InstaPay)', currency: 'EGP', symbol: 'ج.م' },
    binance_id: { label: 'بينانس (Binance )', currency: 'USD', symbol: '$' },
    ltc: { label: 'لايتكوين (LTC)', currency: 'USD', symbol: '$' },
    rajhi_bank: { label: 'بنك الراجحي (Al Rajhi Bank)', currency: 'SAR', symbol: 'ر.س' },
};

// دالة داخلية لإرسال الإشعار إلى ديسكورد بأمان من السيرفر
const sendDiscordWebhook = async (order, service, methodMeta, targetChannel) => {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return;

    try {
        const orderShortCode = order._id.toString().slice(-6).toUpperCase();
        const cleanPhone = (order.customerPhone || '').replace(/[^0-9]/g, '');

        const customFieldsBlock = (order.customFieldsValues && order.customFieldsValues.length > 0)
            ? order.customFieldsValues.map((f) => `🔹 **${f.fieldName}:** \`${f.value}\``).join('\n')
            : '`لا توجد بيانات إضافية`';

        const phoneDisplay = cleanPhone
            ? `[${order.customerPhone}](https://wa.me/${cleanPhone})`
            : '`غير مسجل`';

        const descriptionText = [
            `**كود الطلب:** \`#${orderShortCode}\``,
            `──────────────────────────────`,
            `📦 **الباقة المطلوبة:** ${service.name}`,
            `💰 **المبلغ:** \`${order.price} ${methodMeta.symbol}\``,
            `💳 **وسيلة الدفع:** ${methodMeta.label}`,
            `──────────────────────────────`,
            `👤 **اسم العميل:** ${order.customerName}`,
            `📞 **رقم الواتساب:** ${phoneDisplay}`,
            `──────────────────────────────`,
            `📋 **بيانات التفعيل:**`,
            customFieldsBlock,
            ...(order.notes ? [
                `──────────────────────────────`,
                `📝 **ملاحظات:**`,
                `> ${order.notes}`
            ] : []),
        ].join('\n');

        const payload = {
            username: "Azez Store - Orders",
            avatar_url: "https://i.imgur.com/4M34hi2.png",
            embeds: [
                {
                    title: targetChannel === 'discord'
                        ? "🎮 طلب جديد (تأكيد ديسكورد)"
                        : "🛒 طلب جديد (تأكيد واتساب)",
                    description: descriptionText,
                    color: targetChannel === 'discord' ? 0x5865F2 : 0xe11d48,
                    footer: {
                        text: `Azez Store • ${targetChannel === 'discord' ? 'Discord' : 'WhatsApp'}`,
                        icon_url: "https://i.imgur.com/4M34hi2.png"
                    },
                    timestamp: new Date().toISOString(),
                },
            ],
        };

        await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
    } catch (err) {
        console.error("Failed to trigger Discord Webhook from server:", err.message);
    }
};

// @desc    Create new order & trigger notifications
// @route   POST /api/v1/orders
// @access  Public
exports.createOrder = asyncHandler(async (req, res, next) => {
    const service = req.serviceDoc;
    const { customerName, customerPhone, customFieldsValues, notes, channel, paymentMethod } = req.body;

    let settings = await Setting.findOne();
    if (!settings) {
        settings = await Setting.create({
            storeName: 'Azez Store',
            whatsappNumber: '201000000000',
            isStoreOpen: true,
        });
    }

    if (!settings.isStoreOpen) {
        return next(new ApiError('المتجر مغلق حالياً لاستقبال الطلبات الجديدة', 400));
    }

    const selectedMethod = paymentMethod || 'binance_id';
    const methodMeta = PAYMENT_METHODS_MAP[selectedMethod] || PAYMENT_METHODS_MAP.binance_id;

    let calculatedPrice = service.pricing?.[selectedMethod];
    if (!calculatedPrice || calculatedPrice <= 0) {
        calculatedPrice = service.price;
    }

    const finalCustomerName = (customerName && customerName.trim()) ? customerName.trim() : 'عميل';
    const finalCustomerPhone = (customerPhone && customerPhone.trim()) ? customerPhone.trim() : 'غير مسجل';

    const order = await Order.create({
        user: req.user ? req.user._id : undefined,
        customerName: finalCustomerName,
        customerPhone: finalCustomerPhone,
        service: service._id,
        serviceName: service.name,
        price: calculatedPrice,
        currency: methodMeta.currency,
        paymentMethod: selectedMethod,
        customFieldsValues: customFieldsValues || [],
        channel: channel || 'whatsapp',
        notes,
    });

    // إرسال الإشعار من السيرفر مباشرة
    await sendDiscordWebhook(order, service, methodMeta, channel || 'whatsapp');

    // تجهيز رسالة الواتساب
    let customDetailsText = '';
    if (customFieldsValues && customFieldsValues.length > 0) {
        customDetailsText = customFieldsValues
            .map((item) => `• *${item.fieldName}:* ${item.value}`)
            .join('\n');
    }

    const message =
        `*طلب جديد من ${settings.storeName || 'Azez Store'} 🎮*
--------------------------
• *رقم الطلب:* #${order._id.toString().slice(-6).toUpperCase()}
• *الخدمة:* ${service.name}
• *طريقة الدفع:* ${methodMeta.label}
• *المبلغ المطلوب:* ${calculatedPrice} ${methodMeta.symbol} (${methodMeta.currency})
• *اسم العميل:* ${finalCustomerName}
• *رقم الهاتف:* ${finalCustomerPhone}
${customDetailsText ? `--------------------------\n${customDetailsText}` : ''}
${notes ? `• *ملاحظات:* ${notes}` : ''}`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${settings.whatsappNumber}?text=${encodedMessage}`;

    res.status(201).json({
        success: true,
        message: 'تم إنشاء الطلب بنجاح',
        data: order,
        redirectUrl: whatsappUrl,
    });
});

exports.getMyOrders = asyncHandler(async (req, res, next) => {
    const orders = await Order.find({ user: req.user._id }).sort('-createdAt');
    res.status(200).json({
        success: true,
        results: orders.length,
        data: orders,
    });
});

exports.getOrders = factory.getAll(Order);
exports.getOrder = factory.getOne(Order, { path: 'service', select: 'name price pricing image' });

exports.updateOrderStatus = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findByIdAndUpdate(
        id,
        { status },
        { new: true, runValidators: true }
    );

    if (!order) {
        return next(new ApiError(`لا يوجد طلب بهذا المعرف: ${id}`, 404));
    }

    res.status(200).json({
        success: true,
        message: 'تم تحديث حالة الطلب بنجاح',
        data: order,
    });
});