# Login Endpoint Rate Limiting

## Overview

The login endpoint (`POST /login`) is now protected with rate-limiting to prevent brute-force attacks and credential stuffing. The rate limiter restricts each IP address to **5 login attempts per 15 minutes**.

## Features

- ✅ **Brute-force protection** - Limits login attempts per IP address
- ✅ **Standard HTTP headers** - Returns `RateLimit-*` headers for client awareness
- ✅ **Clear error messages** - Informs users when rate limit is exceeded
- ✅ **IP-based tracking** - Uses client IP address as the key
- ✅ **Production-ready** - Uses industry-standard `express-rate-limit` library

## Rate Limit Configuration

| Setting | Value | Notes |
|---------|-------|-------|
| **Time Window** | 15 minutes | Rate limit resets every 15 minutes |
| **Max Attempts** | 5 per IP | Each IP can attempt 5 logins per window |
| **HTTP Status** | 429 Too Many Requests | Standard rate limit status code |
| **Response** | JSON error message | Clear feedback for rate-limited requests |

## API Endpoint

### POST /login

Authenticates a user with rate-limiting protection.

**Request:**
```json
{
  "username": "user@example.com",
  "password": "secure_password_123"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "demo-token-1234567890"
}
```

**Rate Limit Exceeded (429 Too Many Requests):**
```json
{
  "error": "Too many login attempts, please try again in 15 minutes"
}
```

**Validation Error (400 Bad Request):**
```json
{
  "error": "username is required"
}
```

Or:
```json
{
  "error": "password is required"
}
```

## HTTP Headers

When rate limiting is active, the following headers are included in responses:

```
RateLimit-Limit: 5
RateLimit-Remaining: 3
RateLimit-Reset: 1234567890
```

- `RateLimit-Limit`: Maximum requests allowed in the window
- `RateLimit-Remaining`: Number of requests remaining in current window
- `RateLimit-Reset`: Unix timestamp when the rate limit resets

## Example Usage

### Successful Login
```bash
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user@example.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "demo-token-1234567890"
}
```

### Rate Limit Exceeded
After 5 failed attempts within 15 minutes:

```bash
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "attacker@example.com",
    "password": "wrong_password"
  }'
```

**Response (429):**
```json
{
  "error": "Too many login attempts, please try again in 15 minutes"
}
```

With headers:
```
HTTP/1.1 429 Too Many Requests
RateLimit-Limit: 5
RateLimit-Remaining: 0
RateLimit-Reset: 1234567890
```

## Security Considerations

### Brute-Force Protection
- Limits to 5 attempts per 15 minutes prevents rapid password guessing
- Attackers must wait 15 minutes between attempt batches

### IP-Based Tracking
- Uses client IP address as the rate limit key
- Behind proxies/load balancers, ensure `trust proxy` is configured
- Can be extended to use username instead for more granular control

### Default Behavior
- Health checks are not rate-limited
- All other requests use the same rate limit

## Implementation Details

### Files Changed
1. **src/api/package.json** - Added `express-rate-limit` dependency
2. **src/api/index.js** - Added login endpoint with rate limiting
3. **src/api/utils/rateLimiter.js** - Created rate limiter factory function
4. **src/api/utils/rateLimiter.test.js** - Created unit tests

### Rate Limiter Configuration (src/api/utils/rateLimiter.js)

```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                     // 5 requests per window
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,      // Return RateLimit-* headers
  legacyHeaders: false,       // Don't use X-RateLimit-* headers
  keyGenerator: (req) => req.ip,  // Use IP address as key
  handler: (req, res) => {    // Custom response on rate limit
    res.status(429).json({
      error: 'Too many login attempts, please try again in 15 minutes'
    });
  }
});
```

## Testing

### Run Tests
```bash
cd src/api
npm test
```

### Test Coverage
The test file (`src/api/utils/rateLimiter.test.js`) includes:
- ✅ Rate limiter creation
- ✅ Configuration validation
- ✅ Max attempts setting (5)
- ✅ Time window setting (15 minutes)
- ✅ IP address key generation
- ✅ HTTP headers configuration
- ✅ Rate limit exceeded handler response (429)

### Manual Testing

#### Test 1: Successful Login
```bash
# First 5 attempts should succeed
for i in {1..5}; do
  curl -X POST http://localhost:3001/login \
    -H "Content-Type: application/json" \
    -d '{"username":"user","password":"pass"}' \
    -w "HTTP Status: %{http_code}\n"
  sleep 1
done
```

#### Test 2: Rate Limit Exceeded
```bash
# 6th attempt should be rate limited
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"pass"}' \
  -w "HTTP Status: %{http_code}\n"
# Expected: 429 Too Many Requests
```

#### Test 3: Different IP Address
```bash
# From different IP, should allow 5 new attempts
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -H "X-Forwarded-For: 192.168.1.100" \
  -d '{"username":"user","password":"pass"}' \
  -w "HTTP Status: %{http_code}\n"
# Expected: 200 OK
```

#### Test 4: Rate Limit Headers
```bash
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"pass"}' \
  -v
# Check response headers:
# RateLimit-Limit: 5
# RateLimit-Remaining: 4
# RateLimit-Reset: 1234567890
```

## Production Deployment

### Proxy Configuration
If deploying behind a proxy or load balancer, configure Express to trust the proxy:

```javascript
app.set('trust proxy', 1); // Trust 1 proxy (most common setup)
```

This ensures the correct IP address is used for rate limiting.

### Store Configuration
For distributed deployments (multiple server instances), use a persistent store like Redis:

```javascript
const RedisStore = require('rate-limit-redis');
const redis = require('redis');
const client = redis.createClient();

const limiter = rateLimit({
  store: new RedisStore({
    client: client,
    prefix: 'rate-limit:',
  }),
  windowMs: 15 * 60 * 1000,
  max: 5,
});
```

### Environment Variables
Consider making rate limit settings configurable:

```javascript
const MAX_LOGIN_ATTEMPTS = process.env.MAX_LOGIN_ATTEMPTS || 5;
const LOGIN_WINDOW_MS = process.env.LOGIN_WINDOW_MS || 15 * 60 * 1000;

const limiter = rateLimit({
  windowMs: LOGIN_WINDOW_MS,
  max: MAX_LOGIN_ATTEMPTS,
  // ... other config
});
```

## Future Enhancements

1. **Username-based rate limiting** - Rate limit by username instead of/in addition to IP
2. **Redis store** - Use Redis for distributed rate limiting across multiple instances
3. **Gradual backoff** - Increase delay after repeated failures (exponential backoff)
4. **CAPTCHA integration** - Require CAPTCHA after N failed attempts
5. **Account lockout** - Temporarily lock accounts after N failures
6. **Whitelisting** - Allow certain IPs to bypass rate limiting
7. **Logging** - Log rate limit events for security monitoring
8. **Metrics** - Expose rate limit metrics to monitoring systems

## Troubleshooting

### Rate Limit Not Working
- **Check proxy configuration**: Ensure `app.set('trust proxy')` is set if behind a proxy
- **Verify IP address**: The IP address must be consistent across requests
- **Check time sync**: Server time must be synchronized for rate limit window

### Wrong IP Address Detected
- Ensure proxy headers are being read correctly
- Check `X-Forwarded-For` or `CF-Connecting-IP` headers (varies by proxy)
- Configure `app.set('trust proxy')` with the correct number of proxies

### Rate Limit Too Strict/Lenient
Edit `src/api/utils/rateLimiter.js`:
- Increase `max` for more lenient rate limiting
- Increase `windowMs` for longer duration between resets
- Decrease either for stricter protection

## References

- [express-rate-limit](https://github.com/nfriedly/express-rate-limit)
- [RFC 6585 - HTTP Status Code 429](https://tools.ietf.org/html/rfc6585#section-4)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Rate Limiting Best Practices](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)
