const rateLimit = require('express-rate-limit');

/**
 * Create a rate limiter for the login endpoint
 * Allows 5 attempts per 15 minutes per IP address
 */
const createLoginLimiter = () => {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: 'Too many login attempts, please try again later',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skip: (req, res) => {
      // Don't count health checks
      return req.path === '/health';
    },
    keyGenerator: (req, res) => {
      // Use IP address as the key for rate limiting
      return req.ip || req.socket.remoteAddress;
    },
    handler: (req, res) => {
      res.status(429).json({
        error: 'Too many login attempts, please try again in 15 minutes',
      });
    },
  });
};

module.exports = { createLoginLimiter };
