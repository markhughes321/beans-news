const logger = require('../config/logger');
const SourceProcessor = require('./sourceProcessor');
const { rssFeeds } = require('../config/feedsConfig');

/**
 * Fetches and processes articles from RSS feeds.
 * @returns {Promise<void>}
 */
async function fetchRssFeeds() {
  if (!Array.isArray(rssFeeds) || rssFeeds.length === 0) {
    logger.warn('No RSS feeds configured to process');
    return;
  }

  logger.info(`Starting RSS feed processing for ${rssFeeds.length} feeds`);
  const processor = new SourceProcessor('RSS', rssFeeds);
  await processor.processSources();
  logger.info('Completed RSS feed processing');
}

module.exports = { fetchRssFeeds };