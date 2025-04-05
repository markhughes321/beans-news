import React, { useState } from "react";
import { scrapeSource, publishShopify } from "../services/api";

function ScrapingPage() {
  const [source, setSource] = useState("");
  const [scrapeMessage, setScrapeMessage] = useState("");
  const [publishMessage, setPublishMessage] = useState("");

  const handleScrape = async () => {
    if (!source) {
      setScrapeMessage("Please specify a source name.");
      return;
    }
    const result = await scrapeSource(source);
    setScrapeMessage(`Scrape Complete: Found ${result.newArticles} new articles for source '${source}'.`);
  };

  const handlePublish = async () => {
    const result = await publishShopify();
    setPublishMessage(result.message);
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Scraping & Publishing</h1>

      <div style={{ marginTop: "1rem" }}>
        <label>Source Name:</label>
        <input
          type="text"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          style={{ marginLeft: "0.5rem" }}
        />
        <button onClick={handleScrape} style={{ marginLeft: "1rem" }}>
          Scrape
        </button>
      </div>
      {scrapeMessage && <p>{scrapeMessage}</p>}

      <hr />

      <div style={{ marginTop: "1rem" }}>
        <button onClick={handlePublish}>Publish to Shopify</button>
        {publishMessage && <p>{publishMessage}</p>}
      </div>
    </div>
  );
}

export default ScrapingPage;
