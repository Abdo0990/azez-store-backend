const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const {
    getStoreReviews,
    createStoreReview,
    deleteStoreReview,
} = require('../controllers/storeReviewController');

const optionalAuth = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
            const currentUser = await User.findById(decoded.userId);
            if (currentUser && currentUser.isActive) {
                req.user = currentUser;
            }
        }
    } catch (err) {
        // في حال انتهاء التوكن أو خطأ فيه يتم المتابعة كزائر عادي
    }
    next();
};

const router = express.Router();

router.route('/')
    .get(getStoreReviews)
    .post(createStoreReview);

router.route('/:id')
    .delete(optionalAuth, deleteStoreReview);

module.exports = router;