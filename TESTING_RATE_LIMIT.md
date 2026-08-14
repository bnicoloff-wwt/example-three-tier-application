# Rate Limiting Testing Guide

## Overview

This guide provides step-by-step instructions for testing the rate-limited login endpoint implementation. It covers manual testing, API testing, and verification of the rate limiting behavior.

## Quick Start Tests

### 1. Test Missing Email Field

```bash
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{"password": "test123"}'
```

**Expected Result:**
- Status: 400 Bad Request
- Response: `{"error": "email is required"}`

### 2. Test Missing Password Field

```bash
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

**Expected Result:**
- Status: 400 Bad Request
- Response: `{"error": "password is required"}`

### 3. Test Invalid Email (User Not Found)

```bash
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{"email": "nonexistent@example.com", "password": "test123"}'
```

**Expected Result:**
- Status: 401 Unauthorized
- Response: `{"error": "Invalid email or password"}`

## Rate Limiting Tests

### Test 1: Verify Rate Limit Headers

Make a single login request and check response headers:

```bash
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "wrong"}' \
  -i
```

**Expected Headers:**
```
RateLimit-Limit: 10
RateLimit-Remaining: 9
RateLimit-Reset: 1234567890
```

These headers indicate:
- **RateLimit-Limit**: 10 requests allowed per window
- **RateLimit-Remaining**: 9 requests remaining (10 - 1 current)
- **RateLimit-Reset**: Unix timestamp when counter resets

### Test 2: Rapid Requests (Exceeding Limit)

Send 12 rapid requests to trigger rate limiting:

```bash
for i in {1..12}; do
  echo "=== Request $i ==="
  curl -s -X POST http://localhost:3001/login \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com", "password": "wrong"}' \
    -w "HTTP Status: %{http_code}\n" | jq .
  sleep 0.1
done
```

**Expected Results:**
- Requests 1-10: 401 Unauthorized (invalid credentials)
  - `RateLimit-Remaining` decreases from 9 to 0
- Requests 11-12: 429 Too Many Requests
  - Response: `{"error": "Too many login attempts, please try again later"}`

### Test 3: Rate Limit Recovery

After rate limiting kicks in, wait 15 minutes and try again:

```bash
# Make 11 requests to trigger rate limit
for i in {1..11}; do
  curl -s -X POST http://localhost:3001/login \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com", "password": "wrong"}' > /dev/null
done

# 11th request should be rate limited (429)
curl -s -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "wrong"}' | jq .

# Wait 15 minutes
sleep 900

# Should work again
curl -s -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "wrong"}' | jq .
```

**Expected Results:**
- Before waiting: 429 Too Many Requests
- After waiting 15 minutes: 401 Unauthorized (limit reset, request processed)

### Test 4: Counting Down Remaining Requests

Track how `RateLimit-Remaining` decreases:

```bash
for i in {1..11}; do
  remaining=$(curl -s -X POST http://localhost:3001/login \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com", "password": "wrong"}' \
    -w '\nHTTP %{http_code}\n' \
    -H 'Content-Type: application/json' -D /dev/stdout 2>&1 | \
    grep -i "ratelimit-remaining" | cut -d' ' -f2 | tr -d '[:space:]')
  
  echo "Request $i - Remaining: $remaining"
done
```

**Expected Output:**
```
Request 1 - Remaining: 9
Request 2 - Remaining: 8
Request 3 - Remaining: 7
Request 4 - Remaining: 6
Request 5 - Remaining: 5
Request 6 - Remaining: 4
Request 7 - Remaining: 3
Request 8 - Remaining: 2
Request 9 - Remaining: 1
Request 10 - Remaining: 0
Request 11 - HTTP 429
```

## Password Hashing Tests

### Test 1: Verify Password Hashing Works

Create a test script `test-password-hash.js`:

```javascript
const { hashPassword, comparePassword } = require('./src/api/utils/auth');

async function test() {
  const password = 'testPassword123!';
  
  console.log('Testing password hashing...');
  
  // Hash the password
  const hash = await hashPassword(password);
  console.log('✓ Password hashed:', hash.substring(0, 20) + '...');
  
  // Test correct password
  const correctMatch = await comparePassword(password, hash);
  console.log('✓ Correct password matches:', correctMatch);
  
  // Test wrong password
  const wrongMatch = await comparePassword('wrongPassword', hash);
  console.log('✓ Wrong password matches:', wrongMatch);
  
  if (correctMatch && !wrongMatch) {
    console.log('\n✅ All password hashing tests passed!');
  } else {
    console.log('\n❌ Password hashing tests failed!');
  }
}

test();
```

Run it:
```bash
cd src/api
node ../../test-password-hash.js
```

**Expected Output:**
```
Testing password hashing...
✓ Password hashed: $2a$10$abcdefghij...
✓ Correct password matches: true
✓ Wrong password matches: false

✅ All password hashing tests passed!
```

## Integration Tests

### Test 1: Create User and Login

```bash
# First, check if users table exists (requires database setup)
# Then, create a user with a hashed password:

# In PostgreSQL:
# INSERT INTO users (email, password_hash) 
# VALUES ('test@example.com', '$2a$10$...');
```

Or programmatically:

```javascript
const { hashPassword } = require('./src/api/utils/auth');
const db = require('./src/api/db');

async function createUserAndLogin() {
  const email = 'test@example.com';
  const password = 'securePassword123';
  
  // Hash password
  const passwordHash = await hashPassword(password);
  
  // Create user
  try {
    const { rows } = await db.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email, passwordHash]
    );
    console.log('User created:', rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      console.log('User already exists');
    } else {
      throw err;
    }
  }
  
  // Test login
  const loginRes = await fetch('http://localhost:3001/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const result = await loginRes.json();
  console.log('Login result:', result);
  console.log('Status:', loginRes.status);
}

createUserAndLogin();
```

**Expected Results:**
- User is created in database
- Login with correct credentials returns 200 with user ID and email
- Login with wrong password returns 401

## Advanced Testing Scenarios

### Scenario 1: Multiple Clients from Different IPs

Test that rate limiting is per-IP by simulating requests from different client IPs:

```bash
# Client 1 - 10 requests
for i in {1..10}; do
  curl -X POST http://localhost:3001/login \
    -H "Content-Type: application/json" \
    -H "X-Forwarded-For: 192.168.1.1" \
    -d '{"email": "test@example.com", "password": "wrong"}'
done

# Client 2 - should have fresh limit
for i in {1..10}; do
  curl -X POST http://localhost:3001/login \
    -H "Content-Type: application/json" \
    -H "X-Forwarded-For: 192.168.1.2" \
    -d '{"email": "test@example.com", "password": "wrong"}'
done

# Client 1 - 11th request should be rate limited
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -H "X-Forwarded-For: 192.168.1.1" \
  -d '{"email": "test@example.com", "password": "wrong"}'
# Expected: 429

# Client 2 - 11th request should be rate limited
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -H "X-Forwarded-For: 192.168.1.2" \
  -d '{"email": "test@example.com", "password": "wrong"}'
# Expected: 429
```

### Scenario 2: Burst Requests

Send all 10 requests in quick succession, then observe recovery:

```bash
# Burst: Send 12 requests as fast as possible
time for i in {1..12}; do
  curl -s -X POST http://localhost:3001/login \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com", "password": "wrong"}' > /dev/null &
done
wait

# All background processes complete
# The 11th and 12th should return 429
```

### Scenario 3: Monitoring Rate Limit Reset

Track when the rate limit resets:

```bash
# Make 10 requests to hit the limit
for i in {1..10}; do
  curl -s -X POST http://localhost:3001/login \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com", "password": "wrong"}' > /dev/null
done

# Get reset time
reset_time=$(curl -s -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "wrong"}' \
  -D /dev/stdout 2>&1 | \
  grep -i "ratelimit-reset" | cut -d' ' -f2 | tr -d '[:space:]')

echo "Rate limit resets at Unix timestamp: $reset_time"

# Convert to human-readable
date -d @$reset_time 2>/dev/null || echo "Use 'date -d @$reset_time' to convert"
```

## Security Tests

### Test 1: Generic Error Messages

Verify that both wrong email and wrong password return the same error:

```bash
# Wrong email
curl -s -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{"email": "nonexistent@example.com", "password": "anything"}'

# Output should be: {"error": "Invalid email or password"}

# Wrong password (for existing user)
curl -s -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "wrongpass"}'

# Output should also be: {"error": "Invalid email or password"}
```

**Expected Result:**
Both return the same error message, preventing user enumeration attacks.

### Test 2: Case-Insensitive Email

Verify email normalization:

```bash
# Create user with lowercase email
# Then try logging in with mixed case

curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{"email": "Test@Example.COM", "password": "password"}'

# Should work if email normalization is working
```

### Test 3: Whitespace Trimming

Test that whitespace in email is trimmed:

```bash
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{"email": "  test@example.com  ", "password": "password"}'

# Should work if trimming is implemented
```

## Performance Tests

### Test 1: Login Response Time

Measure response time for successful login:

```bash
time curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "correctpassword"}'
```

**Expected Result:**
- Real time: ~150-250ms (includes bcrypt hash comparison)
- This is expected; bcrypt is deliberately slow for security

### Test 2: Failed Login Response Time

Failed login attempts should take similar time (constant-time comparison):

```bash
time curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "wrongpassword"}'
```

**Expected Result:**
- Response time should be similar to successful login (~150-250ms)
- This prevents timing attacks

## Debugging

### Enable Detailed Logging

To debug rate limiting, add logging to the API:

```javascript
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req, res) => {
    console.log(`[Rate Limit] IP: ${req.ip}, Path: ${req.path}, Remaining: ${res.get('RateLimit-Remaining')}`);
    return false; // Don't skip, process normally
  }
});
```

### Check Node Logs

When running the API, watch for console output:

```bash
npm start 2>&1 | grep -i "rate\|login"
```

### Verify Database Connection

Ensure users table exists and has correct schema:

```bash
# Connect to PostgreSQL
psql -h localhost -U postgres -d example_three_tier

# Check users table
\d users

# Should show:
# Column        | Type                  | Modifiers
# id            | integer               | not null default nextval('users_id_seq')
# email         | character varying(255)| not null unique
# password_hash | character varying(255)| not null
# created_at    | timestamp             | not null default now()
```

## Test Summary Checklist

- [ ] Missing email returns 400 error
- [ ] Missing password returns 400 error
- [ ] Invalid email returns 401 error
- [ ] Invalid password returns 401 error
- [ ] First request has RateLimit-Remaining: 9
- [ ] 10th request has RateLimit-Remaining: 0
- [ ] 11th request returns 429 error
- [ ] 12th request returns 429 error
- [ ] After 15 minutes, requests work again
- [ ] Different IPs have separate rate limits
- [ ] Password hashing works correctly
- [ ] Successful login returns user data
- [ ] Failed login returns generic error
- [ ] Email is case-insensitive
- [ ] Email whitespace is trimmed

## Common Issues and Solutions

### Issue: Rate limit not working
**Solution:**
- Verify express-rate-limit is installed: `npm list express-rate-limit`
- Check middleware order in index.js (must be before route)
- Verify IP detection is correct (check X-Forwarded-For if behind proxy)

### Issue: Password comparison fails
**Solution:**
- Verify bcryptjs is installed: `npm list bcryptjs`
- Ensure hash is from bcryptjs, not plain text
- Check hash column length is at least 255 characters

### Issue: Database connection errors
**Solution:**
- Verify DATABASE_URL env var is set
- Test connection: `psql $DATABASE_URL`
- Check users table exists: `\d users`

### Issue: Rate limit resets immediately
**Solution:**
- Check that store is being used (default is memory)
- Verify windowMs is set correctly (15 * 60 * 1000 = 15 minutes)
- Use Redis store for distributed systems

## Next Steps

After testing:
1. [ ] Document any issues found
2. [ ] Review rate limit configuration for your use case
3. [ ] Consider implementing account lockout after N failures
4. [ ] Plan for production deployment (Redis store, HTTPS)
5. [ ] Set up monitoring and alerting for rate limit events
