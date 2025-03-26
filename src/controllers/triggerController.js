const logger = require('../config/logger');
const { fetchRssFeeds } = require('../services/rssService');
const { scrapeWebsites } = require('../services/scrapingService');
const { fetchFromExternalAPIs } = require('../services/apiService');

const serviceMap = {
  rss: fetchRssFeeds,
  scraping: scrapeWebsites,
  api: fetchFromExternalAPIs,
};

/**
 * Triggers a specific service manually.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const triggerService = async (req, res) => {
  const { service } = req.params;
  const fn = serviceMap[service.toLowerCase()];

  if (!fn) {
    return res.status(400).json({ error: `Invalid service: ${service}. Use 'rss', 'scraping', or 'api'` });
  }

  try {
    logger.info(`Manually triggering ${service} service`);
    await fn();
    res.json({ message: `${service} service triggered successfully` });
  } catch (error) {
    logger.error(`Error triggering ${service} service: ${error.message}`);
    res.status(500).json({ error: `Failed to trigger ${service} service`, details: error.message });
  }
};

module.exports = { triggerService };