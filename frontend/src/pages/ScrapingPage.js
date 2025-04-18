import React, { useState, useEffect } from "react";
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Tooltip, Snackbar, Alert,
} from "@mui/material";
import { triggerScrape, processWithAI, publishShopify, getScrapers, createScraper } from "../services/api";
import { LocalizationProvider, TimePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

const ScrapingPage = () => {
  const [sources, setSources] = useState([]);
  const [loadingSources, setLoadingSources] = useState(true);
  const [sourceStates, setSourceStates] = useState({});
  const [openModal, setOpenModal] = useState(false);
  const [newScraper, setNewScraper] = useState({ name: "", type: "", url: "", cronSchedule: null });
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    const fetchSources = async () => {
      setLoadingSources(true);
      try {
        const fetchedSources = await getScrapers();
        setSources(fetchedSources);
        setSourceStates(fetchedSources.reduce((acc, source) => ({
          ...acc,
          [source.name]: { loadingAction: null, error: null, scrapeResult: null, aiResult: null, shopifyResult: null },
        }), {}));
      } catch (err) {
        setSourceStates({ globalError: "Failed to fetch scrapers: " + (err.response?.data?.error || err.message) });
      } finally {
        setLoadingSources(false);
      }
    };
    fetchSources();
  }, []);

  const updateSourceState = (sourceName, updates) => {
    setSourceStates((prev) => ({ ...prev, [sourceName]: { ...prev[sourceName], ...updates } }));
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleScrape = async (sourceName) => {
    updateSourceState(sourceName, { loadingAction: "scrape", error: null, scrapeResult: null });
    try {
      const response = await triggerScrape(sourceName);
      updateSourceState(sourceName, { scrapeResult: response });
      setSnackbar({ open: true, message: `Scrape completed for ${sourceName}! New: ${response.newArticlesCount}, Updated: ${response.updatedArticlesCount}`, severity: "success" });
    } catch (err) {
      updateSourceState(sourceName, { error: err.response?.data?.error || `Failed to scrape ${sourceName}` });
      setSnackbar({ open: true, message: `Failed to scrape ${sourceName}.`, severity: "error" });
    } finally {
      updateSourceState(sourceName, { loadingAction: null });
    }
  };

  const handleProcessAI = async (sourceName) => {
    updateSourceState(sourceName, { loadingAction: "ai", error: null, aiResult: null });
    try {
      const response = await processWithAI(sourceName);
      updateSourceState(sourceName, { aiResult: response });
      setSnackbar({ open: true, message: `AI processing completed for ${sourceName}! Processed: ${response.processedCount}`, severity: "success" });
    } catch (err) {
      updateSourceState(sourceName, { error: err.response?.data?.error || `Failed to process ${sourceName} with AI` });
      setSnackbar({ open: true, message: `Failed to process ${sourceName} with AI.`, severity: "error" });
    } finally {
      updateSourceState(sourceName, { loadingAction: null });
    }
  };

  const handlePublishShopify = async (sourceName) => {
    updateSourceState(sourceName, { loadingAction: "shopify", error: null, shopifyResult: null });
    try {
      const response = await publishShopify(sourceName);
      updateSourceState(sourceName, { shopifyResult: response });
      setSnackbar({ open: true, message: `Shopify publishing completed for ${sourceName || "all sources"}!`, severity: "success" });
    } catch (err) {
      updateSourceState(sourceName, { error: err.response?.data?.error || `Failed to publish ${sourceName} to Shopify` });
      setSnackbar({ open: true, message: `Failed to publish ${sourceName || "all sources"} to Shopify.`, severity: "error" });
    } finally {
      updateSourceState(sourceName, { loadingAction: null });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!newScraper.name || !/^[a-zA-Z]+$/.test(newScraper.name)) newErrors.name = "Name must be letters only, no spaces or special characters";
    if (!newScraper.type) newErrors.type = "Type is required";
    if (!newScraper.url || !/^(https?:\/\/[^\s$.?#].[^\s]*)$/.test(newScraper.url)) newErrors.url = "Valid URL is required";
    if (!newScraper.cronSchedule) newErrors.cronSchedule = "Time is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateScraper = async () => {
    if (!validateForm()) return;
    const cronSchedule = dayjs(newScraper.cronSchedule).format("0 H * * *");
    try {
      const scraperData = { ...newScraper, cronSchedule };
      const response = await createScraper(scraperData);
      setSources((prev) => [...prev, response.scraper]);
      setOpenModal(false);
      setNewScraper({ name: "", type: "", url: "", cronSchedule: null });
      setErrors({});
      setSnackbar({ open: true, message: `Scraper ${response.scraper.name} created successfully!`, severity: "success" });
    } catch (err) {
      setErrors({ submit: err.response?.data?.error || "Failed to create scraper" });
      setSnackbar({ open: true, message: "Failed to create scraper.", severity: "error" });
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      <Typography variant="h4" gutterBottom>Scraping Control</Typography>
      <Button variant="contained" color="primary" onClick={() => setOpenModal(true)} sx={{ mb: 3 }}>
        Create a New Scraper
      </Button>
      {loadingSources ? (
        <CircularProgress />
      ) : sourceStates.globalError ? (
        <Alert severity="error">{sourceStates.globalError}</Alert>
      ) : (
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
                      <TableCell><a href={source.url} target="_blank" rel="noopener noreferrer">{source.url}</a></TableCell>
                      <TableCell>{source.scraperFile}</TableCell>
                      <TableCell>{source.cronSchedule || "Manual"}</TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Button variant="contained" color="primary" size="small" onClick={() => handleScrape(source.name)} disabled={state.loadingAction !== null}>
                            {state.loadingAction === "scrape" ? <CircularProgress size={20} /> : "Scrape"}
                          </Button>
                          <Button variant="contained" color="info" size="small" onClick={() => handleProcessAI(source.name)} disabled={state.loadingAction !== null}>
                            {state.loadingAction === "ai" ? <CircularProgress size={20} /> : "Process AI"}
                          </Button>
                          <Button variant="contained" color="secondary" size="small" onClick={() => handlePublishShopify(source.name)} disabled={state.loadingAction !== null}>
                            {state.loadingAction === "shopify" ? <CircularProgress size={20} /> : "Send to Shopify"}
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                    {state.error && (
                      <TableRow>
                        <TableCell colSpan={5}><Alert severity="error">{state.error}</Alert></TableCell>
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
                                    <TableCell><a href={article.link} target="_blank" rel="noopener noreferrer">{article.link.substring(0, 30)}...</a></TableCell>
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
                        <TableCell colSpan={5}><Typography variant="body2">{state.aiResult.message} | Processed: {state.aiResult.processedCount}</Typography></TableCell>
                      </TableRow>
                    )}
                    {state.shopifyResult && (
                      <TableRow>
                        <TableCell colSpan={5}><Typography variant="body2">{state.shopifyResult.message}</Typography></TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <Dialog open={openModal} onClose={() => setOpenModal(false)}>
        <DialogTitle>Create a New Scraper</DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            value={newScraper.name}
            onChange={(e) => setNewScraper({ ...newScraper, name: e.target.value })}
            fullWidth
            margin="normal"
            error={!!errors.name}
            helperText={errors.name}
            inputProps={{ pattern: "[a-zA-Z]+" }}
            InputProps={{ endAdornment: <Tooltip title="Letters only, no spaces or special characters"><span>ℹ️</span></Tooltip> }}
          />
          <FormControl fullWidth margin="normal" error={!!errors.type}>
            <InputLabel>Type</InputLabel>
            <Select value={newScraper.type} onChange={(e) => setNewScraper({ ...newScraper, type: e.target.value })} label="Type">
              <MenuItem value="rss">RSS</MenuItem>
              <MenuItem value="html">HTML</MenuItem>
              <MenuItem value="api">API</MenuItem>
            </Select>
            {errors.type && <Typography color="error" variant="caption">{errors.type}</Typography>}
            <Tooltip title="Select the type of scraper"><Typography variant="caption">ℹ️</Typography></Tooltip>
          </FormControl>
          <TextField
            label="URL"
            value={newScraper.url}
            onChange={(e) => setNewScraper({ ...newScraper, url: e.target.value })}
            fullWidth
            margin="normal"
            error={!!errors.url}
            helperText={errors.url}
            InputProps={{ endAdornment: <Tooltip title="Enter a valid URL (e.g., https://example.com)"><span>ℹ️</span></Tooltip> }}
          />
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <TimePicker
              label="Schedule"
              value={newScraper.cronSchedule}
              onChange={(newValue) => setNewScraper({ ...newScraper, cronSchedule: newValue })}
              renderInput={(params) => (
                <TextField {...params} fullWidth margin="normal" error={!!errors.cronSchedule} helperText={errors.cronSchedule} />
              )}
            />
          </LocalizationProvider>
          <TextField
            label="Scraper File"
            value={`${newScraper.name}Scraper`}
            fullWidth
            margin="normal"
            InputProps={{ readOnly: true, endAdornment: <Tooltip title="Automatically generated as name + 'Scraper'"><span>ℹ️</span></Tooltip> }}
          />
          {errors.submit && <Alert severity="error">{errors.submit}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Cancel</Button>
          <Button onClick={handleCreateScraper} variant="contained" color="primary">Create</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ScrapingPage;