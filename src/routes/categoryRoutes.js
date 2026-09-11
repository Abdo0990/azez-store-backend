const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const {
    getCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    createFilterObj,
    reorderCategories,
} = require('../controllers/categoryController');

const {
    getCategoryValidator,
    createCategoryValidator,
    updateCategoryValidator,
    deleteCategoryValidator,
} = require('../validators/categoryValidator');

const { protect, allowedTo } = require('../middlewares/authMiddleware');
const { uploadSingleImage } = require('../middlewares/uploadImageMiddleware');
const serviceRoute = require('./serviceRoutes');

const router = express.Router();

// ميدل وير لفحص التوكن اختيارياً للتفرقة بين الأدمن والزائر العادي
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
            // الاستمرار كزائر
        }
    }
    next();
};

router.use('/:categoryId/services', serviceRoute);

// مسار إعادة الترتيب السريع لكل الأقسام دفعة واحدة (للأدمن فقط)
router.put('/reorder', protect, allowedTo('admin'), reorderCategories);

router
    .route('/')
    .get(optionalAuth, createFilterObj, getCategories)
    .post(
        protect,
        allowedTo('admin'),
        uploadSingleImage('image'),
        createCategoryValidator,
        createCategory
    );

router
    .route('/:id')
    .get(getCategoryValidator, getCategory)
    .put(
        protect,
        allowedTo('admin'),
        uploadSingleImage('image'),
        updateCategoryValidator,
        updateCategory
    )
    .delete(protect, allowedTo('admin'), deleteCategoryValidator, deleteCategory);

module.exports = router;