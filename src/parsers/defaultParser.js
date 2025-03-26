const logger = require('../config/logger');
const he = require('he');
const striptags = require('striptags');

/**
 * Default parser class with shared parsing logic for all source types.
 */
class DefaultParser {
  constructor(config = {}) {
    this.sourceType = config.sourceType || 'unknown';
  }

  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (error) {
      logger.warn(`Failed to extract domain from URL ${url}: ${error.message}`);
      return null;
    }
  }

  parseDate(dateString) {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? new Date() : date;
  }

  createImage(url, width, height) {
    if (!url) return null;
    return {
      filename_disk: url,
      width: width || null,
      height: height || null,
    };
  }

  cleanDescription(descriptionRaw, boilerplatePatterns = []) {
    if (!descriptionRaw || typeof descriptionRaw !== 'string') {
      return 'No description available.';
    }

    let descriptionClean = striptags(descriptionRaw);
    descriptionClean = he.decode(descriptionClean);

    boilerplatePatterns.forEach(pattern => {
      descriptionClean = descriptionClean.replace(pattern, '').trim();
    });

    descriptionClean = descriptionClean
      .replace(/(\r\n|\n|\r)/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    descriptionClean = descriptionClean.replace(/\.\.\.$/, '').trim();

    return descriptionClean || 'No description available.';
  }

  toTitleCase(str) {
    if (!str || typeof str !== 'string') return str;
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

module.exports = DefaultParser;