import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  FormControlLabel,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import ArticleCard from '../components/common/ArticleCard';
import CategoryBar from '../components/common/CategoryBar';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useArticles } from '../hooks/useArticles';
import { CATEGORIES } from '../utils/constants';

const HomePage = () => {
  const location = useLocation();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [filterAIProcessed, setFilterAIProcessed] = useState(undefined);
  const [filterSentToShopify, setFilterSentToShopify] = useState(undefined);
  const [selectedSource, setSelectedSource] = useState('');

  useEffect(() => {
    const { filters } = location.state || {};
    if (filters) {
      setFilterAIProcessed(filters.processedByAI);
      setFilterSentToShopify(filters.sentToShopify);
    }
  }, [location.state]);

  const filters = useMemo(
    () => ({
      processedByAI: filterAIProcessed,
      sentToShopify: filterSentToShopify,
      source: selectedSource || undefined,
    }),
    [filterAIProcessed, filterSentToShopify, selectedSource]
  );

  const { articles, loadingArticles, error } = useArticles(filters);

  const filteredArticles = selectedCategory
    ? articles.filter((a) => a.category === selectedCategory)
    : articles;

  const sources = useMemo(() => [...new Set(articles.map((a) => a.source))], [articles]);

  const handleSelectCategory = (category) => {
    setSelectedCategory(category === selectedCategory ? null : category);
  };

  const handleFilterAIProcessed = () => {
    setFilterAIProcessed((prev) => {
      if (prev === undefined) return true;
      if (prev === true) return false;
      return undefined;
    });
  };

  const handleFilterSentToShopify = () => {
    setFilterSentToShopify((prev) => {
      if (prev === undefined) return true;
      if (prev === true) return false;
      return undefined;
    });
  };

  const handleSourceChange = (event) => {
    setSelectedSource(event.target.value);
  };

  const getCheckboxIcon = (value) => {
    if (value === undefined) return '-';
    return value ? '✓' : '✗';
  };

  if (loadingArticles) return <LoadingSpinner />;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Total Articles: {filteredArticles.length}
      </Typography>
      <CategoryBar
        categories={CATEGORIES}
        onSelectCategory={handleSelectCategory}
        selectedCategory={selectedCategory}
      />
      <Box sx={{ display: 'flex', gap: 2, my: 2, alignItems: 'center' }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={filterAIProcessed !== undefined}
              indeterminate={filterAIProcessed === false}
              onChange={handleFilterAIProcessed}
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
              onChange={handleFilterSentToShopify}
              icon={<span>{getCheckboxIcon(filterSentToShopify)}</span>}
              checkedIcon={<span>{getCheckboxIcon(filterSentToShopify)}</span>}
              indeterminateIcon={<span>{getCheckboxIcon(filterSentToShopify)}</span>}
            />
          }
          label="Sent to Shopify"
        />
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Source</InputLabel>
          <Select
            value={selectedSource}
            onChange={handleSourceChange}
            label="Source"
          >
            <MenuItem value="">All Sources</MenuItem>
            {sources.map((source) => (
              <MenuItem key={source} value={source}>
                {source}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: 3,
          py: 3,
        }}
      >
        {filteredArticles.length > 0 ? (
          filteredArticles.map((article) => (
            <ArticleCard
              key={article.uuid}
              article={article}
              filters={filters}
              from="/home"
            />
          ))
        ) : (
          <Typography sx={{ textAlign: 'center', color: 'text.secondary', mt: 3 }}>
            {selectedCategory || filterAIProcessed !== undefined || filterSentToShopify !== undefined || selectedSource
              ? 'No articles found for this category or filter.'
              : 'No articles available. Try scraping some articles from the Scraping page.'}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default HomePage;