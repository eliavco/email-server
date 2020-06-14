// const fs = require('fs');
const Review = require('./../models/reviewModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./../controllers/factoryGenerator');

exports.getAllReviews = factory.getAll(Review);

exports.getReview = factory.getOne(Review, false);

exports.defineParams = catchAsync(async (req, res, next) => {
    if (req.params.tourId && (req.body.tour || req.body.user))
        return next(
            new AppError('you can not create a review for another user', 403)
        );
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.currentUser._id;
    next();
});

exports.createNewReview = factory.createOne(Review);

exports.updateReviewF = catchAsync(async (req, res, next) => {
    if (req.params.tourId) {
        req.upDoc = await Review.findOneAndUpdate(
            {
                tour: req.params.tourId,
                user: req.currentUser._id
            },
            req.body,
            {
                new: true,
                runValidators: true
            }
        );
    } else {
        req.upDoc = await Review.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
            upsert: true
        });
    }
    next();
});

exports.updateReviewS = factory.updateOne;

exports.deleteReviewF = catchAsync(async (req, res, next) => {
    if (req.params.tourId) {
        req.delDoc = await Review.findOneAndDelete({
            tour: req.params.tourId,
            user: req.currentUser._id
        });
    } else {
        req.delDoc = await Review.findByIdAndDelete(req.params.id);
    }
    next();
});

exports.deleteReviewS = factory.deleteOne('review');

exports.getStats = factory.getStats(Review);
