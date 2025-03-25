// File: ./src/parsers/defaultParser.js
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

    // Step 1: Strip HTML tags
    let descriptionClean = striptags(descriptionRaw);

    // Step 2: Decode HTML entities (e.g., & to &)
    descriptionClean = he.decode(descriptionClean);

    // Step 3: Remove boilerplate patterns (if provided)
    boilerplatePatterns.forEach(pattern => {
      descriptionClean = descriptionClean.replace(pattern, '').trim();
    });

    // Step 4: Normalize whitespace (replace \r\n, multiple spaces, etc.)
    descriptionClean = descriptionClean
      .replace(/(\r\n|\n|\r)/g, ' ') // Replace newlines with spaces
      .replace(/\s+/g, ' ') // Collapse multiple spaces into one
      .trim(); // Remove leading/trailing spaces

    // Step 5: Remove trailing ellipsis if present in the source data
    descriptionClean = descriptionClean.replace(/\.\.\.$/, '').trim();

    // No truncation; return the full cleaned description
    return descriptionClean || 'No description available.';
  }
}

module.exports = DefaultParser;