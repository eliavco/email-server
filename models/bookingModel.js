const mongoose = require('mongoose');
const Tour = require('./tourModel');

const bookingSchema = new mongoose.Schema({
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'A booking must have a tour']
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'A booking must belong to a user']
    },
    price: {
        type: Number,
        required: [true, 'A booking must have a price']
    },
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    paid: {
        type: Boolean,
        default: true
    }
});

bookingSchema.pre('save', async function(next) {
    const tour = await Tour.findById(this.tour);
    if (tour) this.startDate = tour.startDates[0];
    if (this.startDate)
        this.endDate = new Date(
            tour.startDates[0].getTime() + tour.duration * 24 * 60 * 60 * 1000
        );
    next();
});

bookingSchema.pre(/^find/, function(next) {
    this.populate('user').populate({ path: 'tour', select: 'name startDates' });
    next();
});

bookingSchema.index({ tour: 1, user: 1, startDate: 1 }, { unique: true });
// THE FIRST ARGUMENT IS THE NAME THAT GOES IN THE REF
const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
