const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport'); // this is important
const htmlToText = require('html-to-text');
const emailHostConfig = require('./emailHostConfig');

module.exports = class EmailCustom {
    /*** Use this with the methods createTransporter or send for custom emails and sendWelcome for welcome emails* @param {object} user* @param {string} url*/

    constructor(subject, html) {
        this.subject = subject;
        this.html = html;
        this.text = htmlToText.fromString(html);
        this.serverSettings = emailHostConfig;
        this.attachments = [];
        this.transporter = nodemailer.createTransport(
            smtpTransport(this.serverSettings(process))
        );
    }

    addSender(name, from) {
        this.name = name;
        this.from = from;
        return this;
    }

    addRecipients(to) {
        to = `${this.from},${to}`;
        this.to = to;
        return this;
    }

    addCopies(cc) {
        this.cc = cc;
        return this;
    }

    addHiddenCopies(bcc) {
        this.bcc = bcc;
        return this;
    }

    addHeaders(headers) {
        this.headers = headers;
        return this;
    }

    addCalendar(filename, ical) {
        this.icalEvent = {
            filename,
            method: 'request',
            content: ical
        };
        return this;
    }

    addIcsCalendar(filename, ical) {
        return this.addCalendar(`${filename}.ics`, ical);
    }

    addAttachment(filename, content) {
        this.attachments.push({
            filename,
            content
        });
        return this;
    }

    addEmbedded(filename, content, reference) {
        this.attachments.push({
            filename,
            content,
            cid: reference
        });
        return this;
    }

    newTransporter() {
        return this.transporter;
    }

    async send() {
        /*** @param {string} template* @param {string} subject*/

        const mailOptions = {
            from: `${this.name} <${this.from}>`,
            to: this.to,
            cc: this.cc,
            bcc: this.bcc,
            headers: this.headers,
            subject: this.subject,
            html: this.html,
            text: this.text,
            attachments: this.attachments,
            icalEvent: this.icalEvent
        };

        await this.transporter.sendMail(mailOptions);
    }
};
