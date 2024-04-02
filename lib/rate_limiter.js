const setRateLimit = require("express-rate-limit");

const rateLimitMiddleware = setRateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: "You have exceeded your 10 requests per minute limit.",
    headers: true,
});

module.exports = rateLimitMiddleware;
