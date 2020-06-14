const Tour = require('./../models/tourModel');
const User = require('./../models/userModel');
const Booking = require('./../models/bookingModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

exports.alerts = (req, res, next) => {
    const { alert } = req.query;
    if (alert === 'booking') {
        res.locals.alert =
            "Your Booking Was Successful! Please check your email for a confirmation. If the tour doesn't show up, try again a bit later";
    }
    next();
};

exports.getReal = catchAsync(async (req, res, next) => {
    res.status(200).render('final');
});

exports.getOverview = catchAsync(async (req, res, next) => {
    const tours = await Tour.find();
    res.status(200).render('overview', {
        title: 'Exciting tours for adventurous people',
        tours
    });
});

exports.getTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.find({ slug: req.params.slug }).populate({
        path: 'reviews',
        select: 'rating user content'
    });

    if (!tour) return next(new AppError('No tour found for this ID', 404));

    res.status(200).render('tour', {
        title: `${tour[0].name} Tour`,
        // user: 'Eliav',
        tour: tour[0]
    });
});

exports.getLogin = catchAsync(async (req, res, next) => {
    res.status(200).render('login', {
        title: 'Login'
    });
});

exports.getSignup = catchAsync(async (req, res, next) => {
    res.status(200).render('signup', {
        title: 'Register'
    });
});

exports.getAccount = catchAsync(async (req, res, next) => {
    res.status(200).render('account', {
        title: 'Settings'
    });
});

exports.getMyTours = catchAsync(async (req, res, next) => {
    const bookings = await Booking.find({ user: req.currentUser.id });
    const tourIds = bookings.map(el => el.tour);
    const tours = await Tour.find({ _id: { $in: tourIds } });
    res.status(200).render('overview', {
        title: 'Your Bookings',
        tours
    });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
    const { email, name } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
        req.currentUser.id,
        { email, name },
        {
            new: true,
            runValidators: true
        }
    );
    res.status(200).render('account', {
        title: 'Settings',
        user: updatedUser
    });
});
