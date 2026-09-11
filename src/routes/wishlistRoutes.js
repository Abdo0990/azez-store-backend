const express = require('express');
const { protect, allowedTo } = require('../middlewares/authMiddleware');
const {
    addToWishlist,
    removeFromWishlist,
    getLoggedUserWishlist,
} = require('../controllers/wishlistController');

const router = express.Router();

router.use(protect, allowedTo('user', 'admin'));

router.route('/')
    .post(addToWishlist)
    .get(getLoggedUserWishlist);

router.route('/:serviceId')
    .delete(removeFromWishlist);

module.exports = router;