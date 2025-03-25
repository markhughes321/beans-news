const logger = require('../config/logger');
const { createRateLimiter } = require('../utils/rateLimiter');
const { processArticles } = require('../utils/processArticles');
const fs = require('fs');
const path = require('path');

/**
 * Generic processor for handling data sources (RSS, API, Scrape).
 */
class SourceProcessor {
  constructor(sourceType, sources, concurrency = parseInt(process.env.DEFAULT_CONCURRENCY) || 5) {
    this.sourceType = sourceType;
    this.sources = sources;
    this.limit = createRateLimiter(concurrency);
    logger.debug(`Initialized SourceProcessor for ${sourceType} with concurrency ${concurrency}`);
  }

  getParser(sourceConfig) {
    const parserName = sourceConfig.parser || `${this.sourceType}Parser`;
    logger.debug(`Attempting to load parser: ${parserName} for source ${sourceConfig.url}`);

    // First, try to load the parser with the exact case
    try {
      const ParserClass = require(`../parsers/${parserName}`);
      logger.debug(`Successfully loaded parser: ${parserName}`);
      return new ParserClass();
    } catch (error) {
      logger.debug(`Exact case match failed for parser ${parserName}: ${error.message}`);
    }

    // If exact match fails, try a case-insensitive match
    const parserDir = path.resolve(__dirname, '../parsers');
    const files = fs.readdirSync(parserDir);
    const parserFile = files.find(file => file.toLowerCase() === `${parserName.toLowerCase()}.js`);
    
    if (parserFile) {
      try {
        const ParserClass = require(`../parsers/${parserName}`);
        logger.debug(`Successfully loaded parser with case-insensitive match: ${parserName}`);
        return new ParserClass();
      } catch (error) {
        logger.warn(`Failed to load parser ${parserName} even with case-insensitive match: ${error.message}\n${error.stack}`);
      }
    }

    // Fallback to default parser
    logger.warn(`Parser ${parserName} not found, using default ${this.sourceType}Parser`);
    const defaultParserName = `${this.sourceType.toLowerCase()}Parser`; // Ensure lowercase
    try {
      const DefaultParserClass = require(`../parsers/${defaultParserName}`);
      logger.debug(`Successfully loaded default parser: ${defaultParserName}`);
      return new DefaultParserClass();
    } catch (error) {
      logger.error(`Failed to load default parser ${defaultParserName}: ${error.message}\n${error.stack}`);
      throw new Error(`Failed to load default parser ${defaultParserName}`);
    }
  }

  async process(sourceConfig) {
    const parser = this.getParser(sourceConfig);
    const rawData = await parser.fetch(sourceConfig);
    const articles = parser.parse(rawData, sourceConfig);
    return articles;
  }

  async processSources() {
    const failedSources = [];
    const tasks = this.sources.map(source => this.limit(async () => {
      try {
        const articles = await this.process(source);
        await processArticles(articles, this.sourceType, source.url);
      } catch (error) {
        logger.error(`Failed to process ${this.sourceType} source ${source.url}: ${error.message}\n${error.stack}`);
        failedSources.push({ url: source.url, error: error.message });
      }
    }));

    await Promise.all(tasks);

    if (failedSources.length > 0) {
      logger.warn(`Summary of failed sources for ${this.sourceType}: ${JSON.stringify(failedSources, null, 2)}`);
    } else {
      logger.info(`All ${this.sourceType} sources processed successfully`);
    }
  }

  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (error) {
      logger.error(`Failed to extract domain from URL ${url}: ${error.message}`);
      return 'unknown';
    }
  }
}

module.exports = SourceProcessor;