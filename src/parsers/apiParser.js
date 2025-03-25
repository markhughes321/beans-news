const axios = require('axios');
const axiosRetry = require('axios-retry');
const DefaultParser = require('./defaultParser');
const logger = require('../config/logger'); 

// Configure axios with retries
axiosRetry(axios, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 1000,
  retryCondition: (error) => axiosRetry.isNetworkOrIdempotentRequestError(error),
  onRetry: (retryCount, error) => {
    logger.warn(`Retry attempt ${retryCount} for request: ${error.config.url} - ${error.message}`);
  },
});

/**
 * Default parser for API endpoints.
 */
class APIParser extends DefaultParser {
  constructor(config = {}) {
    super({ ...config, sourceType: 'API' });
  }

  /**
   * Fetches data from an API endpoint.
   * @param {Object} sourceConfig - Configuration for the API endpoint.
   * @param {string} sourceConfig.url - The URL of the API endpoint.
   * @param {number} [sourceConfig.timeout=10000] - The request timeout in milliseconds.
   * @returns {Promise<Array>} The API response data.
   */
  async fetch(sourceConfig) {
    const { url, timeout = 10000 } = sourceConfig;
    logger.debug(`Fetching API endpoint: ${url}`);
    try {
      const { data } = await axios.get(url, { timeout });
      if (!Array.isArray(data)) {
        throw new Error(`API response from ${url} is not an array`);
      }
      logger.debug(`Successfully fetched ${data.length} items from API: ${url}`);
      return data;
    } catch (error) {
      const errorDetails = error.response ? `Status: ${error.response.status}` : error.message;
      throw new Error(`Failed to fetch API ${url}: ${errorDetails}`);
    }
  }

  /**
   * Parses API data into article objects.
   * @param {Array} data - The raw API data.
   * @param {Object} sourceConfig - Configuration for the API endpoint.
   * @param {string} sourceConfig.name - The name of the API source.
   * @returns {Array<Object>} An array of article objects.
   */
  parse(data, sourceConfig) {
    logger.debug(`Parsing API data from ${sourceConfig.url}`);
    const articles = data
      .map(item => {
        if (!item.link || !item.title) {
          logger.warn(`Skipping API item from ${sourceConfig.url}: Missing required fields (link or title) - ${JSON.stringify(item)}`);
          return null;
        }

        const domain = this.extractDomain(item.link);
        const publishedAt = this.parseDate(item.published);
        const image = item.image && item.image.url ? this.createImage(item.image.url, item.image.width, item.image.height) : null;

        return {
          link: item.link,
          domain,
          title: item.title,
          source: sourceConfig.name,
          publishedAt,
          description: item.summary || '',
          image,
          tags: ['API', 'coffee'],
        };
      })
      .filter(item => item !== null);

    if (articles.length === 0) {
      logger.warn(`No valid articles parsed from API: ${sourceConfig.url}`);
    } else {
      logger.debug(`Parsed ${articles.length} articles from API: ${sourceConfig.url}`);
    }

    return articles;
  }
}

module.exports = APIParser;