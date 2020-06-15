// const User = require('../models/userModel');
const Email = require('../models/emailModel');
// const factory = require('./factoryGenerator');
// const AppError = require('./../utils/appError');
// const catchAsync = require('../utils/catchAsync');

exports.incomingEmail = async (req, res, next) => {
    req.body.files = JSON.stringify(req.files);
    try {
        await Email.create(req.body);
        res.status(200).json({ received: true });
    } catch (err) {
        res.status(500).json({ received: false });
    }
};
