const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const ApiFeatures = require('../utils/apiFeatures');
const { cache, clearCacheByPrefix } = require('../utils/cache');

// Delete One Document
exports.deleteOne = (Model, cachePrefix = '') =>
    asyncHandler(async (req, res, next) => {
        const { id } = req.params;
        const document = await Model.findByIdAndDelete(id);

        if (!document) {
            return next(new ApiError(`No document found with this id: ${id}`, 404));
        }

        if (cachePrefix) clearCacheByPrefix(cachePrefix);

        res.status(200).json({
            success: true,
            message: 'Document deleted successfully',
            data: null,
        });
    });

// Update One Document
exports.updateOne = (Model, cachePrefix = '') =>
    asyncHandler(async (req, res, next) => {
        const { id } = req.params;
        const document = await Model.findByIdAndUpdate(id, req.body, {
            returnDocument: 'after',
            runValidators: true,
        });

        if (!document) {
            return next(new ApiError(`No document found with this id: ${id}`, 404));
        }

        if (cachePrefix) clearCacheByPrefix(cachePrefix);

        res.status(200).json({
            success: true,
            message: 'Document updated successfully',
            data: document,
        });
    });

// Create One Document
exports.createOne = (Model, cachePrefix = '') =>
    asyncHandler(async (req, res, next) => {
        const newDoc = await Model.create(req.body);

        if (cachePrefix) clearCacheByPrefix(cachePrefix);

        res.status(201).json({
            success: true,
            message: 'Document created successfully',
            data: newDoc,
        });
    });

// Get One Document (Cached)
exports.getOne = (Model, populationOpt, cachePrefix = '') =>
    asyncHandler(async (req, res, next) => {
        const { id } = req.params;
        const cacheKey = cachePrefix ? `${cachePrefix}_${id}` : null;

        if (cacheKey && cache.has(cacheKey)) {
            return res.status(200).json(cache.get(cacheKey));
        }

        let query = Model.findById(id).lean();
        if (populationOpt) {
            query = query.populate(populationOpt);
        }

        const document = await query;
        if (!document) {
            return next(new ApiError(`No document found with this id: ${id}`, 404));
        }

        const responsePayload = {
            success: true,
            data: document,
        };

        if (cacheKey) cache.set(cacheKey, responsePayload);

        res.status(200).json(responsePayload);
    });

// Get All Documents with Caching
exports.getAll = (Model, modelName = '', cachePrefix = '') =>
    asyncHandler(async (req, res, next) => {
        let filter = {};
        if (req.filterObj) {
            filter = req.filterObj;
        }

        const queryString = JSON.stringify(req.query || {});
        const filterString = JSON.stringify(filter || {});
        const cacheKey = cachePrefix ? `${cachePrefix}_all_${filterString}_${queryString}` : null;

        if (cacheKey && cache.has(cacheKey)) {
            return res.status(200).json(cache.get(cacheKey));
        }

        const totalDocumentsCount = await Model.countDocuments(filter);

        const apiFeatures = new ApiFeatures(Model.find(filter).lean(), req.query)
            .paginate(totalDocumentsCount)
            .filter()
            .search(modelName)
            .limitFields()
            .sort();

        const { mongooseQuery, pagination } = apiFeatures;
        const documents = await mongooseQuery;

        const responsePayload = {
            success: true,
            results: documents.length,
            totalCount: totalDocumentsCount,
            pagination,
            data: documents,
        };

        if (cacheKey) cache.set(cacheKey, responsePayload);

        res.status(200).json(responsePayload);
    });