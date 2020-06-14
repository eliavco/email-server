const mongoose = require('mongoose');
const Tour = require('./../models/tourModel');
// const beautifyUnique = require('mongoose-beautiful-unique-validation');

const reviewSchema = new mongoose.Schema(
    {
        rating: {
            type: Number,
            default: 4.5,
            min: [0.0, 'Rating has to be higher'],
            max: [5.0, 'Rating has to be lower']
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'A review must belong to a user']
        },
        tour: {
            type: mongoose.Schema.ObjectId,
            ref: 'Tour',
            required: [true, 'A review must belong to a tour']
        },
        theme: {
            type: String,
            trim: true,
            lowercase: true,
            default: 'green',
            select: false
        },
        content: {
            type: String,
            trim: true,
            required: [true, 'A review must have content']
        },
        images: [String],
        createdAt: {
            type: Date,
            default: Date.now(),
            select: false
        }
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

reviewSchema.pre(/^find/, function(next) {
    this
        // .populate({
        //     path: 'tour',
        //     // populate: {
        //     //     path: 'guides'
        //     // },
        //     select: 'name guides'
        // })
        .populate({
            path: 'user',
            select: 'name photo'
        });
    next();
});

reviewSchema.statics.calcAverageRatings = async function(tourId) {
    const stats = await this.aggregate([
        {
            $match: { tour: tourId }
        },
        {
            $group: {
                _id: '$tour',
                nRatings: { $sum: 1 },
                avgRatings: { $avg: '$rating' }
            }
        }
    ]);
    await Tour.findByIdAndUpdate(tourId, {
        ratingsQuantity: stats[0].nRatings,
        ratingsAverage: Math.floor(stats[0].avgRatings * 100) / 100
    });
};

reviewSchema.post('save', function() {
    this.constructor.calcAverageRatings(this.tour);
});

reviewSchema.pre(/^findOneAnd/, async function(next) {
    this.r = await this.findOne();

    next();
});

reviewSchema.post(/^findOneAnd/, async function() {
    // await this.findOne(); does NOT work here, query has already executed
    await this.r.constructor.calcAverageRatings(this.r.tour);
});

reviewSchema.index({ user: 1, tour: 1 }, { unique: true });
// What I eventually did with the problematic UNIQUE INDEXES i couldnt find anywhere was to go to INDEXES tab on compass
// reviewSchema.plugin(beautifyUnique);
const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
