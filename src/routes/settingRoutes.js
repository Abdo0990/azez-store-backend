const express = require('express');
const { getSettings, updateSettings } = require('../controllers/settingController');
const { updateSettingValidator } = require('../validators/settingValidator');
const { protect, allowedTo } = require('../middlewares/authMiddleware');

const router = express.Router();

router
    .route('/')
    .get(getSettings)
    .put(protect, allowedTo('admin'), updateSettingValidator, updateSettings);

module.exports = router;