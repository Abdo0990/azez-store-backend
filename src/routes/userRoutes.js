const express = require('express');
const {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    changeUserPassword,
    updateLoggedUserData,
    updateLoggedUserPassword,
    deleteLoggedUserData,
} = require('../controllers/userController');

const {
    getUserValidator,
    createUserValidator,
    updateUserValidator,
    deleteUserValidator,
    changeUserPasswordValidator,
    updateLoggedUserValidator,
    changeLoggedUserPasswordValidator,
} = require('../validators/userValidator');

const { protect, allowedTo } = require('../middlewares/authMiddleware');
const { uploadSingleImage } = require('../middlewares/uploadImageMiddleware');

const router = express.Router();

// 1) Logged User Routes (Protected)
router.put('/changeMyPassword', protect, changeLoggedUserPasswordValidator, updateLoggedUserPassword);

// رفع وتحديث البيانات الشخصية وصورة المستخدم
router.put(
    '/updateMe',
    protect,
    uploadSingleImage('profileImg'),
    updateLoggedUserValidator,
    updateLoggedUserData
);

router.delete('/deleteMe', protect, deleteLoggedUserData);

// 2) Admin Only Routes
router.use(protect, allowedTo('admin'));

router.put('/changePassword/:id', changeUserPasswordValidator, changeUserPassword);

router
    .route('/')
    .get(getUsers)
    .post(uploadSingleImage('profileImg'), createUserValidator, createUser);

router
    .route('/:id')
    .get(getUserValidator, getUser)
    .put(uploadSingleImage('profileImg'), updateUserValidator, updateUser)
    .delete(deleteUserValidator, deleteUser);

module.exports = router;