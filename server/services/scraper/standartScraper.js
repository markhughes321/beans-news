const axios = require("axios");
const cheerio = require("cheerio");
const logger = require("../../config/logger");

async function scrape() {
  const baseUrl = "https://standartmag.com/blogs/journal";
  const articles = [];
  let page = 1;
  let hasMorePages = true;

  logger.debug("Starting scrape of Standart Magazine", { baseUrl });

  while (hasMorePages) {
    const url = `${baseUrl}?page=${page}`;
    try {
      logger.debug("Fetching page", { url });
      const response = await axios.get(url, {
        timeout: 10000,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; BeansNewsBot/1.0)" },
      });
      const $ = cheerio.load(response.data);

      const blogItems = $("article.blog-item");
      logger.debug("Found blog items", { count: blogItems.length, page });

      if (blogItems.length === 0) {
        logger.debug("No articles found on this page", { page });
        hasMorePages = false;
        break;
      }

      blogItems.each((i, element) => {
        const $item = $(element);

        const titleElement = $item.find(".blog-item__title-holder a");
        const title = titleElement.find("span").text().trim() || "Untitled";
        const relativeLink = titleElement.attr("href");
        const link = relativeLink ? `https://standartmag.com${relativeLink}` : null;

        const imgElement = $item.find(".blog-item__image img");
        const imageUrl = imgElement.attr("src") || null;
        const imageWidth = parseInt(imgElement.attr("width"), 10) || null;
        const imageHeight = parseInt(imgElement.attr("height"), 10) || null;

        const descriptionElement = $item.find(".blog-item__excerpt");
        const description = descriptionElement.find("p").text().trim() || "";

        if (link) {
          articles.push({
            title,
            link,
            source: "Standart Magazine",
            domain: "standartmag.com",
            publishedAt: new Date(), // Enhance with actual date if available
            description,
            imageUrl: imageUrl ? `https:${imageUrl}` : null,
            imageWidth,
            imageHeight,
          });
          logger.debug("Extracted article", { title, link, page });
        }
      });

      const nextPageLink = $(".pagination .next").attr("href");
      logger.debug("Next page link", { nextPageLink, page });
      hasMorePages = !!nextPageLink && page < 10; // Cap at 10 pages for safety
      page++;
    } catch (err) {
      logger.error("Error scraping Standart page", { url, error: err.message });
      hasMorePages = false;
    }
  }

  logger.info("Completed scraping Standart Magazine", { articleCount: articles.length });
  return articles;
}

module.exports = { scrape };