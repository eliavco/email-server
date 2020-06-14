// const fs = require('fs');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Documentation = require('./../models/docsModel');

const reISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*))(?:Z|(\+|-)([\d|:]*))?$/;
// eslint-disable-next-line no-useless-escape
const reMsAjax = /^\/Date\((d|-|.*)\)[\/|\\]$/;

exports.getAll = Model =>
    catchAsync(async (req, res, next) => {
        const features = new APIFeatures(
            Model.find(),
            req.body,
            req.query,
            Model
        )
            .filter()
            .sort()
            .limitFields()
            .paginate();

        const documents = await features.query;
        // const documents = await features.query.explain();
        // results above in section a of comments file under dev-data

        if (!req.currentUser)
            req.currentUser = {
                _id: '',
                name: '',
                email: '',
                role: ''
            };

        res.status(200).json({
            status: 'success',
            results: {
                documents: `${
                    documents.length
                } results out of ${await Model.countDocuments()}`
            },
            currentUser: {
                id: req.currentUser._id,
                name: req.currentUser.name,
                email: req.currentUser.email,
                role: req.currentUser.role
            },
            data: {
                documents
            }
        });
    });

exports.getOne = (Model, p) =>
    catchAsync(async (req, res, next) => {
        const doc = !p
            ? await Model.findById(req.params.id)
            : await Model.findById(req.params.id).populate({
                  path: 'reviews',
                  select: '-tour'
              });

        if (!doc)
            return next(new AppError('No document found for this ID', 404));

        res.status(200).json({
            status: 'success',
            data: {
                doc
            }
        });
    });

exports.createOne = Model =>
    catchAsync(async (req, res, next) => {
        const newDoc = await Model.create(req.body);

        res.status(201).json({
            status: 'success',
            data: newDoc
        });
    });

exports.updateOne = catchAsync(async (req, res, next) => {
    if (!req.upDoc)
        return next(new AppError('No document found for this ID', 404));

    res.status(200).json({
        status: 'success',
        data: {
            document: req.upDoc
        }
    });
});

exports.deleteOne = name =>
    catchAsync(async (req, res, next) => {
        if (!req.delDoc)
            return next(new AppError(`No ${name} found for this ID`, 404));

        res.status(204).json({
            status: 'success',
            data: null
        });
    });

exports.getMe = catchAsync(async (req, res, next) => {
    res.status(200).json({
        status: 'success',
        data: req.currentUser
    });
});

exports.getDoc = catchAsync(async (req, res, next) => {
    // const documentation = await JSON.parse(
    //     fs.readFileSync(
    //         `${__dirname}/../dev-data/data/api-documentation.json`,
    //         'utf-8'
    //     )
    // );
    const documentation = await Documentation.findOne({ title: 'API' });
    res.status(200).json({
        status: 'success',
        data: JSON.parse(documentation.content)
    });
});

exports.getStats = Model =>
    catchAsync(async (req, res, next) => {
        const aggregation = JSON.parse(
            JSON.stringify(req.body),
            JSON.dateParser
        );
        const stats = await Model.aggregate(aggregation.stages);
        res.status(200).json({
            status: 'success',
            results: stats.length,
            data: {
                stats
            }
        });
    });

JSON.dateParser = function(key, value) {
    if (typeof value === 'string') {
        let a = reISO.exec(value);
        if (a) return new Date(value);
        a = reMsAjax.exec(value);
        if (a) {
            const b = a[1].split(/[-+,.]/);
            return new Date(b[0] ? +b[0] : 0 - +b[1]);
        }
    }
    return value;
};
