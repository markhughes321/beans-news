const logger = require('./logger');

const feedsConfig = {
  rssFeeds: [
    {
      url: 'https://sca.coffee/sca-news?format=rss',
      name: 'SCA News',
      parser: 'scaParser', // Updated to match scaParser.js
      timeout: 10000,
      retries: 3,
    },
    {
      url: 'https://dailycoffeenews.com/feed',
      name: 'Daily Coffee News',
      parser: 'dailyCoffeeNewsParser', // Already correct, matches dailyCoffeeNewsParser.js
      timeout: 10000,
      retries: 3,
    },
  ],
  apiEndpoints: [
    {
      name: 'ExampleAPI',
      url: 'https://api.example.com/articles?topic=coffee',
      timeout: 10000,
      retries: 3,
    },
  ],
  scrapeTargets: [
    {
      name: 'Coffee Example',
      url: 'https://www.coffeeexample.com/news',
      timeout: 10000,
      retries: 3,
    },
  ],
};

// Validate feed configurations
const validateFeed = (feed, type) => {
  if (!feed.url || typeof feed.url !== 'string') {
    logger.error(`Invalid ${type} configuration: 'url' is required and must be a string - ${JSON.stringify(feed)}`);
    return false;
  }
  if (!feed.name || typeof feed.name !== 'string') {
    logger.error(`Invalid ${type} configuration: 'name' is required and must be a string - ${JSON.stringify(feed)}`);
    return false;
  }
  return true;
};

feedsConfig.rssFeeds = feedsConfig.rssFeeds.filter(feed => validateFeed(feed, 'RSS'));
feedsConfig.apiEndpoints = feedsConfig.apiEndpoints.filter(feed => validateFeed(feed, 'API'));
feedsConfig.scrapeTargets = feedsConfig.scrapeTargets.filter(feed => validateFeed(feed, 'Scrape'));

module.exports = feedsConfig;