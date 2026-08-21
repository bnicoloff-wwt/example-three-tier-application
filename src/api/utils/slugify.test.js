const assert = require('assert');
const test = require('node:test');
const slugify = require('./slugify');

test('slugify - converts strings to URL-friendly slugs', async (t) => {
  await t.test('lowercases text', () => {
    assert.strictEqual(slugify('HELLO'), 'hello');
    assert.strictEqual(slugify('Hello World'), 'hello-world');
  });

  await t.test('replaces spaces with hyphens', () => {
    assert.strictEqual(slugify('hello world'), 'hello-world');
    assert.strictEqual(slugify('foo bar baz'), 'foo-bar-baz');
  });

  await t.test('replaces multiple spaces with single hyphen', () => {
    assert.strictEqual(slugify('hello   world'), 'hello-world');
    assert.strictEqual(slugify('foo     bar'), 'foo-bar');
  });

  await t.test('replaces special characters with hyphens', () => {
    assert.strictEqual(slugify('hello-world'), 'hello-world');
    assert.strictEqual(slugify('hello_world'), 'hello-world');
    assert.strictEqual(slugify('hello@world'), 'hello-world');
    assert.strictEqual(slugify('hello.world'), 'hello-world');
  });

  await t.test('replaces runs of special characters with single hyphen', () => {
    assert.strictEqual(slugify('hello---world'), 'hello-world');
    assert.strictEqual(slugify('hello_-_.world'), 'hello-world');
  });

  await t.test('removes leading and trailing hyphens', () => {
    assert.strictEqual(slugify('-hello'), 'hello');
    assert.strictEqual(slugify('hello-'), 'hello');
    assert.strictEqual(slugify('---hello---'), 'hello');
  });

  await t.test('handles alphanumeric characters', () => {
    assert.strictEqual(slugify('hello123world'), 'hello123world');
    assert.strictEqual(slugify('test-case-42'), 'test-case-42');
  });

  await t.test('handles empty strings and special cases', () => {
    assert.strictEqual(slugify(''), '');
    assert.strictEqual(slugify('   '), '');
    assert.strictEqual(slugify('---'), '');
  });
});
