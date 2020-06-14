const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
    headers: {
        type: String
    },
    dkim: {
        type: String
    },
    'content-ids': {
        type: String
    },
    to: {
        type: String
    },
    html: {
        type: String
    },
    from: {
        type: String
    },
    text: {
        type: String
    },
    sender_ip: {
        type: String
    },
    envelope: {
        type: String
    },
    attachments: {
        type: String
    },
    subject: {
        type: String
    },
    'attachment-info': {
        type: String
    },
    charsets: {
        type: String
    },
    SPF: {
        type: String
    },
    files: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
});

// THE FIRST ARGUMENT IS THE NAME THAT GOES IN THE REF
const Email = mongoose.model('Email', emailSchema);

module.exports = Email;
