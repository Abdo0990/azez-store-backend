const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const ApiError = require('../utils/apiError');

// 1) إعداد بيانات الربط مع Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2) تخزين الملف مؤقتاً في الذاكرة
const multerStorage = multer.memoryStorage();

// فلتر للتحقق من أن الملف صورة فقط
const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new ApiError('Only image files are allowed', 400), false);
    }
};

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // أقصى حجم 5 ميجا
});

// 3) دالة لرفع الـ Buffer مباشرة إلى Cloudinary
const uploadToCloudinary = (buffer, folder = 'azez-store') => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                transformation: [{ width: 500, height: 500, crop: 'limit', quality: 'auto' }],
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        uploadStream.end(buffer);
    });
};

// 4) الميدل وير المخصص للاستخدام في الـ Routes
exports.uploadSingleImage = (fieldName) => {
    const multerUpload = upload.single(fieldName);

    return (req, res, next) => {
        multerUpload(req, res, async (err) => {
            if (err) {
                return next(new ApiError(err.message, 400));
            }

            if (req.file) {
                try {
                    const result = await uploadToCloudinary(req.file.buffer, 'azez-store/users');
                    // حفظ الرابط المباشر في نفس اسم الحقل المرفوع (يدعم profileImg و image)
                    req.body[fieldName] = result.secure_url;
                } catch (uploadError) {
                    return next(new ApiError('Image upload to cloud failed', 500));
                }
            }

            next();
        });
    };
};

exports.deleteFromCloudinary = async (imageUrl) => {
    if (!imageUrl) return;
    try {
        const splitUrl = imageUrl.split('/');
        const folderAndFile = splitUrl.slice(-2).join('/');
        const publicId = folderAndFile.split('.')[0];

        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
    }
};