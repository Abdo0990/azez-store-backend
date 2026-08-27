
class apiFeatures {

    constructor(mongooseQuery, queryString) {
        this.mongooseQuery = mongooseQuery;
        this.queryString = queryString;
    }

    filter() {
        const queryStringObject = { ...this.queryString }
        const execludedFields = ['page', 'sort', 'limit', 'fields', 'keyword']
        execludedFields.forEach((field) => delete queryStringObject[field])

        let queryStr = JSON.stringify(queryStringObject);
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, match => `$${match}`)

        this.mongooseQuery.find(JSON.parse(queryStr))
        return this;
    }

    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(" ");
            this.mongooseQuery.sort(sortBy)
        } else {
            this.mongooseQuery.sort('-createdAt')
        }
        return this;
    }

    limitFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(" ");
            this.mongooseQuery.select(fields)
        } else {
            this.mongooseQuery.select('-__v')
        }
        return this;
    }

    paginate(countDocuments) {
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 25;
        const skip = (page - 1) * limit;
        const endIndex = page * limit

        // Pagination result
        const pagination = {};
        pagination.page = page;
        pagination.limit = limit;
        pagination.numberOfPages = Math.ceil(countDocuments / limit)

        //next page
        if (endIndex < countDocuments) {
            pagination.next = page + 1;
        }
        if (skip > 0) {
            pagination.prev = page - 1;
        }


        this.mongooseQuery.skip(skip).limit(limit);
        this.pagination = pagination;
        return this;
    }

    search() {
        if (this.queryString.keyword) {
            const keyword = this.queryString.keyword;
            this.mongooseQuery.find({
                $or: [
                    { title: { $regex: keyword, $options: 'i' } },
                    { description: { $regex: keyword, $options: 'i' } },
                    { name: { $regex: keyword, $options: 'i' } }
                ]
            })
        }
        return this;
    }
}

module.exports = apiFeatures;