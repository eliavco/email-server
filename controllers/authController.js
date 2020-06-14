const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

const createSendToken = (user, statusCode, req, res) => {
    const token = signToken(user._id);
    const cookieOptions = {
        expires: new Date(
            Date.now() +
                process.env.JWT_EXPIRES_IN.split('d')[0] * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
    };

    res.cookie('jwt', token, cookieOptions);

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
};

exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm
    });

    const newUserSend = {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        password: '<ENCRYPTED>'
    };

    const url = `${req.protocol}://${req.get('host')}/me`;
    await new Email(newUser, url).sendWelcome();
    createSendToken(newUserSend, 201, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password)
        return next(
            new AppError('Please provide an email and a password', 400)
        );

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password)))
        return next(new AppError('Email or password incorrect', 401));

    user.restoreAccount();
    await user.save({ validateBeforeSave: false });
    createSendToken(user, 200, req, res);
});

exports.protect = catchAsync(async (req, res, next) => {
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer ')
    ) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (!token)
        return next(
            new AppError(
                'You are not logged in. Please log in to acces this information',
                401
            )
        );

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    const currentUser = await User.findById(decoded.id);
    if (!currentUser)
        return next(
            new AppError(
                'The user you are trying to log in to, does not longer exist',
                410
            )
        );

    if (currentUser.changedPasswordAfter(decoded.iat))
        return next(
            new AppError(
                'The password was recently changed. Please login again',
                403
            )
        );

    res.locals.user = currentUser;
    req.currentUser = currentUser;

    next();
});

exports.isLoggedIn = async (req, res, next) => {
    if (req.cookies.jwt) {
        try {
            const decoded = await promisify(jwt.verify)(
                req.cookies.jwt,
                process.env.JWT_SECRET
            );

            const currentUser = await User.findById(decoded.id);
            if (!currentUser) return next();

            if (currentUser.changedPasswordAfter(decoded.iat)) return next();

            res.locals.user = currentUser;
            return next();
        } catch (err) {
            // ALWAYS RETURN NEXT IF THERES NO LOGGED IN USER
            return next();
        }
    }

    next();
};

exports.logout = catchAsync(async (req, res, next) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });

    res.status(200).json({
        status: 'success'
    });
});

exports.restrict = (...roles) =>
    catchAsync(async (req, res, next) => {
        if (!roles.includes(req.currentUser.role))
            next(
                new AppError(
                    `You cannot access this page. Only a ${roles.join(
                        ', or a '
                    )} can access this page`,
                    403
                )
            );
        next();
    });

exports.forgotPassword = catchAsync(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user)
        return next(
            new AppError('User with this email address not found', 404)
        );

    // eslint-disable-next-line no-unused-vars
    const resetToken = user.createPasswordResetToken();
    // take in mind that timestamp is +00 zone
    await user.save({ validateBeforeSave: false });

    try {
        const resetURL = `${req.protocol}://${req.get(
            'host'
        )}/api/v1/users/resetPassword/${resetToken}`;
        await new Email(user, resetURL).sendPasswordReset();
        res.status(200).json({
            status: 'success',
            message: 'Token sent to email!'
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpiration = undefined;
        await user.save({ validateBeforeSave: false });
        return next(
            new AppError('There was a problem reseting your password.', 500)
        );
    }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpiration: { $gte: Date.now() }
    });

    if (!user)
        return next(new AppError('Token is invalid or has expired.', 403));
    if (!req.body.password || !req.body.passwordConfirm)
        return next(new AppError('Send a password and confirm', 400));

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpiration = undefined;
    await user.save();
    createSendToken(user, 200, req, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    const { email, oldPassword, newPassword, newPasswordConfirm } = req.body;

    if (!email || !oldPassword || !newPassword || !newPasswordConfirm)
        return next(
            new AppError(
                'Please provide an email, oldPassword, newPassword, and newPasswordConfirm',
                400
            )
        );

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(oldPassword, user.password)))
        return next(new AppError('Email or password incorrect', 401));

    user.password = newPassword;
    user.passwordConfirm = newPasswordConfirm;

    await user.save();

    createSendToken(user, 200, req, res);
});

exports.getPromoted = catchAsync(async (req, res, next) => {
    const { email, adminEmail, adminPassword, newRole } = req.body;

    if (!email || !adminEmail || !adminPassword || !newRole)
        return next(
            new AppError(
                'Please provide an email, adminEmail, adminPassword, and newRole',
                400
            )
        );

    const user = await User.findOne({ email });
    if (!user)
        return next(new AppError('There is no user with that email', 400));

    const adminUser = await User.findOne({ email: adminEmail }).select(
        '+password'
    );

    if (
        !adminUser ||
        !(await adminUser.correctPassword(adminPassword, adminUser.password))
    )
        return next(new AppError("Admin's email or password incorrect", 400));

    if (
        adminUser.email !== process.env.EMAIL_ADMIN &&
        adminUser.role !== 'admin'
    )
        return next(new AppError('No admin', 400));

    user.role = newRole;
    await user.save();

    res.status(200).json({
        status: 'success',
        user
    });
});
