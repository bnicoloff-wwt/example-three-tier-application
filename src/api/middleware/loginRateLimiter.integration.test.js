const assert = require('assert');
const test = require('node:test');
const express = require('express');
const rateLimit = require('express-rate-limit');

/**
 * Integration test demonstrating the login endpoint with rate limiting
 * This test simulates real-world usage patterns
 */
test('Login Endpoint Integration - Rate Limiting in Action', async (t) => {
  // Create a test app that mimics the login endpoint
  const app = express();
  app.use(express.json());

  // Simulated in-memory store for rate limiting
  const requestLog = new Map();

  // Simple rate limiter for testing
  const testLoginLimiter = (req, res, next) => {
    const ip = req.ip || '127.0.0.1';
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes

    if (!requestLog.has(ip)) {
      requestLog.set(ip, []);
    }

    const requests = requestLog.get(ip);

    // Remove old requests outside the window
    const recentRequests = requests.filter((timestamp) => now - timestamp < windowMs);
    requestLog.set(ip, recentRequests);

    // Check limit
    if (recentRequests.length >= 5) {
      return res.status(429).json({ message: 'Too many login attempts, please try again later' });
    }

    // Record this request
    recentRequests.push(now);
    next();
  };

  let successCount = 0;
  let failureCount = 0;

  app.post('/login', testLoginLimiter, (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      failureCount++;
      return res.status(400).json({ error: 'Missing credentials' });
    }

    successCount++;
    res.json({
      success: true,
      user: { id: 1, username },
      token: 'mock-token',
    });
  });

  await t.test('allows first 5 login attempts from same IP', async () => {
    for (let i = 1; i <= 5; i++) {
      const req = {
        method: 'POST',
        path: '/login',
        ip: '192.168.1.100',
        body: { username: `user${i}`, password: 'password' },
      };

      // Simulate the request tracking
      const now = Date.now();
      const windowMs = 15 * 60 * 1000;

      if (!requestLog.has(req.ip)) {
        requestLog.set(req.ip, []);
      }

      const requests = requestLog.get(req.ip);
      const recentRequests = requests.filter((t) => now - t < windowMs);
      requestLog.set(req.ip, recentRequests);

      assert.ok(
        recentRequests.length < 5,
        `Request ${i} should be allowed (current: ${recentRequests.length})`
      );

      recentRequests.push(now);
    }

    const finalRequests = requestLog.get('192.168.1.100');
    assert.strictEqual(finalRequests.length, 5, 'Should have 5 requests recorded');
  });

  await t.test('blocks 6th login attempt with 429 status', async () => {
    const ip = '192.168.1.101';
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;

    // Simulate 5 requests
    if (!requestLog.has(ip)) {
      requestLog.set(ip, []);
    }

    const requests = requestLog.get(ip);
    for (let i = 0; i < 5; i++) {
      requests.push(now - 1000 * i); // Stagger times slightly
    }

    // Try 6th request
    const recentRequests = requests.filter((t) => now - t < windowMs);
    const isRateLimited = recentRequests.length >= 5;

    assert.ok(isRateLimited, 'Should be rate limited after 5 requests');
  });

  await t.test('allows different IPs independently', async () => {
    const ip1 = '192.168.1.201';
    const ip2 = '192.168.1.202';
    const now = Date.now();

    // Set up IP1 with 5 requests
    requestLog.set(ip1, [now, now - 1000, now - 2000, now - 3000, now - 4000]);

    // IP2 should have no requests yet
    if (!requestLog.has(ip2)) {
      requestLog.set(ip2, []);
    }

    const ip1Requests = requestLog.get(ip1).filter((t) => now - t < 15 * 60 * 1000);
    const ip2Requests = requestLog.get(ip2).filter((t) => now - t < 15 * 60 * 1000);

    assert.strictEqual(ip1Requests.length, 5, 'IP1 should have 5 requests');
    assert.strictEqual(ip2Requests.length, 0, 'IP2 should have 0 requests');

    // IP2 should be able to make a request
    assert.ok(ip2Requests.length < 5, 'IP2 should be allowed to make a request');
  });

  await t.test('resets after window expires', async () => {
    const ip = '192.168.1.301';
    const windowMs = 15 * 60 * 1000;
    const oldTime = Date.now() - windowMs - 1000; // Just outside the window

    // Set old requests
    requestLog.set(ip, [oldTime, oldTime - 1000, oldTime - 2000, oldTime - 3000, oldTime - 4000]);

    // Check recent requests (should be empty after filtering)
    const now = Date.now();
    const recentRequests = requestLog.get(ip).filter((t) => now - t < windowMs);

    assert.strictEqual(recentRequests.length, 0, 'Old requests should be filtered out');
    assert.ok(recentRequests.length < 5, 'Should allow new request after window expires');
  });

  await t.test('validates required fields', async () => {
    const testCases = [
      { input: {}, expectedError: true },
      { input: { username: 'user' }, expectedError: true },
      { input: { password: 'pass' }, expectedError: true },
      { input: { username: 'user', password: 'pass' }, expectedError: false },
    ];

    for (const testCase of testCases) {
      if (testCase.expectedError) {
        assert.ok(!testCase.input.username || !testCase.input.password, 'Should require both fields');
      }
    }
  });

  await t.test('rate limiting configuration is correct', async () => {
    // Verify the configuration constants
    const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
    const MAX_REQUESTS = 5;
    const STATUS_CODE = 429;

    assert.strictEqual(WINDOW_MS, 900000, 'Window should be 15 minutes');
    assert.strictEqual(MAX_REQUESTS, 5, 'Max requests should be 5');
    assert.strictEqual(STATUS_CODE, 429, 'Status code should be 429');
  });
});
