const rateLimit = require('express-rate-limit');

/**
 * Rate limiter middleware for the login endpoint
 * Allows 5 login attempts per 15 minutes per IP address
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  message: 'Too many login attempts, please try again later',
  statusCode: 429,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  },
});

module.exports = loginLimiter;
