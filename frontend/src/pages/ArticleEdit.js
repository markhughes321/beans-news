import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
  Select,
  FormControlLabel,
  Checkbox,
  OutlinedInput,
  Alert,
} from '@mui/material';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useArticles } from '../hooks/useArticles';
import { ARTICLE_CATEGORIES } from '../utils/constants';
import { formatDate } from '../utils/formatDate';

const formatDateForInput = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const ArticleEdit = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchArticleById, updateArticleById, pushToShopify, loadingArticle, loadingUpdate, loadingPush, error } = useArticles();
  const [article, setArticle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shopifyMessage, setShopifyMessage] = useState('');
  const [shopifyError, setShopifyError] = useState(null);

  const { from = '/home', filters = {} } = location.state || {};

  useEffect(() => {
    const loadArticle = async () => {
      setIsLoading(true);
      const data = await fetchArticleById(uuid);
      if (data) setArticle(data);
      setIsLoading(false);
    };
    loadArticle();
  }, [uuid, fetchArticleById]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'publishedAt') {
      setArticle((prev) => ({
        ...prev,
        [name]: value ? new Date(value) : null,
      }));
    } else {
      setArticle((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleTagsChange = (e) => {
    const tags = e.target.value;
    setArticle((prev) => ({
      ...prev,
      tags: typeof tags === 'string' ? tags.split(',').map((tag) => tag.trim()) : tags,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateArticleById(uuid, article);
      navigate(from, { state: { filters } });
    } catch (err) {
      setShopifyError('Failed to save article');
      console.error(err);
    }
  };

  const handlePushToShopify = async () => {
    setShopifyMessage('');
    setShopifyError(null);
    try {
      const result = await pushToShopify(uuid);
      setShopifyMessage(result.message);
    } catch (err) {
      setShopifyError('Failed to push article to Shopify');
      console.error(err);
    }
  };

  if (isLoading || loadingArticle) return <LoadingSpinner />;
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">
          {error}
          <br />
          UUID: {uuid}
        </Typography>
      </Box>
    );
  }
  if (!article) return <Typography>No article data available.</Typography>;

  return (
    <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Edit Article
      </Typography>
      {shopifyMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {shopifyMessage}
        </Alert>
      )}
      {shopifyError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {shopifyError}
        </Alert>
      )}
      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField
            label="UUID"
            name="uuid"
            value={article.uuid || ''}
            fullWidth
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
          <TextField
            label="Title"
            name="title"
            value={article.title || ''}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            required
          />
          <TextField
            label="Link"
            name="link"
            value={article.link || ''}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            required
          />
          <TextField
            label="Source"
            name="source"
            value={article.source || ''}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            required
          />
          <TextField
            label="Domain"
            name="domain"
            value={article.domain || ''}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            required
          />
          <TextField
            label="Published At"
            name="publishedAt"
            value={formatDateForInput(article.publishedAt)}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            type="datetime-local"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Description"
            name="description"
            value={article.description || ''}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            multiline
            rows={4}
          />
          <TextField
            label="Improved Description"
            name="improvedDescription"
            value={article.improvedDescription || ''}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            multiline
            rows={4}
          />
          <TextField
            label="SEO Title"
            name="seoTitle"
            value={article.seoTitle || ''}
            onChange={handleChange}
            fullWidth
            variant="outlined"
          />
          <TextField
            label="SEO Description"
            name="seoDescription"
            value={article.seoDescription || ''}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            inputProps={{ maxLength: 150 }}
            helperText={`${(article.seoDescription || '').length}/150 characters`}
          />
          <TextField
            label="Image URL"
            name="imageUrl"
            value={article.imageUrl || ''}
            onChange={handleChange}
            fullWidth
            variant="outlined"
          />
          <TextField
            label="Image Width"
            name="imageWidth"
            value={article.imageWidth || ''}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            type="number"
          />
          <TextField
            label="Image Height"
            name="imageHeight"
            value={article.imageHeight || ''}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            type="number"
          />
          <FormControl fullWidth variant="outlined">
            <InputLabel>Category</InputLabel>
            <Select
              name="category"
              value={article.category || ''}
              onChange={handleChange}
              label="Category"
            >
              {ARTICLE_CATEGORIES.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Geotag"
            name="geotag"
            value={article.geotag || ''}
            onChange={handleChange}
            fullWidth
            variant="outlined"
          />
          <FormControl fullWidth variant="outlined">
            <InputLabel>Tags (comma-separated)</InputLabel>
            <OutlinedInput
              name="tags"
              value={article.tags ? article.tags.join(', ') : ''}
              onChange={handleTagsChange}
              label="Tags (comma-separated)"
            />
          </FormControl>
          <TextField
            label="Shopify Metaobject ID"
            name="shopifyMetaobjectId"
            value={article.shopifyMetaobjectId || ''}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            InputProps={{ readOnly: true }} // Make it read-only as it’s managed by Shopify
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  name="processedByAI"
                  checked={article.processedByAI || false}
                  onChange={handleChange}
                />
              }
              label="Processed by AI"
            />
            <FormControlLabel
              control={
                <Checkbox
                  name="sentToShopify"
                  checked={article.sentToShopify || false}
                  onChange={handleChange}
                />
              }
              label="Sent to Shopify"
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Created At"
              value={article.createdAt ? formatDate(article.createdAt) : ''}
              fullWidth
              InputProps={{ readOnly: true }}
              variant="outlined"
            />
            <TextField
              label="Updated At"
              value={article.updatedAt ? formatDate(article.updatedAt) : ''}
              fullWidth
              InputProps={{ readOnly: true }}
              variant="outlined"
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button type="submit" variant="contained" color="primary" disabled={loadingUpdate}>
              Save
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={handlePushToShopify}
              disabled={loadingPush}
            >
              Push to Shopify
            </Button>
          </Box>
        </Box>
      </form>
    </Box>
  );
};

export default ArticleEdit;