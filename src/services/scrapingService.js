const logger = require('../config/logger');
const SourceProcessor = require('./sourceProcessor');
const { scrapeTargets } = require('../config/feedsConfig');

/**
 * Fetches and processes articles from scraped websites.
 * @returns {Promise<void>}
 */
async function scrapeWebsites() {
  if (!Array.isArray(scrapeTargets) || scrapeTargets.length === 0) {
    logger.warn('No scrape targets configured to process');
    return;
  }

  logger.info(`Starting web scraping for ${scrapeTargets.length} targets`);
  const processor = new SourceProcessor('SCRAPE', scrapeTargets);
  await processor.processSources();
  logger.info('Completed web scraping');
}

module.exports = { scrapeWebsites };