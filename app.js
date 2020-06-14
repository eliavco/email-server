const express = require('express');
const path = require('path');
const helmet = require('helmet');
// const sassMiddleware = require('node-sass-middleware');
// const sass = require('node-sass');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');
// const rateLimit = require('express-rate-limit');
const apiDocRouter = require('./routes/apiDocRoutes');
// const rewriteDocs = require('./dev-data/data/import-dev-data-docs');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const bookingController = require('./controllers/bookingController');
const viewRouter = require('./routes/viewRoutes');
const globalErrorHandler = require('./controllers/errorController');
const AppError = require('./utils/appError');

const app = express();
app.enable('trust proxy');
app.use(cors());
// Access-Control-Allow-Origin *
// api.natours.com frontend natours.com
// app.use(
//     cors({
//         origin: 'https://www.natours.com'
//     })
// );

// OPTIONS IS AN HTTP METHOD
app.options('*', cors());
// app.options('/api/v1/tours', cors());

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// app.use(express.static(`${__dirname}/public`));

//         src: './public/css/sass/style.scss',
//         dest: './public/css/style.css',

// app.use(
//     sassMiddleware({
//         src: __dirname,
//         dest: path.join(__dirname, 'public'),
//         debug: process.env.NODE_ENV !== 'production',
//         indentedSyntax: false,
//         outputStyle: 'compressed',
//         sourceMap: true
//     })
// );

app.use(express.static(path.join(__dirname, 'public')));

app.use(helmet());
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// rewriteDocs.rewriteData();

/*const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: {
        status: 'error',
        message: 'Too many requests, please try again later'
    },
    handler: function(req, res , next) {
        res.status(this.statusCode).json(this.message);
    }
});*/

// Limit requests from IP
// app.use('/api', limiter);

// HAS to be before JSON parsing
app.post(
    '/webhook-checkout',
    express.raw({ type: 'application/json' }),
    bookingController.webhookCheckout
);

// JSON DECODING
app.use(
    express.json({
        limit: '10kb'
    })
);

// Form Decoding
app.use(
    express.urlencoded({
        extended: true,
        limit: '10kb'
    })
);

// Cookie decoding
app.use(cookieParser());

app.use('api/v1/users/login', mongoSanitize());
app.use('api/v1/users/signup', mongoSanitize());
app.use(xss());
app.use(
    hpp({
        whitelist: [
            'duration',
            'ratingsQuantity',
            'ratingsAverage',
            'maxGroupSize',
            'difficulty',
            'price'
        ]
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
const apiVersion = 1;
app.use(
    `/api/v${apiVersion}/tours`,
    // cors(),
    tourRouter
);
app.use(`/api/v${apiVersion}/users`, userRouter);
app.use(`/api/v${apiVersion}/reviews`, reviewRouter);
app.use(`/api/v${apiVersion}/bookings`, bookingRouter);
app.use('/api', apiDocRouter);

app.all(`/api/*`, (req, res, next) => {
    next(new AppError(`The URL path ${req.originalUrl} was not found`, 404));
});

app.use('/', viewRouter);
app.all(`/*`, (req, res, next) => {
    next(new AppError(`The URL path ${req.originalUrl} was not found`, 404));
});

//
// ERROR HANDLING FUNCTION
app.use(globalErrorHandler);

module.exports = app;
