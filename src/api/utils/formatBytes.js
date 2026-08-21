/**
 * Formats a byte count into a human-readable string
 * @param {number} bytes - The number of bytes
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted byte string (e.g., "1.5 MB")
 */
function formatBytes(bytes, decimals = 1) {
  if (!Number.isFinite(bytes) || bytes < 0) {
    throw new Error('bytes must be a non-negative number');
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let size = bytes;
  let unitIndex = 0;

  // Find the appropriate unit
  while (size >= 1000 && unitIndex < units.length - 1) {
    size /= 1000;
    unitIndex++;
  }

  // Format with the specified decimal places
  const formattedSize = size.toFixed(decimals);
  return `${formattedSize} ${units[unitIndex]}`;
}

module.exports = formatBytes;

