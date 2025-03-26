const logger = require('../config/logger');
const Parser = require('rss-parser');
const axios = require('axios');
const axiosRetry = require('axios-retry').default;
const DefaultParser = require('./defaultParser');

axiosRetry(axios, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 2000,
  retryCondition: (error) => {
    return (
      axiosRetry.isNetworkError(error) ||
      axiosRetry.isRetryableError(error)
    );
  },
  onRetry: (retryCount, error) => {
    logger.warn(`Retry attempt ${retryCount} for RSS feed fetch: ${error.config.url} - ${error.message}`);
  },
});

class RssParser extends DefaultParser {
  constructor(config = {}) {
    super({ ...config, sourceType: 'RSS' });
    this.parser = new Parser({
      customFields: {
        item: [
          'media:content',
          'content:encoded',
          ['media:thumbnail', 'thumbnail'],
          ['media:group', 'media'],
          'category',
        ],
      },
      requestOptions: {
        httpClient: async (url) => {
          const response = await axios.get(url);
          return response.data;
        },
      },
    });
  }

  async fetch(sourceConfig) {
    const { url } = sourceConfig;
    try {
      const feedData = await this.parser.parseURL(url);
      logger.info(`Parsed feed: ${url}, title: ${feedData.title}, items: ${feedData.items.length}`);
      return feedData;
    } catch (error) {
      const errorDetails = error.response ? `Status: ${error.response.status}` : error.message;
      throw new Error(`Failed to fetch RSS feed ${url}: ${errorDetails}`);
    }
  }

  parse(feedData, sourceConfig, boilerplatePatterns = []) {
    const feedName = sourceConfig.name || feedData.title || 'RSS Feed';
    return feedData.items.map(item => {
      const domain = this.extractDomain(item.link);

      let imageUrl = null;
      let imageWidth = null;
      let imageHeight = null;

      if (item['media:content'] && item['media:content'].$.url) {
        imageUrl = item['media:content'].$.url;
        imageWidth = item['media:content'].$.width ? parseInt(item['media:content'].$.width, 10) : null;
        imageHeight = item['media:content'].$.height ? parseInt(item['media:content'].$.height, 10) : null;
      } else if (item['media:thumbnail'] && item['media:thumbnail'].$.url) {
        imageUrl = item['media:thumbnail'].$.url;
        imageWidth = item['media:thumbnail'].$.width ? parseInt(item['media:thumbnail'].$.width, 10) : null;
        imageHeight = item['media:thumbnail'].$.height ? parseInt(item['media:thumbnail'].$.height, 10) : null;
      } else if (item['content:encoded'] && item['content:encoded'].match(/<img[^>]+src=["'](.*?)["']/i)) {
        const imgMatch = item['content:encoded'].match(/<img[^>]+src=["'](.*?)["']/i);
        imageUrl = imgMatch[1];
        const widthMatch = item['content:encoded'].match(/<img[^>]+width=["']?(\d+)["']?/i);
        const heightMatch = item['content:encoded'].match(/<img[^>]+height=["']?(\d+)["']?/i);
        imageWidth = widthMatch && widthMatch[1] ? parseInt(widthMatch[1], 10) : null;
        imageHeight = heightMatch && heightMatch[1] ? parseInt(heightMatch[1], 10) : null;
      } else if (item.description && item.description.match(/<img[^>]+src=["'](.*?)["']/i)) {
        const imgMatch = item.description.match(/<img[^>]+src=["'](.*?)["']/i);
        imageUrl = imgMatch[1];
        const widthMatch = item.description.match(/<img[^>]+width=["']?(\d+)["']?/i);
        const heightMatch = item.description.match(/<img[^>]+height=["']?(\d+)["']?/i);
        imageWidth = widthMatch && widthMatch[1] ? parseInt(widthMatch[1], 10) : null;
        imageHeight = heightMatch && heightMatch[1] ? parseInt(heightMatch[1], 10) : null;
      } else if (item.enclosure && item.enclosure.url && item.enclosure.type && item.enclosure.type.startsWith('image/')) {
        imageUrl = item.enclosure.url;
      }

      const image = this.createImage(imageUrl, imageWidth, imageHeight) || {
        filename_disk: 'https://via.placeholder.com/150',
        width: 150,
        height: 150,
      };

      const publishedAt = this.parseDate(item.isoDate || item.pubDate);

      const description = this.cleanDescription(item.description || item['content:encoded'], boilerplatePatterns);

      return {
        link: item.link,
        domain,
        title: item.title || 'Untitled',
        source: feedData.title || feedName,
        publishedAt,
        description,
        image,
        // Remove default tags
      };
    });
  }
}

module.exports = RssParser;