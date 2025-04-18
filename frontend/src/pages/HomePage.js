import React, { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  FormControlLabel,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Snackbar,
  Alert,
} from "@mui/material";
import ArticleCard from "../components/common/ArticleCard";
import CategoryBar from "../components/common/CategoryBar";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { useArticles } from "../hooks/useArticles";
import { CATEGORIES } from "../utils/constants";

const HomePage = () => {
  const location = useLocation();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [filterScraped, setFilterScraped] = useState(undefined);
  const [filterRejected, setFilterRejected] = useState(undefined);
  const [filterAIProcessed, setFilterAIProcessed] = useState(undefined);
  const [filterSentToShopify, setFilterSentToShopify] = useState(undefined);
  const [selectedSource, setSelectedSource] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const { articles, loadingArticles, error, fetchArticles, updateArticleById } = useArticles();

  useEffect(() => {
    const { filters } = location.state || {};
    if (filters) {
      setFilterScraped(filters.moderationStatus === "scraped" ? true : undefined);
      setFilterRejected(filters.moderationStatus === "rejected" ? true : undefined);
      setFilterAIProcessed(filters.moderationStatus === "aiProcessed" ? true : undefined);
      setFilterSentToShopify(filters.moderationStatus === "sentToShopify" ? true : undefined);
    }
  }, [location.state]);

  const filters = useMemo(() => {
    const include = [];
    const exclude = [];
    if (filterScraped === true) include.push("scraped");
    else if (filterScraped === false) exclude.push("scraped");
    if (filterRejected === true) include.push("rejected");
    else if (filterRejected === false) exclude.push("rejected");
    if (filterAIProcessed === true) include.push("aiProcessed");
    else if (filterAIProcessed === false) exclude.push("aiProcessed");
    if (filterSentToShopify === true) include.push("sentToShopify");
    else if (filterSentToShopify === false) exclude.push("sentToShopify");
    const moderationStatusFilter = {};
    if (include.length > 0) moderationStatusFilter.$in = include;
    if (exclude.length > 0) moderationStatusFilter.$nin = exclude;
    return {
      moderationStatus: Object.keys(moderationStatusFilter).length > 0 ? moderationStatusFilter : undefined,
      source: selectedSource || undefined,
      search: appliedSearch || undefined,
    };
  }, [filterScraped, filterRejected, filterAIProcessed, filterSentToShopify, selectedSource, appliedSearch]);

  useEffect(() => {
    fetchArticles(filters);
  }, [fetchArticles, filters]);

  const filteredArticles = useMemo(() => {
    let result = articles;
    if (selectedCategory) {
      result = result.filter((a) => a.category === selectedCategory);
    }
    return result;
  }, [articles, selectedCategory]);

  const sources = useMemo(() => [...new Set(articles.map((a) => a.source))], [articles]);

  const handleSelectCategory = (category) => {
    setSelectedCategory(category === selectedCategory ? null : category);
  };

  const toggleFilter = (setter) => () =>
    setter((prev) => (prev === undefined ? true : prev === true ? false : undefined));

  const handleSourceChange = (event) => setSelectedSource(event.target.value);

  const handleSearchChange = (event) => setSearchTerm(event.target.value);

  const handleSearchSubmit = (event) => {
    if (event.key === "Enter") {
      setAppliedSearch(searchTerm);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleRejectArticle = async (uuid) => {
    try {
      await updateArticleById(uuid, { moderationStatus: "rejected" });
      setSnackbar({ open: true, message: "Article rejected successfully!", severity: "success" });
    } catch (err) {
      setSnackbar({ open: true, message: "Failed to reject article.", severity: "error" });
      console.error("Failed to reject article:", err);
    }
  };

  const getCheckboxIcon = (value) => (value === undefined ? "-" : value ? "✔️" : "❌");

  if (loadingArticles) return <LoadingSpinner />;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto", p: 3 }}>
      <Box sx={{ position: "sticky", top: 64, zIndex: 1000, backgroundColor: "background.paper", py: 1 }}>
        <CategoryBar
          categories={CATEGORIES}
          onSelectCategory={handleSelectCategory}
          selectedCategory={selectedCategory}
        />
      </Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, my: 2 }}>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
          <TextField
            label="Search Articles"
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleSearchSubmit}
            variant="outlined"
            size="small"
            placeholder="e.g., Drinks, brew guides"
            sx={{ minWidth: 200 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={filterScraped !== undefined}
                indeterminate={filterScraped === false}
                onChange={toggleFilter(setFilterScraped)}
                icon={<span>{getCheckboxIcon(filterScraped)}</span>}
                checkedIcon={<span>{getCheckboxIcon(filterScraped)}</span>}
                indeterminateIcon={<span>{getCheckboxIcon(filterScraped)}</span>}
              />
            }
            label="Scraped"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={filterRejected !== undefined}
                indeterminate={filterRejected === false}
                onChange={toggleFilter(setFilterRejected)}
                icon={<span>{getCheckboxIcon(filterRejected)}</span>}
                checkedIcon={<span>{getCheckboxIcon(filterRejected)}</span>}
                indeterminateIcon={<span>{getCheckboxIcon(filterRejected)}</span>}
              />
            }
            label="Rejected"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={filterAIProcessed !== undefined}
                indeterminate={filterAIProcessed === false}
                onChange={toggleFilter(setFilterAIProcessed)}
                icon={<span>{getCheckboxIcon(filterAIProcessed)}</span>}
                checkedIcon={<span>{getCheckboxIcon(filterAIProcessed)}</span>}
                indeterminateIcon={<span>{getCheckboxIcon(filterAIProcessed)}</span>}
              />
            }
            label="AI Processed"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={filterSentToShopify !== undefined}
                indeterminate={filterSentToShopify === false}
                onChange={toggleFilter(setFilterSentToShopify)}
                icon={<span>{getCheckboxIcon(filterSentToShopify)}</span>}
                checkedIcon={<span>{getCheckboxIcon(filterSentToShopify)}</span>}
                indeterminateIcon={<span>{getCheckboxIcon(filterSentToShopify)}</span>}
              />
            }
            label="Sent to Shopify"
          />
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Source</InputLabel>
            <Select value={selectedSource} onChange={handleSourceChange} label="Source">
              <MenuItem value="">All Sources</MenuItem>
              {sources.map((source) => (
                <MenuItem key={source} value={source}>{source}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Typography variant="h6">Total Articles: {filteredArticles.length}</Typography>
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: 3, py: 3 }}>
        {filteredArticles.length > 0 ? (
          filteredArticles.map((article) => (
            <ArticleCard
              key={article.uuid}
              article={article}
              filters={filters}
              from="/home"
              onReject={handleRejectArticle}
            />
          ))
        ) : (
          <Typography sx={{ textAlign: "center", color: "text.secondary", mt: 3 }}>
            {selectedCategory ||
            filterScraped !== undefined ||
            filterRejected !== undefined ||
            filterAIProcessed !== undefined ||
            filterSentToShopify !== undefined ||
            selectedSource ||
            appliedSearch
              ? "No articles found for this filter or search."
              : "No articles available. Try scraping some articles from the Scraping page."}
          </Typography>
        )}
      </Box>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default HomePage;