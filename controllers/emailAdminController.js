const Email = require('../models/emailModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./factoryGenerator');

exports.getAllEmails = (req, res, next) => {
    req.usersSubscribed = req.currentUser.subscriptions;
    next();
};

exports.getAllEmailsAdmin = factory.getAll(Email);

exports.getEmail = factory.getOne(Email, true);

exports.createNewEmail = factory.createOne(Email);

exports.updateEmailF = catchAsync(async (req, res, next) => {
    req.upDoc = await Email.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        // upsert: true,
        runValidators: true
    });
    next();
});

exports.updateEmailS = factory.updateOne;

exports.deleteEmailF = catchAsync(async (req, res, next) => {
    req.delDoc = await Email.findByIdAndDelete(req.params.id);
    next();
});

exports.deleteEmailS = factory.deleteOne('email');

exports.getDoc = factory.getDoc;

exports.getStats = factory.getStats(Email);
