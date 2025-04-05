// File: ./server/services/scraper/dailyCoffeeNewsScraper.js

const Parser = require("rss-parser");
const cheerio = require("cheerio");
const logger = require("../../config/logger");

const parser = new Parser();

/**
 * Scrape the dailycoffeenews.com RSS feed
 * Extract first <img> src, plus width/height if present
 */
async function scrapeDailyCoffeeNews() {
  try {
    const feedUrl = "https://dailycoffeenews.com/feed/";
    const feed = await parser.parseURL(feedUrl);

    const articles = feed.items.map((item) => {
      // raw HTML for images
      const htmlDesc = item.content || item.description || "";

      const $ = cheerio.load(htmlDesc);
      const firstImg = $("img").first();
      const src = firstImg.attr("src") || null;
      const width = firstImg.attr("width") || null;
      const height = firstImg.attr("height") || null;

      // convert string widths/heights to integers
      const imageWidth = width ? parseInt(width, 10) : null;
      const imageHeight = height ? parseInt(height, 10) : null;

      return {
        title: item.title?.trim() || "Untitled",
        link: item.link,
        source: "dailyCoffeeNews",
        domain: "dailycoffeenews.com",
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
        description: item.contentSnippet || item.description || "",

        imageUrl: src,
        imageWidth,
        imageHeight
      };
    });

    return articles;
  } catch (err) {
    logger.error("Error scraping dailyCoffeeNews feed", { error: err });
    return [];
  }
}

module.exports = {
  scrapeDailyCoffeeNews
};
