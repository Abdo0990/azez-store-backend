const express = require('express');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const {
    createOrder,
    getMyOrders,
    getOrders,
    getOrder,
    updateOrderStatus,
} = require('../controllers/orderController');

const {
    createOrderValidator,
    getOrderValidator,
    updateOrderStatusValidator,
} = require('../validators/orderValidator');
const { protect, allowedTo } = require('../middlewares/authMiddleware');

const router = express.Router();

// Rate limiter لإنشاء الطلبات لمنع الـ Spam
const createOrderLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: {
        success: false,
        message: 'Too many orders created from this IP, please try again after 15 minutes',
    },
});

// ميدل وير لاستخراج بيانات المستخدم إذا كان مسجلاً للدخول دون إلزام الزائر العادي
const optionalAuth = async (req, res, next) => {
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
            const user = await User.findById(decoded.userId);
            if (user && user.isActive) {
                req.user = user;
            }
        } catch (err) {
            // الاستمرار كزائر عادي في حال عدم صلاحية التوكن
        }
    }
    next();
};

// مسار إنشاء الطلب (متاح للجميع مع ربط المستخدم المسجل إن وجد)
router.post('/', createOrderLimiter, optionalAuth, createOrderValidator, createOrder);
router.get('/myOrders', protect, getMyOrders);

// مسارات لوحة التحكم (Admin Only)
router.use(protect, allowedTo('admin'));

router.get('/', getOrders);
router.get('/:id', getOrderValidator, getOrder);
router.put('/:id/status', updateOrderStatusValidator, updateOrderStatus);

module.exports = router;