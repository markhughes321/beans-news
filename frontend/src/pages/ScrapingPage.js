import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Alert, Tooltip } from '@mui/material';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useScraper } from '../hooks/useScraper';

const ScrapingPage = () => {
  const [source, setSource] = useState('');
  const { scrapeMessage, aiMessage, publishMessage, loading, error, handleScrape, handleProcessAI, handlePublish } =
    useScraper();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Scraping & Publishing
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <TextField
          label="Source Name"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          sx={{ flex: 1 }}
        />
        <Tooltip title="Fetches new articles from the specified source and adds them to the database.">
          <Button
            variant="contained"
            onClick={() => handleScrape(source)}
            disabled={loading}
          >
            Scrape
          </Button>
        </Tooltip>
        <Tooltip title="Processes unprocessed articles from the specified source with AI to enhance descriptions, categories, and tags.">
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleProcessAI(source)}
            disabled={loading}
          >
            Process with AI
          </Button>
        </Tooltip>
      </Box>
      {scrapeMessage && (
        <Typography sx={{ mt: 1, color: 'text.secondary' }}>
          {scrapeMessage}
        </Typography>
      )}
      {aiMessage && (
        <Typography sx={{ mt: 1, color: 'text.secondary' }}>
          {aiMessage}
        </Typography>
      )}
      <Box sx={{ mt: 3 }}>
        <Tooltip title="Publishes all unpublished articles to Shopify. Articles must be AI-processed first.">
          <Button
            variant="contained"
            color="secondary"
            onClick={handlePublish}
            disabled={loading}
          >
            Publish to Shopify
          </Button>
        </Tooltip>
      </Box>
      {publishMessage && (
        <Typography sx={{ mt: 1, color: 'text.secondary' }}>
          {publishMessage}
        </Typography>
      )}
      {loading && <LoadingSpinner />}
    </Box>
  );
};

export default ScrapingPage;