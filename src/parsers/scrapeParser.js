const axios = require('axios');
const axiosRetry = require('axios-retry').default;
const cheerio = require('cheerio');
const DefaultParser = require('./defaultParser');
const logger = require('../config/logger');

axiosRetry(axios, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 1000,
  retryCondition: (error) => {
    return (
      axiosRetry.isNetworkError(error) ||
      axiosRetry.isRetryableError(error)
    );
  },
  onRetry: (retryCount, error) => {
    logger.warn(`Retry attempt ${retryCount} for request: ${error.config.url} - ${error.message}`);
  },
});

class ScrapeParser extends DefaultParser {
  constructor(config = {}) {
    super({ ...config, sourceType: 'SCRAPE' });
  }

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

      const image = this.createImage(imageUrl) || {
        filename_disk: 'https://via.placeholder.com/150',
        width: 150,
        height: 150,
      };

      if (title && link) {
        articles.push({
          link,
          domain,
          title,
          source: sourceConfig.name,
          publishedAt,
          description,
          image,
          // Remove default tags
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