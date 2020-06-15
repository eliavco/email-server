const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Email = require('./../../models/emailModel');
const User = require('./../../models/userModel');

dotenv.config({ path: './config.env' });

// Change Between local and remote connections:
//  change DB value to O in config.env
//  open a server by typing 'mongod' in a powershell
const DBOnline = process.env.DATABASE.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD
);
const DBLocal = process.env.DATABASE_LOCAL;
const DB = process.env.DB === 'L' ? DBLocal : DBOnline;
mongoose
    .connect(DB, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false
    })
    .then(() => {
        // eslint-disable-next-line no-console
        console.log('DB connected');
    });

const emails = JSON.parse(fs.readFileSync(`${__dirname}/emails.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));

const importData = async () => {
    try {
        await Email.create(emails);
        await User.create(users);
        // eslint-disable-next-line no-console
        console.log('Data successfully loaded');
    } catch (error) {
        // eslint-disable-next-line no-console
        console.log(error);
    }
    process.exit();
};
const delNImpoetData = async () => {
    try {
        await Email.deleteMany();
        await User.deleteMany();

        await Email.create(emails);
        await User.create(users);

        // eslint-disable-next-line no-console
        console.log('Data successfully deleted and loaded');
    } catch (error) {
        // eslint-disable-next-line no-console
        console.log(error);
    }
    process.exit();
};
const deleteData = async () => {
    try {
        await Email.deleteMany();
        await User.deleteMany();

        // eslint-disable-next-line no-console
        console.log('Data successfully deleted');
    } catch (error) {
        // eslint-disable-next-line no-console
        console.log(error);
    }
    process.exit();
};

if (process.argv[2] === '--delete') {
    deleteData();
} else if (process.argv[2] === '--import') {
    importData();
} else if (process.argv[2] === '--empop') {
    delNImpoetData();
}
