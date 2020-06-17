const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const socketIo = require('socket.io');
const app = require('./app');
const { socketHandler } = require('./socket');
const Email = require('./models/emailModel');

const ioServer = http.createServer(app);
const io = socketIo(ioServer);

process.on('uncaughtException', err => {
    // eslint-disable-next-line no-console
    console.log('UNCAUGHT EXCEPTION... shutting down');
    // eslint-disable-next-line no-console
    console.error(err.name, err.message);
    process.exit(1);
});

dotenv.config({ path: './config.env' });
// console.log(process.env.NODE_ENV);

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

// Server
const port = process.env.PORT || 3000;
// const server = app.listen(port, () => {
//     // console.log(`App running on port ${port}...`);
// });
const server = ioServer.listen(port, () => {});

process.on('unhandledRejection', err => {
    // eslint-disable-next-line no-console
    console.error(err.name, err.message);
    // eslint-disable-next-line no-console
    console.log('UNHANDLED REJECTION... shutting down');
    server.close(() => {
        process.exit(1);
    });
});

process.on('SIGTERM', () => {
    // eslint-disable-next-line no-console
    console.log('😊 SIGTERM Received... shutting down gracefully');
    server.close(() => {
        // eslint-disable-next-line no-console
        console.log('Process Terminated 👋');
    });
});

io.on('connection', socketHandler(io));

const emailEventEmitter = Email.watch();

emailEventEmitter.on('change', change => {
    io.emit('refresh_emails', { change: change });
});
