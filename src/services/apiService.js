const logger = require('../config/logger');
const SourceProcessor = require('./sourceProcessor');
const { apiEndpoints } = require('../config/feedsConfig');

/**
 * Fetches and processes articles from API endpoints.
 * @returns {Promise<void>}
 */
async function fetchFromExternalAPIs() {
  if (!Array.isArray(apiEndpoints) || apiEndpoints.length === 0) {
    logger.warn('No API endpoints configured to process');
    return;
  }

  logger.info(`Starting API processing for ${apiEndpoints.length} endpoints`);
  const processor = new SourceProcessor('API', apiEndpoints);
  await processor.processSources();
  logger.info('Completed API processing');
}

module.exports = { fetchFromExternalAPIs };