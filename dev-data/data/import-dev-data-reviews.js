// const fs = require('fs');
// const mongoose = require('mongoose');
// const dotenv = require('dotenv');
// const Review = require('./../../models/reviewModel');

// dotenv.config({ path: './config.env' });
// // console.log(process.env);

// // Change Between local and remote connections:
// //  change DB value to O in config.env
// //  open a server by typing 'mongod' in a powershell
// const DBOnline = process.env.DATABASE.replace(
//     '<PASSWORD>',
//     process.env.DATABASE_PASSWORD
// );
// const DBLocal = process.env.DATABASE_LOCAL;
// const DB = process.env.DB === 'L' ? DBLocal : DBOnline;
// mongoose
//     .connect(DB, {
//         useNewUrlParser: true,
//         useCreateIndex: true,
//         useFindAndModify: false
//     })
//     .then(() => {
//         // console.log('DB connected');
//     });

// // const userNames = JSON.parse(
// //     fs.readFileSync(`${__dirname}/users-simple.json`, 'utf-8')
// // );
// // const users = userNames.map(userName => {
// //     return {
// //         name: userName,
// //         email: `${userName.split(' ').join('.')}@highmail.com`,
// //         password: `${userName.split(' ')[0]}100`,
// //         passwordConfirm: `${userName.split(' ')[0]}100`
// //     };
// // });
// const reviewsFile = JSON.parse(
//     fs.readFileSync(`${__dirname}/reviews-to-import.json`, 'utf-8')
// );
// // const toursFile = JSON.parse(
// //     fs.readFileSync(`${__dirname}/tours.json`, 'utf-8')
// // );
// // const usersFile = JSON.parse(
// //     fs.readFileSync(`${__dirname}/users-to-import.json`, 'utf-8')
// // );
// // // console.log(toursFile[0]._id);
// // let currentUser = 0;
// // let currentTour = 0;
// // const reviews = [];

// // const hasntEl = el => {
// //     reviews.forEach(elem => {
// //         if (el.user === elem.user && el.tour === elem.tour) {
// //             return false;
// //         }
// //     });
// //     return true;
// // };

// // const checkRe = el => {
// //     // console.log(el);
// //     if (hasntEl(el)) {
// //         reviews.push(el);
// //         // console.log(await Review.find({ user: el.user, tour: el.tour }));
// //     }
// // };
// // const generateUser = () => {
// //     const user = currentUser;
// //     currentUser += 1;
// //     if (usersFile[currentUser]._id) return usersFile[user]._id;
// // };

// // const generateTour = () => {
// //     const user = generateUser();
// //     if (user) {
// //         currentTour += 1;
// //         return {
// //             user,
// //             tour: toursFile[currentTour]._id
// //         }
// //     }
// //     currentUser = 0;
// //     generateTour();
// // };

// // reviewsFile.forEach(review => {
// //     // console.log(review);
// //     // console.log(review.tour);
// //     // console.log(review.user);
// //     const info = generateTour();
// //     review.tour = info.tour;
// //     review.user = info.user;
// // });
// console.log(Review);

// const importData = async () => {
//     // reviewsFile.forEach(async el => {
//     try {
//         // console.log(el);
//         await Review.create(reviewsFile);
//         // console.log('Data successfully loaded');
//     } catch (error) {
//         //
//     }
//     // });
//     process.exit();
// };
// const deleteData = async () => {
//     try {
//         await Review.deleteMany();
//         // console.log('Data successfully deleted');
//     } catch (error) {
//         // console.log(error);
//     }
//     process.exit();
// };

// if (process.argv[2] === '--delete') {
//     deleteData();
// } else if (process.argv[2] === '--import') {
//     importData();
// }
// // console.log(process.argv);
