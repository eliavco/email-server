const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewController = require('./../controllers/reviewController');
// const reviewRoutes = require('./../routes/reviewRoutes');

const router = express.Router();

router.param('id', (req, res, next, val) => {
    // console.log(`This is the id: ${val}`);
    next();
});

// router.param('id', tourController.checkId);
const { protect, restrict } = authController;
// If login is required, add protect as first middleware

// router.use('/:tourId', reviewRouter);

router
    .route('/')
    .get(tourController.getAllTours)
    .post(
        /*tourController.checkBody,*/ protect,
        restrict('admin', 'lead-guide'),
        tourController.createNewTour
    );

router
    .route('/top-5-cheap')
    .get(protect, tourController.alias, tourController.getAllTours);

router
    .route('/within/:distance/center/:latlng/unit/:unit')
    .get(protect, tourController.getToursWithin);
// tours/within/233/center/-44,32/unit/mi

router
    .route('/distances/:latlng/unit/:unit')
    .get(protect, tourController.getToursDistance);

router.route('/stats').get(protect, tourController.getStats);

// ID HAS TO BE THE LAST
router
    .route('/:id')
    .get(tourController.getTour)
    .patch(
        protect,
        restrict('admin', 'lead-guide'),
        tourController.uploadTourImages,
        tourController.resizeTourImages,
        tourController.updateTourF,
        tourController.updateTourS
    )
    .delete(
        protect,
        restrict('admin', 'lead-guide'),
        tourController.deleteTourF,
        tourController.deleteTourS
    );

// router.route('/query/:query').get(tourController.getAllTours);

const getOnlyTour = (req, res, next) => {
    req.body = { query: 1, tour: req.params.tourId };
    return reviewController.getAllReviews(req, res, next);
};

const getOnlyATour = (req, res, next) => {
    req.body = { query: 1, tour: req.params.tourId, _id: req.params.id };
    return reviewController.getAllReviews(req, res, next);
};

router
    .route('/:tourId/reviews')
    .get(protect, getOnlyTour)
    .post(
        protect,
        restrict('user', 'admin'),
        reviewController.defineParams,
        reviewController.createNewReview
    )
    .patch(
        protect,
        restrict('user', 'admin'),
        reviewController.updateReviewF,
        reviewController.updateReviewS
    )
    .delete(
        protect,
        restrict('user', 'admin'),
        reviewController.deleteReviewF,
        reviewController.deleteReviewS
    );

router.route('/:tourId/reviews/:id').get(protect, getOnlyATour);

module.exports = router;
