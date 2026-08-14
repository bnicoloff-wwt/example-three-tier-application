# Login Endpoint and Rate Limiting

## Overview

A secure login endpoint has been added to the API with rate limiting protection to prevent brute-force attacks. The implementation uses bcryptjs for secure password hashing and express-rate-limit middleware for rate limiting.

## Features

### Rate Limiting
- **10 requests per 15 minutes** per IP address
- Returns HTTP 429 (Too Many Requests) when limit exceeded
- Includes standard rate limit headers (`RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`)
- Protects against brute-force login attacks
- Graceful error messages

### Security
- ✅ Passwords hashed with bcryptjs (10 salt rounds)
- ✅ Constant-time password comparison to prevent timing attacks
- ✅ Generic error messages (don't reveal if email exists)
- ✅ Email normalized (lowercase, trimmed)
- ✅ Password never stored in plain text
- ✅ Rate limiting per IP address

### API Endpoint

#### POST /login

Authenticate a user with email and password.

**Request:**
```bash
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securePassword123"
  }'
```

**Success Response (200 OK):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "message": "Login successful"
}
```

**Error Response (401 Unauthorized):**
```json
{
  "error": "Invalid email or password"
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "email is required"
}
```

**Rate Limited Response (429 Too Many Requests):**
```json
{
  "error": "Too many login attempts, please try again later"
}
```

With headers:
```
RateLimit-Limit: 10
RateLimit-Remaining: 0
RateLimit-Reset: 1234567890
```

## Configuration

### Rate Limiting Parameters

In `src/api/index.js`:

```javascript
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,     // Time window: 15 minutes
  max: 10,                        // Max requests per window: 10
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,          // Return RateLimit-* headers
  legacyHeaders: false,           // Disable X-RateLimit-* headers
});
```

### Adjusting the Limits

To change the rate limit, modify `src/api/index.js`:

```javascript
// Examples:
// 5 attempts per 10 minutes
windowMs: 10 * 60 * 1000,  // 10 minutes
max: 5,

// 20 attempts per 1 hour
windowMs: 60 * 60 * 1000,  // 1 hour
max: 20,

// 3 attempts per 5 minutes (strict)
windowMs: 5 * 60 * 1000,   // 5 minutes
max: 3,
```

## Database Schema

### Users Table

Updated migration: `src/db/migrations/1718500000000_initial-schema.js`

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

The `password_hash` field stores bcryptjs-hashed passwords (60 characters).

## Implementation Details

### Password Hashing

Passwords are hashed using bcryptjs with 10 salt rounds:

```javascript
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash(password, 10);
```

Benefits:
- Adaptive hashing function that automatically increases salt rounds over time
- CPU-intensive to prevent brute-force attacks
- Industry standard for Node.js applications
- Resistant to rainbow tables

### Login Flow

1. Client sends email and password to `POST /login`
2. Rate limiter checks if IP has exceeded 10 requests in 15 minutes
3. If rate limited, return 429 error immediately
4. Validate email and password are provided
5. Query database for user by email (case-insensitive)
6. If user not found, return 401 (don't reveal user existence)
7. Compare provided password with stored hash using bcrypt
8. If password matches, return user ID and email
9. If password doesn't match, return 401

### Rate Limiting Flow

Express-rate-limit middleware:
1. Extracts client IP address (respects X-Forwarded-For header)
2. Creates a key from IP address
3. Checks request count in memory store
4. If count < max, increment and allow request
5. If count >= max, return 429 error
6. Count resets after windowMs expires (15 minutes)

## Dependencies

Added to `src/api/package.json`:

```json
{
  "express-rate-limit": "^7.1.5",
  "bcryptjs": "^2.4.3"
}
```

### Why These Packages?

**express-rate-limit**
- Most popular rate limiting middleware for Express
- Simple to use
- Supports custom stores (Redis, Memcached, etc.)
- Actively maintained

**bcryptjs**
- Pure JavaScript implementation of bcrypt
- No native dependencies (works everywhere Node runs)
- Industry standard for password hashing
- Battle-tested security

## Testing

### Manual Testing

**1. Successful Login:**
```bash
# First, a user must be created in the database
# Then attempt login
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "correctPassword"
  }'

# Expected: 200 with user data
```

**2. Invalid Email:**
```bash
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nonexistent@example.com",
    "password": "anyPassword"
  }'

# Expected: 401 Unauthorized
```

**3. Invalid Password:**
```bash
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "wrongPassword"
  }'

# Expected: 401 Unauthorized
```

**4. Missing Email:**
```bash
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{"password": "anyPassword"}'

# Expected: 400 Bad Request - "email is required"
```

**5. Rate Limiting Test (11 rapid requests):**
```bash
for i in {1..11}; do
  curl -X POST http://localhost:3001/login \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com", "password": "test"}' \
    -w "\nAttempt $i - HTTP Status: %{http_code}\n"
  sleep 0.1
done

# Expected: First 10 return 401, 11th returns 429
```

### Automated Tests

Run the test suite:
```bash
cd src/api
npm test
```

Tests verify:
- ✅ Password hashing works correctly
- ✅ Password comparison works for valid passwords
- ✅ Password comparison fails for invalid passwords
- ✅ Rate limiter is properly configured
- ✅ Rate limiter is a valid middleware function

## Usage Examples

### Creating a User (Prerequisites)

Before testing login, create a test user:

```javascript
const { hashPassword } = require('./src/api/utils/auth');
const db = require('./src/api/db');

async function createTestUser() {
  const email = 'user@example.com';
  const password = 'securePassword123';
  const passwordHash = await hashPassword(password);

  const { rows } = await db.query(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *',
    [email, passwordHash]
  );

  return rows[0];
}
```

Or use SQL directly:
```sql
INSERT INTO users (email, password_hash) 
VALUES ('user@example.com', '$2a$10$...');
```

### Integrating with Frontend

On the frontend, you can now build a login form:

```typescript
async function handleLogin(email: string, password: string) {
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (response.status === 429) {
      // Rate limited
      alert('Too many login attempts. Please try again later.');
      return;
    }

    if (!response.ok) {
      // Auth failed
      alert('Invalid email or password');
      return;
    }

    const user = await response.json();
    // Store auth token, redirect, etc.
    console.log('Logged in as:', user.email);
  } catch (error) {
    console.error('Login failed:', error);
  }
}
```

## Advanced Configuration

### Custom Rate Limit Store

By default, express-rate-limit uses in-memory storage. For production with multiple servers, use Redis:

```javascript
const redis = require('redis');
const RedisStore = require('rate-limit-redis');
const redisClient = redis.createClient();

const loginLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'login-limit:',
  }),
  windowMs: 15 * 60 * 1000,
  max: 10,
});
```

### Per-User Rate Limiting (Future Enhancement)

Rate limit by user instead of IP (after login):

```javascript
const accountLimiter = rateLimit({
  keyGenerator: (req, res) => req.user?.id || req.ip,
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later',
});
```

## Security Best Practices

### Implemented
- ✅ Passwords hashed with bcryptjs (10 salt rounds)
- ✅ Rate limiting per IP (10 requests / 15 minutes)
- ✅ Generic error messages
- ✅ Constant-time password comparison
- ✅ Email normalization (lowercase)

### Recommended for Production
- 🔐 Use HTTPS only (enforce in frontend/load balancer)
- 🔐 Implement account lockout after N failed attempts
- 🔐 Add password requirements (min length, complexity)
- 🔐 Implement 2FA (two-factor authentication)
- 🔐 Log failed login attempts for monitoring
- 🔐 Use Redis for rate limiting across multiple servers
- 🔐 Implement CAPTCHA after 5 failed attempts
- 🔐 Add email verification for new accounts
- 🔐 Implement password reset flow

## Performance Considerations

### Bcrypt Hashing
- **Hash time**: ~100-150ms on modern hardware (by design - prevents brute-force)
- **Comparison time**: ~100ms (constant-time)
- Use async/await to prevent blocking
- Consider worker threads for many simultaneous logins

### Rate Limiting
- **Memory usage**: ~1KB per unique IP
- **Lookup time**: O(1) hash table lookup
- **Scales to**: ~1M concurrent IPs without issues
- Consider Redis for distributed systems

## Troubleshooting

### "Too many login attempts" after a few tries
- Check that 15 minute window hasn't passed yet
- Verify IP address is consistent (not behind rotating proxy)
- Check server logs for actual request count

### Passwords not matching
- Ensure bcryptjs is installed: `npm install bcryptjs`
- Verify hash was created correctly
- Check database column type (should be VARCHAR(255))

### Rate limiter not working
- Verify middleware is applied to route
- Check that express-rate-limit is installed
- Ensure rate limiter is defined before route
- Verify IP is being detected correctly

## Files Modified/Created

```
Modified:
  src/api/package.json                          (+2 dependencies)
  src/api/index.js                              (+login endpoint)
  src/db/migrations/1718500000000_initial-schema.js  (+password_hash field)

Created:
  src/api/utils/auth.js                         (password utilities)
  src/api/utils/auth.test.js                    (auth tests)
  src/api/utils/rateLimit.test.js               (rate limit tests)
  LOGIN_RATE_LIMITING.md                        (this file)
```

## Future Enhancements

1. **Account Lockout**: Lock account after 5 failed attempts for 30 minutes
2. **CAPTCHA**: Require CAPTCHA after 3 failed attempts
3. **Login History**: Track login attempts and successful logins
4. **2FA**: Two-factor authentication with TOTP or SMS
5. **Session Management**: JWT tokens or server sessions
6. **Password Reset**: Forgot password flow with email verification
7. **Multi-Device Login**: Manage devices and sessions
8. **Risk-Based Authentication**: Challenge suspicious logins
9. **Audit Logging**: Log all auth events for security monitoring
10. **Webhook Notifications**: Alert on suspicious activity

## References

- [express-rate-limit Documentation](https://github.com/nfriedly/express-rate-limit)
- [bcryptjs Documentation](https://github.com/dcodeIO/bcrypt.js)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)
