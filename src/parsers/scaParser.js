const RssParser = require('./rssParser');

/**
 * Custom parser for the SCA RSS feed.
 */
class ScaParser extends RssParser {
  constructor(config = {}) {
    super({ ...config, sourceType: 'RSS' });
  }

  parse(feedData, sourceConfig) {
    // Define SCA-specific boilerplate patterns
    const boilerplatePatterns = [
      /The Specialty Coffee Association \(SCA\) is delighted to announce that the.*?mark\.?/i,
    ];

    const parsedItems = super.parse(feedData, sourceConfig, boilerplatePatterns);

    // Ensure every item has an image
    return parsedItems.map(item => ({
      ...item,
      image: item.image || {
        filename_disk: 'https://via.placeholder.com/150', // Default placeholder image
        width: 150,
        height: 150,
      },
      // Remove default category and tags
    }));
  }
}

module.exports = ScaParser;