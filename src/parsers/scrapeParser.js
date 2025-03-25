const axios = require('axios');
const axiosRetry = require('axios-retry');
const cheerio = require('cheerio');
const DefaultParser = require('./defaultParser');
const logger = require('../config/logger'); // Added

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
 * Default parser for web scraping.
 */
class ScrapeParser extends DefaultParser {
  constructor(config = {}) {
    super({ ...config, sourceType: 'SCRAPE' });
  }

  /**
   * Fetches HTML data from a webpage.
   * @param {Object} sourceConfig - Configuration for the webpage.
   * @param {string} sourceConfig.url - The URL of the webpage.
   * @param {number} [sourceConfig.timeout=10000] - The request timeout in milliseconds.
   * @returns {Promise<string>} The HTML content of the webpage.
   */
  async fetch(sourceConfig) {
    const { url, timeout = 10000 } = sourceConfig;
    logger.debug(`Fetching webpage: ${url}`);
    try {
      const { data } = await axios.get(url, { timeout });
      logger.debug(`Successfully fetched webpage: ${url}`);
      return data;
    } catch (error) {
      const errorDetails = error.response ? `Status: ${error.response.status}` : error.message;
      throw new Error(`Failed to fetch webpage ${url}: ${errorDetails}`);
    }
  }

  /**
   * Parses HTML data into article objects.
   * @param {string} data - The raw HTML data.
   * @param {Object} sourceConfig - Configuration for the webpage.
   * @param {string} sourceConfig.url - The URL of the webpage.
   * @param {string} sourceConfig.name - The name of the webpage source.
   * @returns {Array<Object>} An array of article objects.
   */
  parse(data, sourceConfig) {
    logger.debug(`Parsing HTML data from ${sourceConfig.url}`);
    const $ = cheerio.load(data);
    const articles = [];

    $('.article-item').each((i, elem) => {
      const title = $(elem).find('.article-title').text().trim();
      const link = $(elem).find('a').attr('href');
      const description = $(elem).find('.article-summary').text().trim();
      const imageUrl = $(elem).find('img').attr('src') || null;
      const domain = this.extractDomain(sourceConfig.url);

      const dateText = $(elem).find('.article-date').text().trim();
      const publishedAt = dateText ? this.parseDate(dateText) : new Date();

      const image = this.createImage(imageUrl);

      if (title && link) {
        articles.push({
          link,
          domain,
          title,
          source: sourceConfig.name,
          publishedAt,
          description,
          image,
          tags: ['Scrape', 'coffee'],
        });
      }
    });

    if (articles.length === 0) {
      logger.warn(`No articles found in HTML data from ${sourceConfig.url}`);
    } else {
      logger.debug(`Parsed ${articles.length} articles from ${sourceConfig.url}`);
    }

    return articles;
  }
}

module.exports = ScrapeParser;