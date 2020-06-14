module.exports = class extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${this.statusCode}`.startsWith('4')
            ? 'failure'
            : 'error';
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
};

// exports.errCreate = function(
//     code = 500,
//     status = 'error',
//     message = 'Something went wrong'
// ) {
//     /**
//      * Pass in a status code, status and message
//      */
//     const err = new Error(message);
//     err.statusCode = code;
//     err.status = status;
//     return err;
// };
