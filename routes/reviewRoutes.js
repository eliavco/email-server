const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

const router = express.Router({ mergeParams: true });
// eslint-disable-next-line no-unused-vars
const { protect, restrict } = authController;
// If login is required, add protect as first middleware

router
    .route('/')
    .get(protect, reviewController.getAllReviews)
    .post(
        protect,
        restrict('admin'),
        reviewController.defineParams,
        reviewController.createNewReview
    );

router
    .route('/stats')
    .get(protect, restrict('admin', 'lead-guide'), reviewController.getStats);

// ID HAS TO BE THE LAST
router
    .route('/:id')
    .get(protect, reviewController.getReview)
    .patch(
        protect,
        restrict('admin'),
        reviewController.updateReviewF,
        reviewController.updateReviewS
    )
    .delete(
        protect,
        restrict('admin', 'lead-guide'),
        reviewController.deleteReviewF,
        reviewController.deleteReviewS
    );

module.exports = router;
