const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel');
// const validator = require('validator');

const tourSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'A tour must have a name'],
            unique: true,
            trim: true,
            maxlength: [40, 'Your tour name is too long'],
            // validate: [validator.isAlpha, 'A name has to contain only letters'],
            minlength: [7, 'Your tour name is too short']
        },
        slug: String,
        duration: {
            type: Number,
            required: [true, 'A tour must have a duration']
        },
        maxGroupSize: {
            type: Number,
            required: [true, 'A tour must have a group size']
        },
        difficulty: {
            type: String,
            required: [true, 'A tour must have a difficulty'],
            enum: {
                values: ['easy', 'medium', 'difficult'],
                message: 'Difficulty has to be easy, medium or difficult'
            }
        },
        ratingsAverage: {
            type: Number,
            default: 0,
            min: [0.0, 'Rating has to be higher'],
            max: [5.0, 'Rating has to be lower']
        },
        ratingsQuantity: {
            type: Number,
            default: 0,
            min: [0, 'Quantity has to be higher']
        },
        price: {
            type: Number,
            required: [true, 'A tour must have a price'],
            min: [0, 'Quantity has to be higher']
        },
        priceDiscount: {
            type: Number,
            min: [0, 'Quantity has to be higher'],
            validate: {
                validator: function(val) {
                    // This only points to the current document on new
                    return val < this.price;
                },
                message:
                    'Price discount ({VALUE}) has to be lower than the original price'
            }
        },
        summary: {
            type: String,
            trim: true
        },
        theme: {
            type: String,
            trim: true,
            lowercase: true,
            default: 'green',
            select: false
        },
        description: {
            type: String,
            trim: true,
            required: [true, 'A tour must have a description']
        },
        imageCover: {
            type: String,
            required: [true, 'A tour must have a cover image']
        },
        secretTour: {
            type: Boolean,
            default: false
        },
        images: [String],
        createdAt: {
            type: Date,
            default: Date.now(),
            select: false
        },
        startDates: [Date],
        startLocation: {
            // add properties like an embedded doc
            type: {
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates: [
                {
                    type: Number
                }
            ],
            address: {
                type: String,
                trim: true
            },
            description: {
                type: String,
                trim: true
            }
        },
        locations: [
            {
                type: {
                    type: String,
                    default: 'Point',
                    enum: ['Point']
                },
                coordinates: [Number],
                address: {
                    type: String,
                    trim: true
                },
                description: {
                    type: String,
                    trim: true
                },
                day: Number
            }
        ],
        guides: [
            {
                type: mongoose.Schema.ObjectId,
                ref: 'User'
            }
        ]
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
});

tourSchema.virtual('durationWeeks').get(function() {
    return Math.floor((this.duration / 7) * 10) / 10;
});

tourSchema.virtual('endDates').get(function() {
    const that = this;
    const endCalc = function(el) {
        el.setDate(el.getDate() + that.duration);
        return el;
    };

    const endDates = this.startDates ? this.startDates.map(endCalc) : [];
    return endDates;
});

// tourSchema.pre(/^find/, function(next) {
//     this.populate({
//         path: 'reviews'
//     });
//     next();
// });

tourSchema.pre('save', function(next) {
    this.slug = slugify(this.name, { lower: true });
    next();
});

// tourSchema.pre('save', async function(next) {
//     const guidesProm = this.guides.map(async id => await User.findById(id));
//     this.guides = await Promise.all(guidesProm);
//     next();
// });

// tourSchema.pre('save', function(next) {
//     console.log('Will Save');
//     next();
// });

// tourSchema.post('save', function(doc, next) {
//     console.log(doc);
//     next();
// });
const unSecret = function(next) {
    // tourSchema.pre('find', function(next) {
    this.find({ secretTour: { $ne: true } });
    // this.start = Date.now();
    next();
};
tourSchema.pre('find', unSecret);
// tourSchema.pre('findOne', unSecret);
tourSchema.pre('findByIdAndRemove', unSecret);
// tourSchema.pre('findOneAndUpdate', unSecret);
tourSchema.pre('findOneAndRemove', unSecret);
tourSchema.pre('findOneAndReplace', unSecret);
// tourSchema.pre('findOneAndDelete', unSecret);
tourSchema.pre('findMany', unSecret);

// tourSchema.post(/^find/, function(docs, next) {
//     console.log(
//         `Query took ${(Date.now() - this.start) / 1000} seconds to run`
//     );
//     next();
// });

tourSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt'
    }).populate({
        path: 'reviews',
        select: '-__v'
    });
    next();
});

// tourSchema.pre('aggregate', function(next) {
//     this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//     next();
// });

// tourSchema.index({ price: 1 }); // NOW every time we will search through the collection the price index will be cached and save us time as it is the most popular filter index but it is still very heavy in size (the 1 stands for ascending and descending), you can add options for the index in a second argument object
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });
const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;
