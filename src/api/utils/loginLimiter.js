const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for the login endpoint
 * Limits requests to 10 per 15 minutes per IP address
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per windowMs
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for non-login requests
    return req.path !== '/auth/login';
  },
  keyGenerator: (req) => {
    // Use IP address as the key
    return req.ip || req.connection.remoteAddress;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many login attempts, please try again later.',
      retryAfter: req.rateLimit.resetTime,
    });
  },
});

module.exports = loginLimiter;
