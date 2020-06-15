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
    fromUser: {
        type: String,
        default: ''
    },
    toUser: [
        {
            type: String,
            default: ''
        }
    ],
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
    },
    read: {
        type: Boolean,
        default: false
    },
    archived: {
        type: Boolean,
        default: false
    },
    deleted: {
        type: Boolean,
        default: false
    }
});

emailSchema.pre('save', function(next) {
    try {
        if (this.envelope) {
            const env = JSON.parse(this.envelope);
            this.fromUser = env.from.substring(0, env.from.indexOf('@'));
            this.toUser = env.to.map(ad => {
                return ad.substring(0, ad.indexOf('@'));
            });
        }
        // eslint-disable-next-line no-empty
    } catch {}

    next();
});

// THE FIRST ARGUMENT IS THE NAME THAT GOES IN THE REF
const Email = mongoose.model('Email', emailSchema);

module.exports = Email;
