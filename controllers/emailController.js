const fs = require('fs');
const shortid = require('shortid');
const fetch = require('node-fetch');

const { Storage } = require('@google-cloud/storage');
const Email = require('./../models/emailModel');
// const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const EmailCustom = require('./../utils/emailCustom');
const generateCredentials = require('./../utils/generateCredentials');

exports.getFile = catchAsync(async (req, res, next) => {
    const { url } = req.query;
    const file = await fetch(url);
    const { downloadTokens } = await file.json();
    const fileFinal = await fetch(`${url}?alt=media&token=${downloadTokens}`);
    const bufFileFinal = await fileFinal.buffer();
    const { headers } = fileFinal;
    const finalHeaders = [];
    Object.keys(headers.raw()).forEach(key => {
        finalHeaders.push([key, headers.raw()[key][0]]);
    });
    res.writeHead(200, finalHeaders).end(bufFileFinal);
});

const uploadFile = async (filename, buf, bucket, mime) => {
    return new Promise((resolve, reject) => {
        const blob = bucket.file(filename);
        const blobStream = blob.createWriteStream({
            metadata: {
                contentType: mime
            }
        });
        // If there's an error
        blobStream.on('error', err => reject(err));
        // If all is good and done
        blobStream.on('finish', () => {
            // Assemble the file public URL
            const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${
                bucket.name
            }/o/${encodeURI(blob.name)}`;
            // Return the file name and its public URL
            // for you to store in your own database
            resolve(publicUrl);
        });
        // When there is no more data to be consumed from the stream the end event gets emitted
        blobStream.end(buf);
    });
};

const asyncForEach = async (arr, cb) => {
    for (let index = 0; index < arr.length; index += 1) {
        // eslint-disable-next-line no-await-in-loop
        await cb(arr[index], index, arr);
    }
};

exports.incomingEmail = catchAsync(async (req, res, next) => {
    const cred = generateCredentials(process);
    const path = `${__dirname}/serviceAccount.json`;
    fs.writeFileSync(path, JSON.stringify(cred));
    const storage = new Storage({
        projectId: process.env.GCLOUD_PROJECT_ID,
        keyFilename: path
    });
    const bucket = storage.bucket(process.env.GCLOUD_STORAGE_BUCKET_URL);
    await asyncForEach(req.files, async file => {
        const name = `${shortid.generate()}-${Date.now()}-${file.originalname}`;
        const pUrl = await uploadFile(name, file.buffer, bucket, file.mimetype);
        file.filename = name;
        file.url = pUrl;
        file.paramUrl = encodeURIComponent(pUrl);
        file.publicUrl = `${req.protocol}://${req.get(
            'host'
        )}/photo?url=${encodeURIComponent(pUrl)}`;
        delete file.buffer;
    });

    req.body.files = JSON.stringify(req.files);
    try {
        const doc = await Email.create(req.body);
        res.status(200).json({ received: true, doc });
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

    await email.send();
    res.status(200).json({ status: 'ok' });
});
