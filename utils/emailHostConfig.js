module.exports = process => {
    return {
        host:
            process.env.EMAIL_TRAP === 'T'
                ? process.env.EMAIL_HOST_DEV
                : process.env.EMAIL_HOST_PROD,
        port:
            process.env.EMAIL_TRAP === 'T'
                ? process.env.EMAIL_PORT_DEV * 1
                : process.env.EMAIL_PORT_PROD * 1,
        auth: {
            user:
                process.env.EMAIL_TRAP === 'T'
                    ? process.env.EMAIL_USERNAME_DEV
                    : process.env.EMAIL_USERNAME_PROD,
            pass:
                process.env.EMAIL_TRAP === 'T'
                    ? process.env.EMAIL_PASSWORD_DEV
                    : process.env.EMAIL_PASSWORD_PROD
        }
    };
};
