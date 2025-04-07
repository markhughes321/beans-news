const fs = require("fs");
const path = require("path");
const logger = require("../../config/logger");
const Article = require("../../models/Article");
const { processArticleAI } = require("../ai");
const { scrapeDailyCoffeeNews } = require("./dailyCoffeeNewsScraper");

async function scrapeSource(sourceConfig) {
  const { name, type, url } = sourceConfig;
  logger.info("Initiating scrape for source", { source: name });

  let rawArticles = [];
  if (name === "dailyCoffeeNews") {
    rawArticles = await scrapeDailyCoffeeNews();
  } else {
    logger.warn(`No known scraper for source '${name}'`);
    return 0;
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