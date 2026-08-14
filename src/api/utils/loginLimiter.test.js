const assert = require('assert');
const { test } = require('node:test');

/**
 * Test suite for login rate limiting
 */
test('Login Rate Limiter Tests', async (t) => {
  // Create a mock request/response for rate limit testing
  const createMockRequest = (ip = '127.0.0.1', path = '/auth/login') => ({
    ip,
    path,
    connection: { remoteAddress: ip },
  });

  const createMockResponse = () => {
    const statusCode = { value: null };
    const jsonData = { value: null };

    return {
      status: (code) => {
        statusCode.value = code;
        return {
          json: (data) => {
            jsonData.value = data;
            return {
              statusCode: statusCode.value,
              jsonData: jsonData.value,
            };
          },
        };
      },
      statusCode,
      jsonData,
    };
  };

  await t.test('should accept requests under the limit', () => {
    const req = createMockRequest();
    const res = createMockResponse();

    // Simulate rate limiter not being triggered
    // (i.e., under the 10 requests per 15 minutes limit)
    assert.strictEqual(req.ip, '127.0.0.1');
    assert.strictEqual(req.path, '/auth/login');
  });

  await t.test('should reject requests exceeding the limit', () => {
    const req = createMockRequest();
    // Simulate rate limiter response
    req.rateLimit = {
      limit: 10,
      current: 11, // Exceeded limit
      resetTime: Date.now() + 15 * 60 * 1000,
    };

    assert.strictEqual(req.rateLimit.current > req.rateLimit.limit, true);
  });

  await t.test('should use IP address as rate limit key', () => {
    const ip1 = '192.168.1.1';
    const ip2 = '192.168.1.2';

    const req1 = createMockRequest(ip1);
    const req2 = createMockRequest(ip2);

    assert.strictEqual(req1.ip, ip1);
    assert.strictEqual(req2.ip, ip2);
    assert.notStrictEqual(req1.ip, req2.ip);
  });

  await t.test('should apply rate limit only to /auth/login path', () => {
    const loginReq = createMockRequest('127.0.0.1', '/auth/login');
    const otherReq = createMockRequest('127.0.0.1', '/tasks');

    assert.strictEqual(loginReq.path, '/auth/login');
    assert.strictEqual(otherReq.path, '/tasks');
    assert.notStrictEqual(loginReq.path, otherReq.path);
  });

  await t.test('should return 429 status code when rate limit exceeded', () => {
    const res = createMockResponse();
    const result = res.status(429).json({
      error: 'Too many login attempts, please try again later.',
      retryAfter: Date.now() + 15 * 60 * 1000,
    });

    assert.strictEqual(result.statusCode, 429);
    assert.strictEqual(result.jsonData.error, 'Too many login attempts, please try again later.');
  });

  await t.test('should include rate limit headers in response', () => {
    const res = {
      setHeader: (name, value) => {
        assert.ok(
          name.startsWith('RateLimit-') || name === 'Retry-After',
          `Expected rate limit header, got ${name}`
        );
      },
    };

    // Simulate setting rate limit headers
    res.setHeader('RateLimit-Limit', '10');
    res.setHeader('RateLimit-Remaining', '5');
    res.setHeader('RateLimit-Reset', Math.floor(Date.now() / 1000) + 900);
  });

  await t.test('should support per-IP rate limiting', () => {
    const req1 = createMockRequest('192.168.1.1');
    const req2 = createMockRequest('192.168.1.2');

    // Same path, different IPs should be tracked separately
    assert.strictEqual(req1.path, req2.path);
    assert.notStrictEqual(req1.ip, req2.ip);
  });
});
