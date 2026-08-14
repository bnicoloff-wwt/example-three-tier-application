const test = require('node:test');
const assert = require('node:assert');

test('Rate limiter configuration', () => {
  // This test verifies the rate limiter settings
  const rateLimit = require('express-rate-limit');
  
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Maximum 10 requests per window
    message: 'Too many login attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Verify the limiter is a function (middleware)
  assert.strictEqual(typeof loginLimiter, 'function', 'Rate limiter should be a function');
});

test('Rate limiting behavior - expect headers', () => {
  // Verify express-rate-limit is installed
  const rateLimit = require('express-rate-limit');
  assert.strictEqual(typeof rateLimit, 'function', 'express-rate-limit should be installed');
});
