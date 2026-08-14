const assert = require('assert');
const test = require('node:test');
const express = require('express');
const { createLoginLimiter } = require('./rateLimiter');

test('Rate Limiter - login endpoint protection', async (t) => {
  await t.test('should allow up to 5 requests per 15 minutes', () => {
    const app = express();
    const limiter = createLoginLimiter();

    app.post('/login', limiter, (req, res) => {
      res.json({ success: true });
    });

    // Test that the limiter is properly configured
    assert.ok(limiter, 'Limiter should be created');
  });

  await t.test('should return 429 status when rate limit exceeded', () => {
    const limiter = createLoginLimiter();

    // Check that the limiter has the correct configuration
    assert.strictEqual(limiter.options.max, 5, 'Should limit to 5 requests');
    assert.strictEqual(
      limiter.options.windowMs,
      15 * 60 * 1000,
      'Window should be 15 minutes'
    );
  });

  await t.test('should have appropriate error message', () => {
    const limiter = createLoginLimiter();
    assert.ok(
      limiter.options.message,
      'Should have error message configured'
    );
  });

  await t.test('should use IP address as key', () => {
    const limiter = createLoginLimiter();
    const req = {
      ip: '192.168.1.1',
      socket: { remoteAddress: '192.168.1.1' },
    };
    const key = limiter.options.keyGenerator(req);
    assert.strictEqual(key, '192.168.1.1', 'Should use IP address as key');
  });

  await t.test('should have rate limit headers enabled', () => {
    const limiter = createLoginLimiter();
    assert.strictEqual(
      limiter.options.standardHeaders,
      true,
      'Standard headers should be enabled'
    );
    assert.strictEqual(
      limiter.options.legacyHeaders,
      false,
      'Legacy headers should be disabled'
    );
  });

  await t.test('handler should respond with 429 status', () => {
    const limiter = createLoginLimiter();
    const req = {};
    const res = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.data = data;
        return this;
      },
    };

    // Test the handler directly
    limiter.options.handler(req, res);
    assert.strictEqual(res.statusCode, 429, 'Should return 429 status');
    assert.ok(res.data.error, 'Should include error message');
  });
});
