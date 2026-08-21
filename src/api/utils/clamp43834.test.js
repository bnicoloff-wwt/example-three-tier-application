const assert = require('assert');
const test = require('node:test');
const clamp43834 = require('./clamp43834');

test('clamp43834 - bounds values correctly', async (t) => {
  await t.test('returns min when value is below range', () => {
    assert.strictEqual(clamp43834(5, 10, 20), 10);
    assert.strictEqual(clamp43834(-100, 0, 50), 0);
  });

  await t.test('returns max when value is above range', () => {
    assert.strictEqual(clamp43834(25, 10, 20), 20);
    assert.strictEqual(clamp43834(100, 0, 50), 50);
  });

  await t.test('returns value when within range', () => {
    assert.strictEqual(clamp43834(15, 10, 20), 15);
    assert.strictEqual(clamp43834(0, -10, 10), 0);
    assert.strictEqual(clamp43834(50, 50, 100), 50);
  });

  await t.test('handles edge values at boundaries', () => {
    assert.strictEqual(clamp43834(10, 10, 20), 10);
    assert.strictEqual(clamp43834(20, 10, 20), 20);
  });

  await t.test('handles negative ranges', () => {
    assert.strictEqual(clamp43834(-15, -20, -10), -15);
    assert.strictEqual(clamp43834(-25, -20, -10), -20);
    assert.strictEqual(clamp43834(-5, -20, -10), -10);
  });

  await t.test('handles decimal values', () => {
    assert.strictEqual(clamp43834(5.5, 0.5, 10.5), 5.5);
    assert.strictEqual(clamp43834(0.1, 0.5, 10.5), 0.5);
    assert.strictEqual(clamp43834(11.5, 0.5, 10.5), 10.5);
  });
});
