// File: ./server/services/scraper/index.js
const fs = require("fs");
const path = require("path");
const logger = require("../../config/logger");
const Article = require("../../models/Article");
const { processArticleAI } = require("../ai");

// Import each domain-specific scraper
const { scrapeDailyCoffeeNews } = require("./dailyCoffeeNewsScraper");

/**
 * Scrape a single source config object
 */
async function scrapeSource(sourceConfig) {
  const { name, type, url } = sourceConfig;
  let rawArticles = [];

  // If you have multiple domain scrapers, switch by "name" or something
  if (name === "dailyCoffeeNews") {
    rawArticles = await scrapeDailyCoffeeNews();
  }
  // else if (name === "someOtherSite") { rawArticles = await scrapeSomeOtherSite(); }
  else {
    logger.warn(`No known scraper for source '${name}'.`);
    return 0;
  }

  let newCount = 0;
  for (const raw of rawArticles) {
    try {
      // Avoid duplicates by link
      const exists = await Article.findOne({ link: raw.link });
      if (exists) continue;

      // AI processing with ChatGPT (see below for the updated file)
      const aiData = await processArticleAI(raw);

      const newArticle = new Article({
        ...raw,
        category: aiData.category,
        geotag: aiData.geotag,
        tags: aiData.tags,
        improvedDescription: aiData.improvedDescription,
        sentToShopify: false
      });
      await newArticle.save();
      newCount++;
    } catch (err) {
      logger.error("Error saving scraped article", { error: err, link: raw.link });
    }
  }

  return newCount;
}

/**
 * For manual triggers: read `sources.json`, find the source, call scrapeSource
 */
async function scrapeSourceByName(sourceName) {
  try {
    const configPath = path.join(__dirname, "../../config/sources.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const src = config.sources.find((s) => s.name === sourceName);
    if (!src) {
      throw new Error(`Source '${sourceName}' not found in sources.json`);
    }
    return await scrapeSource(src);
  } catch (err) {
    logger.error("scrapeSourceByName error", { error: err });
    throw err;
  }
}

module.exports = {
  scrapeSource,
  scrapeSourceByName
};
