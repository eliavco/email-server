const multer = require('multer');
const sharp = require('sharp');
const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./../controllers/factoryGenerator');

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError('Not an image, please upload only images', 400), false);
    }
};

const multerStorage = multer.memoryStorage();

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

// exports.uploadUserPhoto = upload.array('images'); // produces req.files instead of .file
exports.uploadTourImages = upload.fields([
    {
        name: 'imageCover',
        maxCount: 1
    },
    {
        name: 'images',
        maxCount: 3
    }
]);
exports.resizeTourImages = catchAsync(async (req, res, next) => {
    if (!req.files.imageCover || !req.files.images) return next();

    req.body.filename = `user-${req.currentUser.id}-${Date.now()}.jpeg`;

    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
    await sharp(req.files.imageCover[0].buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        // 90 percent image quality
        // .jpeg({ quality: 90 });
        .toFile(`public/img/tours/${req.body.imageCover}`);

    req.body.images = [];
    await Promise.all(
        req.files.images.map(async (file, i) => {
            const filename = `tour-${req.params.id}-${Date.now()}-${i +
                1}.jpeg`;
            await sharp(file.buffer)
                .resize(2000, 1333)
                .toFormat('jpeg')
                // 90 percent image quality
                // .jpeg({ quality: 90 });
                .toFile(`public/img/tours/${filename}`);

            req.body.images.push(filename);
        })
    );

    next();
});

exports.getAllTours = factory.getAll(Tour);

exports.getTour = factory.getOne(Tour, true);

exports.createNewTour = factory.createOne(Tour);

exports.updateTourF = catchAsync(async (req, res, next) => {
    req.upDoc = await Tour.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        // upsert: true,
        runValidators: true
    });
    next();
});

exports.updateTourS = factory.updateOne;

exports.deleteTourF = catchAsync(async (req, res, next) => {
    req.delDoc = await Tour.findByIdAndDelete(req.params.id);
    next();
});

exports.deleteTourS = factory.deleteOne('tour');

exports.getDoc = factory.getDoc;

exports.getStats = factory.getStats(Tour);

// /within/:distance/center/:latlng/unit/:unit
// /within/256/center/34.111745,-118.113491/unit/:unit
exports.getToursWithin = catchAsync(async (req, res, next) => {
    const { distance, latlng, unit } = req.params;
    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
    const [lat, lng] = latlng.split(',');
    if (!lat || !lng)
        return next(
            AppError(
                'Your Location was not defined properly. try specifying this format: 34.111745,-118.113491 with latitude first',
                400
            )
        );

    // There are more mongodb operators for geospatial calculations go to docs online, for example $near
    const tours = await Tour.find({
        startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
    });

    res.status(200).json({
        status: 'success',
        results: {
            tours: `${
                tours.length
            } results out of ${await Tour.countDocuments()}`
        },
        currentUser: {
            id: req.currentUser._id,
            name: req.currentUser.name,
            email: req.currentUser.email,
            role: req.currentUser.role
        },
        data: {
            tours
        }
    });
});

exports.getToursDistance = catchAsync(async (req, res, next) => {
    const { latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');
    const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
    if (!lat || !lng)
        return next(
            AppError(
                'Your Location was not defined properly. try specifying this format: 34.111745,-118.113491 with latitude first',
                400
            )
        );

    // There are more mongodb operators for geospatial calculations go to docs online, for example $near
    const distances = await Tour.aggregate([
        {
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [lng * 1, lat * 1]
                },
                distanceField: 'distance',
                distanceMultiplier: multiplier
            }
        },
        {
            $project: {
                distance: 1,
                name: 1
            }
        }
    ]);

    res.status(200).json({
        status: 'success',
        currentUser: {
            id: req.currentUser._id,
            name: req.currentUser.name,
            email: req.currentUser.email,
            role: req.currentUser.role
        },
        data: {
            unit: unit === 'mi' ? 'miles' : 'kilometers',
            distances
        }
    });
});

exports.alias = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    next();
};
