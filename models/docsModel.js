const mongoose = require('mongoose');

const documentationSchema = new mongoose.Schema(
    {
        title: { type: String, unique: true },
        content: String
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

const Documentation = mongoose.model('Documentation', documentationSchema);
module.exports = Documentation;
