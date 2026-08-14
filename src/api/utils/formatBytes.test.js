const assert = require('assert');
const test = require('node:test');
const formatBytes = require('./formatBytes');

test('formatBytes - converts bytes correctly', async (t) => {
  await t.test('formats small byte values as bytes', () => {
    assert.strictEqual(formatBytes(512), '512.0 B');
    assert.strictEqual(formatBytes(1023), '1023.0 B');
  });

  await t.test('formats kilobytes correctly', () => {
    assert.strictEqual(formatBytes(1024), '1.0 KB');
    assert.strictEqual(formatBytes(2048), '2.0 KB');
    assert.strictEqual(formatBytes(1536), '1.5 KB');
  });

  await t.test('formats megabytes correctly', () => {
    assert.strictEqual(formatBytes(1048576), '1.0 MB');
    assert.strictEqual(formatBytes(5242880), '5.0 MB');
    assert.strictEqual(formatBytes(1572864), '1.5 MB');
  });

  await t.test('formats gigabytes correctly', () => {
    assert.strictEqual(formatBytes(1073741824), '1.0 GB');
    assert.strictEqual(formatBytes(2147483648), '2.0 GB');
  });

  await t.test('formats terabytes correctly', () => {
    assert.strictEqual(formatBytes(1099511627776), '1.0 TB');
  });

  await t.test('supports custom decimal places', () => {
    assert.strictEqual(formatBytes(1024, 2), '1.00 KB');
    assert.strictEqual(formatBytes(1536, 2), '1.50 KB');
    assert.strictEqual(formatBytes(1536, 0), '2 KB');
  });

  await t.test('handles zero bytes', () => {
    assert.strictEqual(formatBytes(0), '0.0 B');
  });

  await t.test('throws error for invalid input', () => {
    assert.throws(() => formatBytes(-1), { message: 'bytes must be a non-negative number' });
    assert.throws(() => formatBytes(NaN), { message: 'bytes must be a non-negative number' });
    assert.throws(() => formatBytes(Infinity), { message: 'bytes must be a non-negative number' });
  });
});
