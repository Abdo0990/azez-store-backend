const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const {
    getServices,
    getService,
    createService,
    updateService,
    deleteService,
    createFilterObj,
    reorderServices,
} = require('../controllers/serviceController');

const {
    getServiceValidator,
    createServiceValidator,
    updateServiceValidator,
    deleteServiceValidator,
} = require('../validators/serviceValidator');

const { protect, allowedTo } = require('../middlewares/authMiddleware');
const { uploadSingleImage } = require('../middlewares/uploadImageMiddleware');
const reviewRoute = require('./reviewRoutes');

const router = express.Router({ mergeParams: true });

// 1) فحص التوكن اختيارياً للتفرقة بين الأدمن والزائر العادي في مسار العرض
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
            // الاستمرار كزائر عادي
        }
    }
    next();
};

// 2) Nested Route للتقييمات
router.use('/:serviceId/reviews', reviewRoute);

// 3) مسار إعادة الترتيب السريع للخدمات (للأدمن فقط)
// موضوع قبل مسار /:id حتى لا يتم اعتبار كلمة reorder كمعرف
router.put('/reorder', protect, allowedTo('admin'), reorderServices);

// 4) المسارات العامة والخاصة بالخدمات
router
    .route('/')
    .get(optionalAuth, createFilterObj, getServices)
    .post(
        protect,
        allowedTo('admin'),
        uploadSingleImage('image'),
        createServiceValidator,
        createService
    );

router
    .route('/:id')
    .get(getServiceValidator, getService)
    .put(
        protect,
        allowedTo('admin'),
        uploadSingleImage('image'),
        updateServiceValidator,
        updateService
    )
    .delete(protect, allowedTo('admin'), deleteServiceValidator, deleteService);

module.exports = router;