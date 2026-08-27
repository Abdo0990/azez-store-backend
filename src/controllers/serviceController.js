const Service = require('../models/serviceModel');
const factory = require('./handlersFactory');
const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const { deleteFromCloudinary } = require('../middlewares/uploadImageMiddleware');
const { clearCacheByPrefix } = require('../utils/cache');

exports.createFilterObj = (req, res, next) => {
    let filterObject = {};
    if (req.params.categoryId) filterObject.category = req.params.categoryId;
    if (!req.user || req.user.role !== 'admin') {
        filterObject.isAvailable = true;
    }
    req.filterObj = filterObject;
    next();
};

exports.getServices = factory.getAll(Service, 'Service', 'services');
exports.getService = factory.getOne(Service, { path: 'category', select: 'name' }, 'services');
exports.createService = factory.createOne(Service, 'services');

exports.updateService = asyncHandler(async (req, res, next) => {
    const serviceId = req.params.id;
    const existingService = await Service.findById(serviceId);

    if (!existingService) {
        return next(new ApiError(`No service found with ID: ${serviceId}`, 404));
    }

    if (req.body.image && existingService.image) {
        await deleteFromCloudinary(existingService.image);
    }

    const updatedService = await Service.findByIdAndUpdate(serviceId, req.body, {
        new: true,
        runValidators: true,
    });

    clearCacheByPrefix('services');

    res.status(200).json({ data: updatedService });
});

exports.deleteService = asyncHandler(async (req, res, next) => {
    const service = await Service.findByIdAndDelete(req.params.id);

    if (!service) {
        return next(new ApiError(`No service found with ID: ${req.params.id}`, 404));
    }

    if (service.image) {
        await deleteFromCloudinary(service.image);
    }

    clearCacheByPrefix('services');

    res.status(204).send();
});