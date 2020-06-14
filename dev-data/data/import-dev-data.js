const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('./../../models/tourModel');
const User = require('./../../models/userModel');
const Review = require('./../../models/reviewModel');

dotenv.config({ path: './config.env' });
// console.log(process.env);

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
        // console.log('DB connected');
    });

const tours = JSON.parse(
    fs.readFileSync(`${__dirname}/tours.json`, 'utf-8')
    // fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8')
);
const users = JSON.parse(
    fs.readFileSync(`${__dirname}/users-to-import.json`, 'utf-8')
);
const reviews = JSON.parse(
    fs.readFileSync(`${__dirname}/reviews-to-import.json`, 'utf-8')
);

const importData = async () => {
    try {
        await Tour.create(tours);
        await User.create(users);
        await Review.create(reviews);
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
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        await Tour.create(tours);
        await User.create(users);
        await Review.create(reviews);
        // eslint-disable-next-line no-console
        console.log('Data successfully deleted and loaded loaded');
    } catch (error) {
        // eslint-disable-next-line no-console
        console.log(error);
    }
    process.exit();
};
const deleteData = async () => {
    try {
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
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
// console.log(process.argv);
