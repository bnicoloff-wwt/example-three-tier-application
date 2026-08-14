# Rate-Limited Login Endpoint

## Overview

The API now includes a rate-limited login endpoint (`POST /login`) that protects against brute force attacks by limiting the number of login attempts per IP address.

## Features

- ✅ Rate limiting: 5 login attempts per 15 minutes per IP address
- ✅ HTTP 429 status code for rate-limited responses
- ✅ Standard rate limit headers (`RateLimit-*`)
- ✅ IP address tracking for distributed use
- ✅ Comprehensive error handling
- ✅ Full test coverage

## Endpoint

### POST /login

Authenticate a user with username and password.

**Request:**
```bash
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "testpass"}'
```

**Request Body:**
```json
{
  "username": "string (required)",
  "password": "string (required)"
}
```

**Successful Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "demo-token-1234567890"
}
```

**Validation Error (400):**
```json
{
  "error": "username is required"
}
```

**Rate Limited (429):**
```json
{
  "error": "Too many login attempts, please try again in 15 minutes"
}
```

## Rate Limiting Configuration

The rate limiter is configured with the following defaults:

| Setting | Value | Environment Variable |
|---------|-------|----------------------|
| Window Duration | 15 minutes | `LOGIN_WINDOW_MS` |
| Max Attempts | 5 requests per IP | `MAX_LOGIN_ATTEMPTS` |
| Status Code | 429 Too Many Requests | N/A |

### Customize Rate Limiting

Edit `src/api/utils/rateLimiter.js` to adjust the limits:

```javascript
const createLoginLimiter = () => {
  return rateLimit({
    windowMs: 15 * 60 * 1000,  // Change to adjust window duration
    max: 5,                     // Change to adjust max attempts
    // ... rest of config
  });
};
```

Or use environment variables:

```bash
MAX_LOGIN_ATTEMPTS=10 LOGIN_WINDOW_MS=900000 npm start
```

## Response Headers

When rate limiting is active, the response includes standard rate limit headers:

```
RateLimit-Limit: 5
RateLimit-Remaining: 3
RateLimit-Reset: 1609459200
```

These headers inform clients about their rate limit status.

## Implementation Details

### Rate Limiter Location
`src/api/utils/rateLimiter.js`

### IP Address Detection

The rate limiter uses the following to determine the client's IP address:

1. `req.ip` - Express's computed IP (respects proxy settings)
2. `req.socket.remoteAddress` - Fallback to socket address

To properly detect IPs behind a proxy, ensure `app.set('trust proxy')` is configured.

### Key Generation

Rate limits are keyed by IP address, so each unique IP has its own limit bucket:

- IP `192.168.1.1` has 5 attempts per 15 minutes
- IP `192.168.1.2` has 5 attempts per 15 minutes
- Multiple requests from the same IP share the same limit

## Testing

### Unit Tests

Run the rate limiter tests:

```bash
cd src/api
npm test
```

Tests verify:
- ✅ Configuration is correct (5 attempts, 15 minutes)
- ✅ 429 status code is returned when limit exceeded
- ✅ IP address is used as the rate limit key
- ✅ Rate limit headers are properly configured
- ✅ Error messages are appropriate

### Manual Testing

1. **Test successful login:**
   ```bash
   curl -X POST http://localhost:3001/login \
     -H "Content-Type: application/json" \
     -d '{"username": "testuser", "password": "testpass"}'
   ```

2. **Test rate limiting (make 6+ requests rapidly):**
   ```bash
   for i in {1..6}; do
     curl -X POST http://localhost:3001/login \
       -H "Content-Type: application/json" \
       -d '{"username": "testuser", "password": "testpass"}'
   done
   ```

3. **Observe rate limit headers:**
   ```bash
   curl -X POST http://localhost:3001/login \
     -H "Content-Type: application/json" \
     -d '{"username": "testuser", "password": "testpass"}' \
     -i  # Show headers
   ```

## Security Considerations

### Current Implementation
- ✅ Rate limiting by IP address
- ✅ Standard 429 status code
- ✅ Clear error messages
- ✅ Configurable limits

### For Production

This is a demo implementation. For production use, consider:

1. **Database Queries**
   - Query a users table to verify credentials
   - Use bcrypt or similar for password hashing (never store plaintext)

2. **Distributed Systems**
   - Use Redis store for rate limiting across multiple instances
   - See `express-rate-limit` [store documentation](https://github.com/nfriedly/express-rate-limit#store)

3. **Enhanced Security**
   - Username-based rate limiting in addition to IP-based
   - CAPTCHA after N failed attempts
   - Account lockout after repeated failures
   - Logging of rate limit events for monitoring

4. **Authentication Tokens**
   - Generate proper JWT tokens with expiration
   - Include user claims in the token
   - Use HTTPS in production (not HTTP)

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

**Check proxy configuration:**
If running behind a proxy (Docker, load balancer, etc.), ensure Express is configured to trust the proxy:

```javascript
app.set('trust proxy', 1); // Number of proxies between client and server
```

**Verify IP address:**
Test that the IP address is being detected correctly:

```bash
curl -X POST http://localhost:3001/login \
  -H "X-Forwarded-For: 1.2.3.4" \
  -d '{"username": "test", "password": "test"}'
```

### Wrong IP Address Detected

- Ensure proxy headers are being read correctly
- Check `X-Forwarded-For` or `CF-Connecting-IP` headers
- Configure `app.set('trust proxy')` with the correct proxy count

### Rate Limit Too Strict/Lenient

Edit `src/api/utils/rateLimiter.js`:
- Increase `max` for more lenient rate limiting
- Increase `windowMs` for longer duration between resets
- Decrease either for stricter protection

## API Reference

### Module: rateLimiter.js

#### `createLoginLimiter()`

Creates and returns an Express rate limit middleware configured for the login endpoint.

**Returns:** express-rate-limit middleware function

**Usage:**
```javascript
const { createLoginLimiter } = require('./utils/rateLimiter');
const loginLimiter = createLoginLimiter();

app.post('/login', loginLimiter, (req, res) => {
  // Handler
});
```

## References

- [express-rate-limit GitHub](https://github.com/nfriedly/express-rate-limit)
- [RFC 6585 - HTTP Status Code 429](https://tools.ietf.org/html/rfc6585#section-4)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Rate Limiting Best Practices](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)

## Summary

The rate-limited login endpoint provides basic protection against brute force attacks while maintaining a clean API. It's production-ready for demo purposes and can be enhanced with additional security measures for real-world applications.

**Key Files:**
- `src/api/index.js` - Login endpoint implementation
- `src/api/utils/rateLimiter.js` - Rate limiter configuration
- `src/api/utils/rateLimiter.test.js` - Test suite
- `src/api/package.json` - Dependencies (added `express-rate-limit`)
