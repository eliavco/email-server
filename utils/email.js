const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport'); // this is important
const pug = require('pug');
const htmlToText = require('html-to-text');
const emailHostConfig = require('./emailHostConfig');

module.exports = class Email {
    /*** Use this with the methods createTransporter or send for custom emails and sendWelcome for welcome emails* @param {object} user* @param {string} url*/

    constructor(user, url) {
        this.to = user.email;
        this.firstName = user.name.split(' ')[0];
        this.url = url;
        this.from = `${process.env.EMAIL_FROM_FIRSTNAME} ${process.env.EMAIL_FROM_LASTNAME} <${process.env.EMAIL_FROM}>`;
        this.serverSettings = emailHostConfig;
        this.transporter = nodemailer.createTransport(
            smtpTransport(this.serverSettings(process))
        );
    }

    newTransporter() {
        return this.transporter;
    }

    async send(template, subject) {
        /*** @param {string} template* @param {string} subject*/

        const html =
            pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
                firstName: this.firstName,
                url: this.url,
                subject
            }) || '';

        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: htmlToText.fromString(html)
        };

        await this.transporter.sendMail(mailOptions);
    }

    async sendWelcome() {
        return await this.send('welcome', 'Welcome to the Natours Family!');
    }

    async sendPasswordReset() {
        return await this.send(
            'passwordReset',
            'Your password reset token (valid for 10 minutes)'
        );
    }
};
