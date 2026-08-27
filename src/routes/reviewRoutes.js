const express = require('express');
const {
    getReviews,
    getReview,
    createReview,
    updateReview,
    deleteReview,
    createFilterObj,
    setServiceIdAndUserIdToBody,
} = require('../controllers/reviewController');

const {
    getReviewValidator,
    createReviewValidator,
    updateReviewValidator,
    deleteReviewValidator,
} = require('../validators/reviewValidator');

const { protect, allowedTo } = require('../middlewares/authMiddleware');

const router = express.Router({ mergeParams: true });

router
    .route('/')
    .get(createFilterObj, getReviews)
    .post(
        protect,
        allowedTo('user'),
        setServiceIdAndUserIdToBody,
        createReviewValidator,
        createReview
    );

router
    .route('/:id')
    .get(getReviewValidator, getReview)
    .put(protect, allowedTo('user'), updateReviewValidator, updateReview)
    .delete(
        protect,
        allowedTo('user', 'admin'),
        deleteReviewValidator,
        deleteReview
    );

module.exports = router;