/**
 * Converts a string to a URL-friendly slug
 * Lowercases text and replaces runs of non-alphanumeric characters with single hyphens
 * @param {string} str - The string to slugify
 * @returns {string} The slugified string
 */
function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

module.exports = slugify;
