import { useState } from 'react';
import { scrapeSource, processWithAI, publishShopify } from '../services/api';

export const useScraper = () => {
  const [scrapeMessage, setScrapeMessage] = useState('');
  const [aiMessage, setAiMessage] = useState('');
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
      const updatedArticles = result.updatedArticles ?? 0; // Fallback to 0 if undefined
      setScrapeMessage(
        `Scrape Complete: Found ${result.newArticles} new articles and updated ${updatedArticles} articles for source '${source}'.`
      );
    } catch (err) {
      setError('Failed to scrape source');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessAI = async (source) => {
    if (!source) {
      setAiMessage('Please specify a source name.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await processWithAI(source);
      setAiMessage(
        `AI Processing Complete: Processed ${result.processedCount} articles for source '${source}'.`
      );
    } catch (err) {
      setError('Failed to process articles with AI');
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
    aiMessage,
    publishMessage,
    loading,
    error,
    handleScrape,
    handleProcessAI,
    handlePublish,
  };
};