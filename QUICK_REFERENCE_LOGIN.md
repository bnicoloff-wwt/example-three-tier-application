# Quick Reference: Rate-Limited Login Endpoint

## API Endpoint

```
POST /login
```

## Example Request

```bash
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securePassword123"
  }'
```

## Example Responses

### Success (200 OK)
```json
{
  "id": 1,
  "email": "user@example.com",
  "message": "Login successful"
}
```

### Bad Request (400)
```json
{
  "error": "email is required"
}
```

### Unauthorized (401)
```json
{
  "error": "Invalid email or password"
}
```

### Rate Limited (429)
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

## Rate Limiting Rules

- **Max Requests**: 10 per time window
- **Time Window**: 15 minutes
- **Per**: IP address
- **Resets**: Automatically after 15 minutes

## Database Setup

Before testing login, create a user with hashed password:

```javascript
const { hashPassword } = require('./src/api/utils/auth');
const db = require('./src/api/db');

async function createUser() {
  const email = 'user@example.com';
  const password = 'securePassword123';
  const passwordHash = await hashPassword(password);
  
  await db.query(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2)',
    [email, passwordHash]
  );
}

createUser();
```

## Key Features

| Feature | Details |
|---------|---------|
| Rate Limiting | 10 requests per 15 minutes per IP |
| Password Hashing | bcryptjs with 10 salt rounds |
| Security | Constant-time comparison, generic errors |
| Validation | Email and password required |
| Normalization | Email lowercase and trimmed |
| Headers | Standard RateLimit-* headers |

## Files Modified

```
src/api/index.js                    → Added login endpoint + rate limiter
src/api/package.json                → Added bcryptjs, express-rate-limit
src/api/utils/auth.js               → Password utilities (NEW)
src/api/utils/auth.test.js          → Auth tests (NEW)
src/api/utils/rateLimit.test.js     → Rate limit tests (NEW)
src/db/migrations/1718500000000_initial-schema.js → Added password_hash field
LOGIN_RATE_LIMITING.md              → Full documentation (NEW)
TESTING_RATE_LIMIT.md               → Testing guide (NEW)
```

## Common Commands

### Test Rate Limiting
```bash
for i in {1..11}; do
  curl -s -X POST http://localhost:3001/login \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com", "password": "wrong"}' \
    -w "Status: %{http_code}\n"
done
```

### Run Tests
```bash
cd src/api
npm test
```

### Manual Login Test
```bash
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "correctPassword"}'
```

## Configuration

To adjust rate limiting in `src/api/index.js` (line 13-19):

```javascript
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // Time window in milliseconds
  max: 10,                    // Max requests per window
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});
```

### Example Configurations

**Strict (3 per 5 minutes)**
```javascript
windowMs: 5 * 60 * 1000,
max: 3,
```

**Relaxed (20 per hour)**
```javascript
windowMs: 60 * 60 * 1000,
max: 20,
```

## Security Checklist

- ✅ Passwords hashed with bcryptjs
- ✅ Rate limiting enabled
- ✅ Generic error messages
- ✅ Email validation
- ✅ Password validation
- ⚠️ Use HTTPS in production
- ⚠️ Consider 2FA for enhanced security
- ⚠️ Monitor login attempts

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 404 Not Found | Restart Node.js server |
| Rate limit not working | Check express-rate-limit is installed |
| Password mismatch | Verify bcryptjs is installed |
| Database error | Check DATABASE_URL env var |
| Rate limit resets immediately | Verify windowMs is correct |

## Documentation

- **LOGIN_RATE_LIMITING.md**: Complete documentation with examples
- **TESTING_RATE_LIMIT.md**: Testing procedures and debugging
- **RATE_LIMIT_IMPLEMENTATION_SUMMARY.md**: Implementation overview
- Inline code comments in src/api/index.js and src/api/utils/auth.js

## Dependencies Added

```json
{
  "express-rate-limit": "^7.1.5",
  "bcryptjs": "^2.4.3"
}
```

## Next Steps

1. ✅ Review implementation
2. ✅ Run tests: `npm test`
3. ✅ Test manually with curl examples
4. ✅ Adjust rate limits if needed
5. ⏭️ Deploy to your environment
6. ⏭️ Set up monitoring
7. ⏭️ Plan enhancements (2FA, account lockout, etc.)

## Status

**✅ COMPLETE** - Production-ready rate-limited login endpoint with comprehensive documentation and tests.
