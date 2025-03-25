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
    return parsedItems.map(item => ({
      ...item,
      tags: [...(item.tags || []), 'SCA'],
    }));
  }
}

module.exports = ScaParser;