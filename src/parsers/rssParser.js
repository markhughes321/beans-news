const logger = require('../config/logger');
const Parser = require('rss-parser');
const DefaultParser = require('./defaultParser');

/**
 * Default parser for RSS feeds.
 */
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

      // Try to extract image from various RSS fields
      if (item['media:content'] && item['media:content'].$.url) {
        imageUrl = item['media:content'].$.url;
        imageWidth = item['media:content'].$.width ? parseInt(item['media:content'].$.width, 10) : null;
        imageHeight = item['media:content'].$.height ? parseInt(item['media:content'].$.height, 10) : null;
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
      } else {
        logger.warn(`No image found for article: ${item.link || 'unknown'}`);
      }

      const image = this.createImage(imageUrl, imageWidth, imageHeight);

      const publishedAt = this.parseDate(item.isoDate || item.pubDate);

      // Use the cleanDescription method from DefaultParser
      const description = this.cleanDescription(item.description || item['content:encoded'], boilerplatePatterns);

      let tags = ['RSS', 'coffee'];
      if (item.category) {
        const categories = Array.isArray(item.category) ? item.category : [item.category];
        const categoryTags = categories.map(cat => {
          if (typeof cat === 'string') return cat.toLowerCase();
          if (cat._) return cat._.toLowerCase();
          return '';
        }).filter(Boolean);
        tags = [...tags, ...categoryTags];
      }

      return {
        link: item.link,
        domain,
        title: item.title || 'Untitled',
        source: feedData.title || feedName,
        publishedAt,
        description,
        image,
        tags,
      };
    });
  }
}

module.exports = RssParser;