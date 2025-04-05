import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Alert } from '@mui/material';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useScraper } from '../hooks/useScraper';

const ScrapingPage = () => {
  const [source, setSource] = useState('');
  const { scrapeMessage, publishMessage, loading, error, handleScrape, handlePublish } =
    useScraper();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Scraping & Publishing
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Box sx={{ mt: 2 }}>
        <TextField
          label="Source Name"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          sx={{ mr: 2 }}
        />
        <Button
          variant="contained"
          onClick={() => handleScrape(source)}
          disabled={loading}
        >
          Scrape
        </Button>
      </Box>
      {scrapeMessage && (
        <Typography sx={{ mt: 1, color: 'text.secondary' }}>
          {scrapeMessage}
        </Typography>
      )}
      <Box sx={{ mt: 3 }}>
        <Button
          variant="contained"
          color="secondary"
          onClick={handlePublish}
          disabled={loading}
        >
          Publish to Shopify
        </Button>
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