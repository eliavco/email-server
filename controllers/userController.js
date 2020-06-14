const multer = require('multer');
const sharp = require('sharp');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./../controllers/factoryGenerator');

// const multerDest = (req, file, cb) => {
//     // First paramter: error or null
//     cb(null, 'public/img/users');
// };

// const multerFile = (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     // user-id12-124738timestamp.jpg
//     cb(null, `user-${req.currentUser.id}-${Date.now()}.${ext}`);
// };

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError('Not an image, please upload only images', 400), false);
    }
};

const multerStorage = multer.memoryStorage();

// const multerStorage = multer.diskStorage({
//     destination: multerDest,
//     filename: multerFile
// });

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

exports.uploadUserPhoto = upload.single('photo');
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
    if (!req.file) return next();

    req.file.filename = `user-${req.currentUser.id}-${Date.now()}.jpeg`;

    await sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat('jpeg')
        // 90 percent image quality
        // .jpeg({ quality: 90 });
        .toFile(`public/img/users/${req.file.filename}`);

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
    // console.log(req.file);
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
    if (req.file) filteredBody.photo = req.file.filename;
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

exports.deleteUserS = factory.deleteOne('user');

exports.getStats = factory.getStats(User);
