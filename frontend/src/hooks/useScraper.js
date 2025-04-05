import { useState } from 'react';
import { scrapeSource, publishShopify } from '../services/api';

export const useScraper = () => {
  const [scrapeMessage, setScrapeMessage] = useState('');
  const [publishMessage, setPublishMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleScrape = async (source) => {
    if (!source) {
      setScrapeMessage('Please specify a source name.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await scrapeSource(source);
      setScrapeMessage(
        `Scrape Complete: Found ${result.newArticles} new articles for source '${source}'.`
      );
    } catch (err) {
      setError('Failed to scrape source');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await publishShopify();
      setPublishMessage(result.message);
    } catch (err) {
      setError('Failed to publish to Shopify');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    scrapeMessage,
    publishMessage,
    loading,
    error,
    handleScrape,
    handlePublish,
  };
};