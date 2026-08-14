# Rate Limiting for Login Endpoint

## Overview

The login endpoint (`POST /login`) is now protected with rate limiting to prevent brute-force attacks and credential stuffing attempts.

## Rate Limit Configuration

- **Endpoint**: `POST /login`
- **Limit**: 5 login attempts per IP address
- **Window**: 15 minutes
- **Status Code**: 429 (Too Many Requests)
- **Response Message**: "Too many login attempts, please try again later"

## Implementation Details

### Middleware Location
- **File**: `src/api/middleware/loginRateLimiter.js`
- **Library**: [express-rate-limit](https://www.npmjs.com/package/express-rate-limit)

### How It Works

1. **IP-Based Tracking**: The middleware tracks requests by IP address
2. **Request Counting**: Each login attempt is counted within a 15-minute window
3. **Rate Limit Response**: Once 5 attempts are exceeded, subsequent requests receive a 429 status code
4. **Standard Headers**: The response includes standard rate limit headers:
   - `RateLimit-Limit`: Maximum requests allowed (5)
   - `RateLimit-Remaining`: Requests remaining in the current window
   - `RateLimit-Reset`: Unix timestamp when the rate limit window resets

## Usage

### Normal Login Request
```bash
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "password123"}'
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "testuser"
  },
  "token": "mock-jwt-token-1234567890"
}
```

### Rate Limited Response
After 5 failed login attempts from the same IP within 15 minutes:

**Error Response** (429 Too Many Requests):
```json
{
  "message": "Too many login attempts, please try again later"
}
```

**Response Headers**:
```
RateLimit-Limit: 5
RateLimit-Remaining: 0
RateLimit-Reset: 1234567890
```

## Client-Side Handling

Clients should:
1. Check for 429 status codes
2. Read the `RateLimit-Reset` header to know when to retry
3. Implement exponential backoff for retry logic
4. Display user-friendly error messages

### Example Implementation (JavaScript)
```javascript
async function login(username, password) {
  try {
    const response = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (response.status === 429) {
      const resetTime = parseInt(response.headers.get('RateLimit-Reset')) * 1000;
      const waitSeconds = Math.ceil((resetTime - Date.now()) / 1000);
      throw new Error(`Too many login attempts. Try again in ${waitSeconds} seconds.`);
    }

    if (!response.ok) {
      throw new Error('Login failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Login error:', error.message);
    throw error;
  }
}
```

## Testing

### Run Tests
```bash
npm test
```

### Test Coverage
Rate limiter tests are located in `src/api/middleware/loginRateLimiter.test.js` and verify:
- Middleware is properly configured
- Rate limit threshold is set to 5 requests
- Window duration is 15 minutes
- Health check endpoint is skipped
- Standard rate limit headers are returned

## Security Considerations

1. **Distributed Attacks**: This middleware only tracks by IP. For distributed attacks, consider:
   - Using X-Forwarded-For headers (behind proxy)
   - Implementing account-level rate limiting (failed attempts per username)
   - Adding CAPTCHA verification

2. **Redis Store**: For multi-instance deployments, use a Redis store instead of the default in-memory store:
   ```javascript
   const RedisStore = require('rate-limit-redis');
   const redis = require('redis');

   const client = redis.createClient();
   const limiter = rateLimit({
     store: new RedisStore({
       client: client,
       prefix: 'login-rate-limit:',
     }),
     // ... rest of config
   });
   ```

3. **Monitoring**: Log rate limit events for security monitoring:
   ```javascript
   app.use((err, req, res, next) => {
     if (err.status === 429) {
       console.warn(`Rate limit exceeded for IP: ${req.ip}`);
     }
     next(err);
   });
   ```

## Future Enhancements

1. **Account-Level Rate Limiting**: Limit failed attempts per username
2. **Progressive Delays**: Increase delay after each failed attempt
3. **CAPTCHA Integration**: Require CAPTCHA after N failed attempts
4. **Distributed Rate Limiting**: Use Redis for multi-instance deployments
5. **Metrics & Alerts**: Monitor rate limit violations and alert on suspicious patterns
6. **Whitelisting**: Allow certain IPs to bypass rate limiting (admin panel, testing)

## Configuration Reference

To adjust rate limit settings, edit `src/api/middleware/loginRateLimiter.js`:

```javascript
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // Change window duration (in milliseconds)
  max: 5,                     // Change max requests per window
  message: '...',            // Change error message
  statusCode: 429,           // Change HTTP status code
  standardHeaders: true,     // Include RateLimit-* headers
  legacyHeaders: false,      // Disable X-RateLimit-* headers
});
```

## References

- [express-rate-limit Documentation](https://www.npmjs.com/package/express-rate-limit)
- [OWASP: Brute Force Attack](https://owasp.org/www-community/attacks/Brute_force_attack)
- [RFC 6585: 429 Too Many Requests](https://tools.ietf.org/html/rfc6585)
