const logger = require('../config/logger');
const Parser = require('rss-parser');
const cheerio = require('cheerio');
const DefaultParser = require('./defaultParser');

/**
 * Custom parser for the Daily Coffee News RSS feed.
 */
class DailyCoffeeNewsParser extends DefaultParser {
  constructor(config = {}) {
    super({ ...config, sourceType: 'RSS' });
    this.parser = new Parser({
      customFields: {
        item: ['media:content', 'dc:creator', 'category', 'content:encoded'],
      },
    });
  }

  async fetch(sourceConfig) {
    const { url } = sourceConfig;
    try {
      const feedData = await this.parser.parseURL(url);
      logger.info(`Parsed feed: ${url}, title: ${feedData.title}, items: ${feedData.items.length}`);
      if (feedData.items.length > 0) {
        logger.debug('Sample item:', JSON.stringify(feedData.items[0], null, 2));
      }
      return feedData;
    } catch (error) {
      const errorDetails = error.response ? `Status: ${error.response.status}` : error.message;
      throw new Error(`Failed to fetch Daily Coffee News RSS feed ${url}: ${errorDetails}`);
    }
  }

  parse(feedData, sourceConfig) {
    const feedName = sourceConfig.name || 'Daily Coffee News';

    // Define boilerplate patterns for Daily Coffee News
    const boilerplatePatterns = [
      /Welcome to DCN’s Weekly Coffee News!.*?latest coffee industry news\.?/i,
      /Also, check out the latest career opportunities at CoffeeIndustryJobs\.com\.?/i,
      /Subscribe here for all the latest coffee industry news\.?/i,
      /Welcome to Design Details, an ongoing editorial feature in Daily Coffee News.*?branding\.?/i, // Added for articles like "Design Details: The Subjective Shape of Flavor with WeBe Coffee"
    ];

    return feedData.items.map(item => {
      const domain = this.extractDomain(item.link);

      let imageUrl = null;
      let imageWidth = null;
      let imageHeight = null;
      let descriptionRaw = '';

      // Try multiple fields for description and image
      const contentSources = [
        item.description,
        item['content:encoded'],
        item.content,
      ].filter(Boolean);

      if (contentSources.length === 0) {
        logger.warn(`No content fields (description, content:encoded, content) found for ${item.link}`);
      } else {
        // Use the first available content source for description and image extraction
        const content = contentSources[0];
        descriptionRaw = content;
        logger.debug(`Parsing content for ${item.link}: ${content}`);

        const $desc = cheerio.load(content, { xmlMode: false, decodeEntities: true });
        const imgElement = $desc('img').first();
        if (imgElement.length > 0) {
          imageUrl = imgElement.attr('src') || null;
          imageWidth = imgElement.attr('width') ? parseInt(imgElement.attr('width'), 10) : null;
          imageHeight = imgElement.attr('height') ? parseInt(imgElement.attr('height'), 10) : null;
          logger.debug(`Extracted image for ${item.link}: url=${imageUrl}, width=${imageWidth}, height=${imageHeight}`);
        } else {
          logger.warn(`No <img> tag found in content for ${item.link}`);
          // Fallback: Use regex to extract image URL
          const imgMatch = content.match(/<img[^>]+src=["'](.*?)["']/i);
          if (imgMatch && imgMatch[1]) {
            imageUrl = imgMatch[1];
            logger.debug(`Extracted image URL using regex for ${item.link}: ${imageUrl}`);
            const widthMatch = content.match(/<img[^>]+width=["']?(\d+)["']?/i);
            const heightMatch = content.match(/<img[^>]+height=["']?(\d+)["']?/i);
            imageWidth = widthMatch && widthMatch[1] ? parseInt(widthMatch[1], 10) : null;
            imageHeight = heightMatch && heightMatch[1] ? parseInt(heightMatch[1], 10) : null;
            logger.debug(`Regex extracted dimensions for ${item.link}: width=${imageWidth}, height=${imageHeight}`);
          } else {
            logger.warn(`Regex fallback also failed to find image for ${item.link}`);
          }
        }
      }

      const image = this.createImage(imageUrl, imageWidth, imageHeight);
      if (!image) {
        logger.warn(`No image found for Daily Coffee News article: ${item.link || 'unknown'}`);
      } else {
        logger.debug(`Created image object for ${item.link}: ${JSON.stringify(image)}`);
      }

      const publishedAt = this.parseDate(item.isoDate || item.pubDate);

      // Clean the description using the method from DefaultParser
      const description = this.cleanDescription(descriptionRaw, boilerplatePatterns);
      logger.debug(`Cleaned description for ${item.link}: ${description}`);

      let tags = ['RSS', 'coffee', 'daily coffee news'];
      if (item.category) {
        const categories = Array.isArray(item.category) ? item.category : [item.category];
        const categoryTags = categories.map(cat => typeof cat === 'string' ? cat.toLowerCase() : '').filter(Boolean);
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

module.exports = DailyCoffeeNewsParser;