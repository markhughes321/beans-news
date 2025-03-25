const pLimit = require('p-limit').default;

/**
 * Creates a rate limiter to control concurrency.
 * @param {number} concurrency - The maximum number of concurrent tasks.
 * @returns {Function} A rate-limiting function.
 */
function createRateLimiter(concurrency) {
  return pLimit(concurrency);
}

module.exports = { createRateLimiter };