const Email = require('./../models/emailModel');
// const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const EmailCustom = require('./../utils/emailCustom');

exports.incomingEmail = catchAsync(async (req, res, next) => {
    req.body.files = JSON.stringify(req.files);
    try {
        await Email.create(req.body);
        res.status(200).json({ received: true });
    } catch (err) {
        res.status(500).json({ received: false });
    }
});

exports.outgoingEmail = catchAsync(async (req, res, next) => {
    if (!req.body.to) req.body.to = '';
    if (!req.body.name) req.body.name = '';
    if (!req.body.from) req.body.from = '';
    if (!req.body.subject) req.body.subject = '';
    if (!req.body.html) req.body.html = '';

    let email = new EmailCustom(req.body.subject, req.body.html);
    email = email.addSender(req.body.name, req.body.from);
    email = email.addRecipients(req.body.to);
    if (req.body.cc) email = email.addCopies(req.body.cc);
    if (req.body.bcc) email = email.addHiddenCopies(req.body.bcc);
    if (req.body.headers)
        email = email.addHeaders(JSON.parse(req.body.headers));

    if (req.body.guide) {
        const guide = JSON.parse(req.body.guide);
        guide.forEach(fil => {
            fil.file = req.files.filter(val => val.fieldname === fil.field)[0];
        });
        req.cbody = {};
        req.cbody.files = guide.filter(val => val.file);
        req.cbody.calendar = req.cbody.files.filter(val => val.calendar)[0];
        req.cbody.attach = req.cbody.files.filter(
            val => !val.calendar && !val.ref
        );
        req.cbody.embed = req.cbody.files.filter(
            val => !val.calendar && val.ref
        );
    }

    if (req.cbody) {
        if (req.cbody.attach) {
            req.cbody.attach.forEach(file => {
                email = email.addAttachment(
                    file.file.originalname,
                    file.file.buffer
                );
            });
        }
        if (req.cbody.embed) {
            req.cbody.embed.forEach(emb => {
                email = email.addEmbedded(
                    emb.file.originalname,
                    emb.file.buffer,
                    emb.ref
                );
            });
        }
        if (req.cbody.calendar) {
            email = email.addCalendar(
                req.cbody.calendar.file.originalname,
                req.cbody.calendar.file.buffer
            );
        }
    }

    console.log(await email.send());
    res.status(200).json({ status: 'ok' });
});
