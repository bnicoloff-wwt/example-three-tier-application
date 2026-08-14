const test = require('node:test');
const assert = require('node:assert');
const { hashPassword, comparePassword } = require('./auth.js');

test('hashPassword creates a valid bcrypt hash', async () => {
  const password = 'testPassword123!';
  const hash = await hashPassword(password);
  
  assert.ok(hash, 'Hash should not be empty');
  assert.strictEqual(typeof hash, 'string', 'Hash should be a string');
  assert.ok(hash.length > 20, 'Bcrypt hash should be reasonably long');
});

test('comparePassword validates correct password', async () => {
  const password = 'testPassword123!';
  const hash = await hashPassword(password);
  const isMatch = await comparePassword(password, hash);
  
  assert.strictEqual(isMatch, true, 'Correct password should match hash');
});

test('comparePassword rejects incorrect password', async () => {
  const password = 'testPassword123!';
  const wrongPassword = 'wrongPassword456!';
  const hash = await hashPassword(password);
  const isMatch = await comparePassword(wrongPassword, hash);
  
  assert.strictEqual(isMatch, false, 'Incorrect password should not match hash');
});

test('comparePassword handles empty strings', async () => {
  const password = 'testPassword123!';
  const hash = await hashPassword(password);
  const isMatch = await comparePassword('', hash);
  
  assert.strictEqual(isMatch, false, 'Empty password should not match hash');
});
