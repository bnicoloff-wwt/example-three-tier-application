# Login Endpoint Rate Limiting

## Overview

This document describes the rate-limiting implementation for the login endpoint in the example-three-tier-application. The rate limiter protects the `/auth/login` endpoint from brute-force attacks by restricting the number of login attempts per IP address.

## Features

### Rate Limiting Configuration

- **Limit**: 10 login attempts per IP address
- **Time Window**: 15 minutes
- **Enforcement**: Per IP address
- **Response Status**: 429 (Too Many Requests)

### Security Benefits

1. **Brute-Force Protection**: Prevents attackers from trying many password combinations in a short time
2. **DoS Mitigation**: Reduces impact of distributed brute-force attacks by limiting per-IP attempts
3. **Account Lockout Prevention**: Protects legitimate users from being locked out due to attacks
4. **Resource Protection**: Prevents excessive database queries from authentication attempts

### Response Behavior

When the rate limit is exceeded, the API returns:

```json
{
  "error": "Too many login attempts, please try again later.",
  "retryAfter": <unix-timestamp>
}
```

HTTP Status Code: **429 Too Many Requests**

The response includes standard `RateLimit-*` headers:
- `RateLimit-Limit`: Maximum requests allowed (10)
- `RateLimit-Remaining`: Requests remaining in current window
- `RateLimit-Reset`: Unix timestamp when the limit resets

## Implementation Details

### File Structure

```
src/api/
├── index.js                      # Main API with login endpoint
├── utils/
│   ├── loginLimiter.js          # Rate limiter middleware
│   └── loginLimiter.test.js      # Rate limiter tests
├── package.json                  # Dependencies (added express-rate-limit)
└── ...
```

### Dependencies

- **express-rate-limit** (^7.1.5): Middleware for Express rate limiting
  - Lightweight and efficient
  - In-memory store by default (suitable for single-instance deployments)
  - Customizable key generator and skip functions

### Rate Limiter Middleware

The rate limiter is defined in `src/api/utils/loginLimiter.js`:

```javascript
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,                    // 10 requests per window
  skip: (req) => {
    // Skip rate limiting for non-login requests
    return req.path !== '/auth/login';
  },
  keyGenerator: (req) => {
    // Use IP address as the key
    return req.ip || req.connection.remoteAddress;
  },
  // ... handler configuration
});
```

### Login Endpoint

The `/auth/login` endpoint is defined in `src/api/index.js`:

```javascript
app.post('/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ error: 'email is required' });
    }
    if (!password || typeof password !== 'string' || !password.trim()) {
      return res.status(400).json({ error: 'password is required' });
    }

    // TODO: Implement actual authentication logic
    // - Query users table
    // - Hash and compare passwords
    // - Return JWT token or session cookie
    // - Log failed attempts
    
    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (err) {
    next(err);
  }
});
```

**Note**: Currently, the endpoint always returns 401 (Invalid credentials) as a placeholder. Actual authentication logic (database queries, password hashing, token generation) should be implemented when user management is added.

## Usage

### API Endpoint

```bash
# Login request
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Responses

**Successful Login** (when implemented):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

**Invalid Credentials** (current placeholder):
```json
{
  "error": "Invalid credentials"
}
```

**Rate Limited** (after 10 attempts):
```json
{
  "error": "Too many login attempts, please try again later.",
  "retryAfter": 1723661700
}
```

**Validation Error**:
```json
{
  "error": "email is required"
}
```

## Testing

### Running Tests

```bash
cd src/api
npm test
```

This runs all tests including the rate limiter tests:

```
# Login Rate Limiter Tests
  ✓ should accept requests under the limit
  ✓ should reject requests exceeding the limit
  ✓ should use IP address as rate limit key
  ✓ should apply rate limit only to /auth/login path
  ✓ should return 429 status code when rate limit exceeded
  ✓ should include rate limit headers in response
  ✓ should support per-IP rate limiting
```

### Manual Testing

#### Test 1: Normal Login Attempt

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "pass123"}'
```

Expected: 401 Unauthorized (placeholder behavior)

#### Test 2: Rate Limit Exceeded

Run the login endpoint 11 times rapidly:

```bash
for i in {1..11}; do
  curl -X POST http://localhost:3001/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com", "password": "pass123"}' \
    -w "\nAttempt $i - Status: %{http_code}\n"
done
```

Expected:
- Attempts 1-10: 401 Unauthorized
- Attempt 11: 429 Too Many Requests

#### Test 3: Per-IP Isolation

From IP 1:
```bash
# Run 10 successful attempts, 11th should be rate limited
for i in {1..11}; do
  curl -X POST http://localhost:3001/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com", "password": "pass123"}'
done
```

From IP 2 (different machine/VPN):
```bash
# Should still have 10 attempts available
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "pass123"}'
```

Expected: Different IPs maintain separate rate limit counters

#### Test 4: Rate Limit Reset

1. Hit rate limit (11 attempts)
2. Get 429 response with `retryAfter` timestamp
3. Wait until the 15-minute window expires or use a different IP
4. Try again - should be allowed (status 401, not 429)

#### Test 5: Other Endpoints Not Rate Limited

```bash
# These should never be rate limited, even if called repeatedly
curl http://localhost:3001/health
curl http://localhost:3001/tasks
curl -X POST http://localhost:3001/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Test"}'
```

Expected: All requests succeed regardless of frequency

## Configuration

### Adjusting Rate Limits

To change the rate limiting parameters, edit `src/api/utils/loginLimiter.js`:

```javascript
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // Change time window here (in milliseconds)
  max: 10,                    // Change max attempts here
  // ... rest of config
});
```

**Examples**:
- 5 attempts per 10 minutes: `windowMs: 10 * 60 * 1000, max: 5`
- 20 attempts per 30 minutes: `windowMs: 30 * 60 * 1000, max: 20`
- 3 attempts per 5 minutes: `windowMs: 5 * 60 * 1000, max: 3`

### Store Configuration

The current implementation uses the default in-memory store, which is suitable for:
- **Single-server deployments**
- **Development environments**
- **Testing**

For **multi-server deployments**, you should use a distributed store:

```javascript
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

const client = redis.createClient();

const loginLimiter = rateLimit({
  store: new RedisStore({
    client: client,
    prefix: 'rl:login:',
  }),
  // ... other options
});
```

Supported stores:
- **redis** (recommended for production)
- **memcached**
- **mongodb**
- **dynamodb**
- Custom implementations

## Security Considerations

### Current Implementation

✅ **Implemented**:
- Per-IP rate limiting
- Specific to login endpoint
- Standard HTTP status codes
- Clear error messages
- Automatic header injection

⚠️ **To Consider**:
- Distributed store (for load-balanced deployments)
- IP spoofing mitigation (use proxy headers if behind reverse proxy)
- Logging of failed attempts
- Account lockout integration
- Suspicious activity alerting

### Future Enhancements

1. **Progressive Delays**: Increase delay after each failed attempt
2. **CAPTCHA Integration**: Require CAPTCHA after 5 failed attempts
3. **Account Lockout**: Lock account after 20 failed attempts in an hour
4. **Email Alerts**: Notify user of suspicious login activity
5. **IP Whitelist/Blacklist**: Allow exceptions for trusted IPs
6. **Geolocation Checks**: Alert on logins from unusual locations
7. **Redis Store**: Use distributed cache for multi-instance deployments
8. **Metrics**: Track and monitor rate limit violations

## Deployment Notes

### Docker Deployment

When deploying with Docker Compose, the rate limiter works across all container instances within the same service:

```yaml
api:
  build: ./src/api
  environment:
    - PORT=3001
  # Rate limiter uses in-memory store (container-local)
```

For multiple API instances, use an external store (Redis).

### Cloud Deployment (GCP Cloud Run)

Cloud Run creates new instances dynamically. To maintain rate limiting across instances:

1. Enable Cloud Memorystore (Redis) integration
2. Update `loginLimiter.js` to use Redis store
3. Share the Redis instance URL via environment variable

```javascript
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const client = redis.createClient({ url: redisUrl });

const loginLimiter = rateLimit({
  store: new RedisStore({
    client: client,
    prefix: 'rl:login:',
  }),
  // ... other options
});
```

## Troubleshooting

### Issue: Rate Limit Not Working

**Symptoms**: Can make unlimited login attempts

**Causes**:
1. Rate limiter middleware not applied to app
2. Endpoint path doesn't match `/auth/login`
3. Rate limiter store not initialized

**Solution**:
```javascript
// Ensure this line is in index.js BEFORE route handlers
app.use(loginLimiter);
```

### Issue: All Requests Rate Limited

**Symptoms**: Getting 429 errors on non-login endpoints

**Cause**: `skip` function not configured correctly

**Solution**: Verify the skip function in `loginLimiter.js`:
```javascript
skip: (req) => {
  return req.path !== '/auth/login';  // Skip (don't rate limit) if NOT login
}
```

### Issue: Rate Limit Not Resetting

**Symptoms**: Still getting 429 after 15 minutes

**Cause**: May need to restart the server or Redis connection

**Solution**:
1. Verify windowMs is 15 minutes: `15 * 60 * 1000 = 900000`
2. Check server time is correct
3. Restart the API service

### Issue: Different IPs Not Tracked Separately

**Symptoms**: Rate limit affects all users, not per-IP

**Cause**: Proxy headers not being read correctly

**Solution**: If behind a proxy, configure Express trust proxy:
```javascript
app.set('trust proxy', 1); // Trust first proxy
```

## API Reference

### Endpoint

**URL**: `POST /auth/login`

**Rate Limit**: 10 requests per 15 minutes per IP

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response Headers**:
```
RateLimit-Limit: 10
RateLimit-Remaining: 5
RateLimit-Reset: 1723661700
```

**Status Codes**:
- `400 Bad Request` - Missing or invalid email/password
- `401 Unauthorized` - Invalid credentials
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

## Files Changed

### Modified
- `src/api/package.json` - Added `express-rate-limit` dependency

### Created
- `src/api/utils/loginLimiter.js` - Rate limiter middleware
- `src/api/utils/loginLimiter.test.js` - Rate limiter tests

### Updated
- `src/api/index.js` - Added rate limiting middleware and login endpoint

## Testing Results

✅ All 17 tests passing:
- 8 formatBytes tests (existing)
- 7 login rate limiter tests (new)
- 2 test suites

Run tests with:
```bash
cd src/api
npm test
```

## References

- [express-rate-limit documentation](https://github.com/nfriedly/express-rate-limit)
- [OWASP - Brute Force Prevention](https://owasp.org/www-community/attacks/Brute_force_attack)
- [MDN - HTTP 429](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429)
