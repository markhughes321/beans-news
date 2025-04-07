const fs = require("fs");
const path = require("path");
const logger = require("../../config/logger");
const Article = require("../../models/Article");
const { processArticleAI } = require("../ai");

async function scrapeSource(sourceConfig) {
  const { name, url, scraperFile } = sourceConfig;
  logger.info("Initiating scrape for source", { source: name });

  // Validate scraperFile
  if (!scraperFile) {
    logger.error("No scraperFile specified in source config", { source: name });
    throw new Error(`No scraperFile specified for source '${name}'`);
  }

  // Define the scraper file path relative to this file's location
  const scraperPath = path.join(__dirname, `${scraperFile}.js`);

  // Check if the scraper file exists
  if (!fs.existsSync(scraperPath)) {
    logger.error("Scraper file not found", { source: name, file: scraperPath });
    throw new Error(`Scraper file '${scraperFile}.js' not found for source '${name}'`);
  }

  // Dynamically load the scraper
  let scraperModule;
  try {
    scraperModule = require(scraperPath);
  } catch (err) {
    logger.error("Error loading scraper module", { source: name, file: scraperPath, error: err.message });
    throw new Error(`Failed to load scraper '${scraperFile}.js' for source '${name}': ${err.message}`);
  }

  // Ensure the scraper exports a 'scrape' function
  if (typeof scraperModule.scrape !== "function") {
    logger.error("Scraper module does not export a 'scrape' function", { source: name, file: scraperPath });
    throw new Error(`Scraper '${scraperFile}.js' must export a 'scrape' function`);
  }

  // Execute the scrape
  let rawArticles;
  try {
    rawArticles = await scraperModule.scrape();
  } catch (err) {
    logger.error("Error executing scraper", { source: name, file: scraperPath, error: err.message });
    throw err;
  }

  if (!Array.isArray(rawArticles)) {
    logger.error("Scraper did not return an array", { source: name, file: scraperPath });
    throw new Error(`Scraper '${scraperFile}.js' for source '${name}' must return an array of articles`);
  }

  logger.debug("Processing scraped articles", { count: rawArticles.length });
  let newCount = 0;
  for (const raw of rawArticles) {
    try {
      const exists = await Article.findOne({ link: raw.link });
      if (exists) {
        logger.debug("Article already exists, skipping", { link: raw.link });
        continue;
      }

      logger.debug("Processing article with AI", { title: raw.title });
      const aiData = await processArticleAI(raw);

      const newArticle = new Article({
        ...raw,
        category: aiData.category,
        geotag: aiData.geotag,
        tags: aiData.tags,
        improvedDescription: aiData.improvedDescription,
        seoTitle: aiData.seoTitle,
        seoDescription: aiData.seoDescription,
        sentToShopify: false,
      });
      await newArticle.save();
      newCount++;
      logger.info("Saved new article", { title: raw.title, uuid: newArticle.uuid });
    } catch (err) {
      logger.error("Error saving scraped article", { link: raw.link, error: err.message });
    }
  }

  logger.info("Scrape completed for source", { source: name, newArticles: newCount });
  return newCount;
}

async function scrapeSourceByName(sourceName) {
  logger.info("Manual scrape triggered", { source: sourceName });
  try {
    const configPath = path.join(__dirname, "../../config/sources.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const src = config.sources.find((s) => s.name === sourceName);
    if (!src) {
      logger.error("Source not found in config", { source: sourceName });
      throw new Error(`Source '${sourceName}' not found in sources.json`);
    }
    return await scrapeSource(src);
  } catch (err) {
    logger.error("scrapeSourceByName error", { source: sourceName, error: err.message });
    throw err;
  }
}

module.exports = { scrapeSource, scrapeSourceByName };