// File: ./frontend/src/pages/ScrapingPage.js
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
} from "@mui/material";
import { triggerScrape, processWithAI, publishShopify } from "../services/api";
import axios from "axios";

const ScrapingPage = () => {
  const [sources, setSources] = useState([]);
  const [loadingSources, setLoadingSources] = useState(true);
  const [sourceStates, setSourceStates] = useState({}); // Tracks loading, errors, and results per source

  // Fetch sources on mount
  useEffect(() => {
    const fetchSources = async () => {
      setLoadingSources(true);
      try {
        const response = await axios.get("/api/system/sources");
        const fetchedSources = response.data.sources || [];
        setSources(fetchedSources);
        // Initialize state for each source
        setSourceStates(
          fetchedSources.reduce((acc, source) => ({
            ...acc,
            [source.name]: { loadingAction: null, error: null, scrapeResult: null, aiResult: null, shopifyResult: null },
          }), {})
        );
      } catch (err) {
        setSourceStates({ globalError: "Failed to fetch scrape sources: " + (err.response?.data?.error || err.message) });
      } finally {
        setLoadingSources(false);
      }
    };
    fetchSources();
  }, []);

  // Update state for a specific source
  const updateSourceState = (sourceName, updates) => {
    setSourceStates((prev) => ({
      ...prev,
      [sourceName]: { ...prev[sourceName], ...updates },
    }));
  };

  // Trigger scrape for a single source
  const handleScrape = async (sourceName) => {
    updateSourceState(sourceName, { loadingAction: "scrape", error: null, scrapeResult: null });
    try {
      const response = await triggerScrape(sourceName);
      updateSourceState(sourceName, { scrapeResult: response });
    } catch (err) {
      updateSourceState(sourceName, { error: err.response?.data?.error || `Failed to scrape ${sourceName}` });
    } finally {
      updateSourceState(sourceName, { loadingAction: null });
    }
  };

  // Trigger AI processing for a single source
  const handleProcessAI = async (sourceName) => {
    updateSourceState(sourceName, { loadingAction: "ai", error: null, aiResult: null });
    try {
      const response = await processWithAI(sourceName);
      updateSourceState(sourceName, { aiResult: response });
    } catch (err) {
      updateSourceState(sourceName, { error: err.response?.data?.error || `Failed to process ${sourceName} with AI` });
    } finally {
      updateSourceState(sourceName, { loadingAction: null });
    }
  };

  // Trigger Shopify publish for a single source
  const handlePublishShopify = async (sourceName) => {
    updateSourceState(sourceName, { loadingAction: "shopify", error: null, shopifyResult: null });
    try {
      const response = await publishShopify(sourceName); // Pass sourceName to API
      updateSourceState(sourceName, { shopifyResult: response });
    } catch (err) {
      updateSourceState(sourceName, { error: err.response?.data?.error || `Failed to publish ${sourceName} to Shopify` });
    } finally {
      updateSourceState(sourceName, { loadingAction: null });
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      <Typography variant="h4" gutterBottom>Scraping Control</Typography>

      {/* Sources List with Actions */}
      {loadingSources ? (
        <CircularProgress />
      ) : sourceStates.globalError ? (
        <Alert severity="error">{sourceStates.globalError}</Alert>
      ) : (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>Available Sources</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>URL</TableCell>
                  <TableCell>Scraper</TableCell>
                  <TableCell>Schedule</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sources.map((source) => {
                  const state = sourceStates[source.name] || {};
                  return (
                    <React.Fragment key={source.name}>
                      <TableRow>
                        <TableCell>{source.name}</TableCell>
                        <TableCell>
                          <a href={source.url} target="_blank" rel="noopener noreferrer">{source.url}</a>
                        </TableCell>
                        <TableCell>{source.scraperFile}</TableCell>
                        <TableCell>{source.cronSchedule || "Manual"}</TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", gap: 1 }}>
                            <Button
                              variant="contained"
                              color="primary"
                              size="small"
                              onClick={() => handleScrape(source.name)}
                              disabled={state.loadingAction !== null}
                            >
                              {state.loadingAction === "scrape" ? <CircularProgress size={20} /> : "Scrape"}
                            </Button>
                            <Button
                              variant="contained"
                              color="info"
                              size="small"
                              onClick={() => handleProcessAI(source.name)}
                              disabled={state.loadingAction !== null}
                            >
                              {state.loadingAction === "ai" ? <CircularProgress size={20} /> : "Process AI"}
                            </Button>
                            <Button
                              variant="contained"
                              color="secondary"
                              size="small"
                              onClick={() => handlePublishShopify(source.name)}
                              disabled={state.loadingAction !== null}
                            >
                              {state.loadingAction === "shopify" ? <CircularProgress size={20} /> : "Send to Shopify"}
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                      {/* Results and Errors for this Source */}
                      {state.error && (
                        <TableRow>
                          <TableCell colSpan={5}>
                            <Alert severity="error">{state.error}</Alert>
                          </TableCell>
                        </TableRow>
                      )}
                      {state.scrapeResult && (
                        <TableRow>
                          <TableCell colSpan={5}>
                            <Typography variant="body2">
                              {state.scrapeResult.message} | New: {state.scrapeResult.newArticlesCount} | Updated: {state.scrapeResult.updatedArticlesCount}
                            </Typography>
                            {state.scrapeResult.articles.length > 0 && (
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Title</TableCell>
                                    <TableCell>Link</TableCell>
                                    <TableCell>Published At</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {state.scrapeResult.articles.map((article) => (
                                    <TableRow key={article.uuid}>
                                      <TableCell>{article.title}</TableCell>
                                      <TableCell>
                                        <a href={article.link} target="_blank" rel="noopener noreferrer">{article.link.substring(0, 30)}...</a>
                                      </TableCell>
                                      <TableCell>{new Date(article.publishedAt).toLocaleDateString()}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                      {state.aiResult && (
                        <TableRow>
                          <TableCell colSpan={5}>
                            <Typography variant="body2">
                              {state.aiResult.message} | Processed: {state.aiResult.processedCount}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                      {state.shopifyResult && (
                        <TableRow>
                          <TableCell colSpan={5}>
                            <Typography variant="body2">
                              {state.shopifyResult.message}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
};

export default ScrapingPage;