const express = require('express');
const path = require('path');
const helmet = require('helmet');
// const sassMiddleware = require('node-sass-middleware');
// const sass = require('node-sass');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const multer = require('multer');
// const shortid = require('shortid');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const apiDocRouter = require('./routes/apiDocRoutes');
const emailRouter = require('./routes/emailRoutes');
const userRouter = require('./routes/userRoutes');
const emailController = require('././controllers/emailController');
const userController = require('././controllers/userController');
const globalErrorHandler = require('./controllers/errorController');
const AppError = require('./utils/appError');
const { protect /*, restrict */ } = require('./controllers/authController');

const app = express();
app.enable('trust proxy');
app.use(cors());

// OPTIONS IS AN HTTP METHOD
app.options('*', cors());

app.use(express.static(`${__dirname}/public`));

app.use(express.static(path.join(__dirname, 'public')));

app.use(helmet());
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

const apiVersion = 1;
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: {
        status: 'error',
        message: 'Too many requests, please try again later'
    },
    handler: function(req, res, next) {
        res.status(this.statusCode).json(this.message);
    }
});

const mstorage = multer.memoryStorage();

app.patch(
    `/api/v${apiVersion}/users/updateInfo`,
    protect,
    multer({
        storage: mstorage,
        fileFilter: (req, file, cb) => {
            if (file.mimetype.startsWith('image')) {
                cb(null, true);
            } else {
                cb(
                    new AppError(
                        'Not an image, please upload only images',
                        400
                    ),
                    false
                );
            }
        }
    }).single('photo'),
    userController.resizeUserPhoto
);
// HAS to be before JSON parsing
app.post(
    '/submit',
    multer({ storage: mstorage }).any(),
    // express.raw({ type: 'multipart/form-data' }),
    emailController.incomingEmail
);
app.post(
    '/send',
    multer({ storage: mstorage }).any(),
    // express.raw({ type: 'multipart/form-data' }),
    emailController.outgoingEmail
);

// Limit requests from IP
app.use('/api', limiter);

// JSON DECODING
app.use(
    express.json({
        limit: '120kb'
    })
);

// Form Decoding
app.use(
    express.urlencoded({
        extended: true,
        limit: '120kb'
    })
);

// Cookie decoding
app.use(cookieParser());

app.get('/photo', emailController.getFile);
app.use('api/v1/users/login', mongoSanitize());
app.use('api/v1/users/signup', mongoSanitize());
app.use(xss());
app.use(
    hpp({
        whitelist: []
    })
);

app.use(compression());

// custom middleware
app.use((req, res, next) => {
    // console.log('Hello from the middleware 👋');
    next();
});
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
});

// Routes Middleware
app.use(
    `/api/v${apiVersion}/emails`,
    // cors(),
    emailRouter
);
app.use(`/api/v${apiVersion}/users`, userRouter);
app.use('/api', apiDocRouter);

app.all(`/*`, (req, res, next) => {
    next(new AppError(`The URL path ${req.originalUrl} was not found`, 404));
});

//
// ERROR HANDLING FUNCTION
app.use(globalErrorHandler);

module.exports = app;
