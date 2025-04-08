const path = require("path");
const fs = require("fs");
const logger = require("../../config/logger");
const Article = require("../../models/Article");
const { processArticleAI } = require("../ai"); // Add this import

async function scrapeSource(sourceConfig) {
  const { name, url, scraperFile } = sourceConfig;
  logger.info("Initiating scrape for source", { source: name });

  // Validate scraperFile
  if (!scraperFile) {
    logger.error("No scraperFile specified in source config", { source: name });
    throw new Error(`No scraperFile specified for source '${name}'`);
  }

  const scraperPath = path.join(__dirname, `${scraperFile}.js`);
  if (!fs.existsSync(scraperPath)) {
    logger.error("Scraper file not found", { source: name, file: scraperPath });
    throw new Error(`Scraper file '${scraperFile}.js' not found for source '${name}'`);
  }

  let scraperModule;
  try {
    scraperModule = require(scraperPath);
  } catch (err) {
    logger.error("Error loading scraper module", { source: name, file: scraperPath, error: err.message });
    throw new Error(`Failed to load scraper '${scraperFile}.js' for source '${name}': ${err.message}`);
  }

  if (typeof scraperModule.scrape !== "function") {
    logger.error("Scraper module does not export a 'scrape' function", { source: name, file: scraperPath });
    throw new Error(`Scraper '${scraperFile}.js' must export a 'scrape' function`);
  }

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
  let updatedCount = 0;

  for (const raw of rawArticles) {
    try {
      const exists = await Article.findOne({ link: raw.link });
      if (exists) {
        // Update existing article only if it hasn't been processed by AI
        if (!exists.processedByAI) {
          await Article.updateOne(
            { link: raw.link },
            {
              $set: {
                title: raw.title,
                source: raw.source,
                domain: raw.domain,
                publishedAt: raw.publishedAt || new Date(),
                description: raw.description || "",
                imageUrl: raw.imageUrl || null,
                imageWidth: raw.imageWidth || null,
                imageHeight: raw.imageHeight || null,
                category: raw.category || "Market",
              },
            }
          );
          updatedCount++;
          logger.debug("Updated existing article", { link: raw.link });
        } else {
          logger.debug("Article already processed by AI, skipping update", { link: raw.link });
        }
        continue;
      }

      // Create new article
      const newArticle = new Article({
        ...raw,
        category: raw.category || "Market",
        sentToShopify: false,
        processedByAI: false,
      });
      await newArticle.save();
      newCount++;
      logger.info("Saved new article", { title: raw.title, uuid: newArticle.uuid });
    } catch (err) {
      logger.error("Error saving/updating scraped article", { link: raw.link, error: err.message });
    }
  }

  logger.info("Scrape completed for source", { source: name, newArticles: newCount, updatedArticles: updatedCount });
  return { newCount, updatedCount };
}

async function processArticlesWithAI(sourceName) {
  logger.info("Initiating AI processing for source", { source: sourceName });
  try {
    const articles = await Article.find({ source: sourceName, processedByAI: false });
    if (articles.length === 0) {
      logger.info("No unprocessed articles found for AI processing", { source: sourceName });
      return { processedCount: 0 };
    }

    let processedCount = 0;
    for (const article of articles) {
      try {
        logger.debug("Processing article with AI", { title: article.title });
        const aiData = await processArticleAI(article); // Now this should work
        await Article.updateOne(
          { _id: article._id },
          {
            $set: {
              category: aiData.category,
              geotag: aiData.geotag,
              tags: aiData.tags,
              improvedDescription: aiData.improvedDescription,
              seoTitle: aiData.seoTitle,
              seoDescription: aiData.seoDescription,
              processedByAI: true,
            },
          }
        );
        processedCount++;
        logger.info("Article processed by AI", { title: article.title });
      } catch (err) {
        logger.error("Error processing article with AI", { title: article.title, error: err.message });
      }
    }

    logger.info("AI processing completed", { source: sourceName, processedCount });
    return { processedCount };
  } catch (err) {
    logger.error("Error in processArticlesWithAI", { source: sourceName, error: err.message });
    throw err;
  }
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

module.exports = { scrapeSource, scrapeSourceByName, processArticlesWithAI };