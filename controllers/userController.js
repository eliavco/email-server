const fs = require('fs');
const shortid = require('shortid');
const { Storage } = require('@google-cloud/storage');

const sharp = require('sharp');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./../controllers/factoryGenerator');
const generateCredentials = require('./../utils/generateCredentials');
const { uploadHelper } = require('./emailController');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
    if (!req.file) return next();

    const fileBuf = await sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat('jpeg')
        .toBuffer();
    const cred = generateCredentials(process);
    const path = `${__dirname}/serviceAccount.json`;
    fs.writeFileSync(path, JSON.stringify(cred));
    const storage = new Storage({
        projectId: process.env.GCLOUD_PROJECT_ID,
        keyFilename: path
    });
    const bucket = storage.bucket(process.env.GCLOUD_STORAGE_BUCKET_URL);
    const name = `user-${
        req.currentUser.id
    }-${shortid.generate()}-${Date.now()}-${req.file.originalname}`;
    const pUrl = await uploadHelper(name, fileBuf, bucket, req.file.mimetype);

    req.file.filename = name;
    req.file.url = pUrl;
    req.file.paramUrl = encodeURIComponent(pUrl);
    req.file.publicUrl = `${req.protocol}://${req.get(
        'host'
    )}/photo?url=${encodeURIComponent(pUrl)}`;
    delete req.file.buffer;

    next();
});

const filterObj = (object, ...allowedFields) => {
    const newObj = {};
    Object.keys(object).forEach(el => {
        if (allowedFields.includes(el)) newObj[el] = object[el];
    });
    return newObj;
};

exports.getAllUsers = factory.getAll(User);

exports.getMe = factory.getMe;

exports.updateMe = catchAsync(async (req, res, next) => {
    if (
        req.body.password ||
        req.body.passwordConfirm ||
        req.body.newPassword ||
        req.body.newPasswordConfirm ||
        req.body.oldPassword
    )
        return next(
            new AppError(
                'You cannot update passwords here. Please use /updatePassword',
                400
            )
        );

    const filteredBody = filterObj(req.body, 'name', 'email', 'photo');
    if (req.file) filteredBody.photo = req.file.publicUrl;
    const updatedUser = await User.findByIdAndUpdate(
        req.currentUser.id,
        filteredBody,
        {
            new: true,
            runValidators: true
        }
    );

    res.status(200).json({
        status: 'success',
        user: updatedUser
    });
});

exports.removeProfilePhoto = catchAsync(async (req, res, next) => {
    const updatedUser = await User.findByIdAndUpdate(
        req.currentUser.id,
        { photo: 'default' },
        {
            new: true,
            runValidators: true
        }
    );

    res.status(200).json({
        status: 'success',
        user: updatedUser
    });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.currentUser.id, { active: false });

    res.status(204).json({
        status: 'success',
        data: null
    });
});

exports.getUser = factory.getOne(User, false);

exports.createNewUser = factory.createOne(User);

exports.updateUserF = catchAsync(async (req, res, next) => {
    const { password, passwordConfirm } = req.body;
    delete req.body.password;
    delete req.body.passwordConfirm;

    req.upDoc = await User.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
        upsert: true
    });

    if (password || passwordConfirm) {
        const user = await User.findById(req.params.id).select('+password');

        user.password = password;
        user.passwordConfirm = passwordConfirm;
        await user.save();
    }

    next();
});

exports.updateUserS = factory.updateOne;

exports.deleteUserF = catchAsync(async (req, res, next) => {
    req.delDoc = await User.findByIdAndDelete(req.params.id);
    next();
});

exports.addSubscription = catchAsync(async (req, res, next) => {
    const doc = await User.findById(req.currentUser._id);
    if (!req.query.alias) return next(new AppError('No alias specified', 400));
    let action = 'add';
    if (req.query.act) {
        if (req.query.act === 'remove') {
            action = 'remove';
        }
    }
    if (action === 'add') {
        if ((await User.find({ subscriptions: req.query.alias }))[0])
            return next(new AppError('Someone already has this alias', 400));
        await doc.subscriptions.push(req.query.alias);
    } else {
        const ind = doc.subscriptions.indexOf(req.query.alias);
        if (ind >= 0) {
            await doc.subscriptions.splice(ind, 1);
        }
    }
    const upDoc = await doc.save();
    res.status(200).json({
        status: 'success',
        currentUser: upDoc
    });
});

exports.deleteUserS = factory.deleteOne('user');

exports.getStats = factory.getStats(User);
