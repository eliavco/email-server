const express = require('express');
const bookingController = require('./../controllers/bookingController');
const authController = require('./../controllers/authController');

const router = express.Router();
// eslint-disable-next-line no-unused-vars
const { protect, restrict } = authController;
// If login is required, add protect as first middleware

router.get(
    '/checkout-session/:tourId',
    protect,
    bookingController.getCheckoutSession
);
router
    .route('/')
    .get(
        protect,
        restrict('admin', 'lead-guide'),
        bookingController.getAllBookings
    )
    .post(protect, restrict('admin'), bookingController.createBooking);

router
    .route('/:id')
    .patch(
        protect,
        restrict('admin'),
        bookingController.updateBookingF,
        bookingController.updateBookingS
    )
    .delete(
        protect,
        restrict('admin', 'lead-guide'),
        bookingController.deleteBookingF,
        bookingController.deleteBookingS
    );

router.get('/stats', protect, restrict('admin'), bookingController.getStats);

module.exports = router;
