class APIFeatures {
    constructor(query, body, queryString, model) {
        this.query = query;
        this.body = body;
        this.queryString = queryString;
        this.model = model;
    }

    filter() {
        let queryObj;
        if (this.body.query) {
            queryObj = { ...this.body };
        } else if (this.query) {
            queryObj = { ...this.queryString };
        }
        const excludedFields = ['query', 'page', 'sort', 'limit', 'fields'];
        excludedFields.forEach(el => delete queryObj[el]);
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(
            /\b(gte|gt|lte|lt|or|ne|nin|in|eq)\b/g,
            match => `$${match}`
        );
        queryObj = JSON.parse(queryStr);
        this.query = this.query.find(queryObj);
        return this;
    }

    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy);
        } else {
            this.query = this.query.sort('-createdAt');
        }
        return this;
    }

    limitFields() {
        if (this.queryString.fields) {
            let fields = this.queryString.fields.split(',');
            if (fields[0][0] === '-') {
                fields.push('-__v');
            }
            fields = fields.join(' ');
            this.query = this.query.select(fields);
        } else {
            this.query = this.query.select('-__v');
        }
        return this;
    }

    paginate() {
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 100;
        const skip = (page - 1) * limit;
        this.query = this.query.skip(skip).limit(limit);
        // if (this.queryString.page) {
        //     const numTours = await Tour.countDocuments();
        //     if (skip >= numTours) throw new Error('This Page Does Not Exist!');
        // }
        return this;
    }
}
module.exports = APIFeatures;
