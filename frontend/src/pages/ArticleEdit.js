import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
} from '@mui/material';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useArticles } from '../hooks/useArticles';
import { ARTICLE_CATEGORIES } from '../utils/constants';
import { formatDate } from '../utils/formatDate';

const ArticleEdit = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const { fetchArticleById, updateArticleById, loading, error } = useArticles();
  const [article, setArticle] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Local loading state to prevent flicker

  useEffect(() => {
    const loadArticle = async () => {
      setIsLoading(true);
      const data = await fetchArticleById(uuid);
      if (data) {
        setArticle(data);
      }
      setIsLoading(false);
    };
    loadArticle();
  }, [uuid, fetchArticleById]); // Dependencies are now stable

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setArticle((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
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
    await updateArticleById(uuid, article);
    navigate('/');
  };

  if (isLoading || loading) return <LoadingSpinner />;
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
      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* UUID (Read-only) */}
          <TextField
            label="UUID"
            name="uuid"
            value={article.uuid || ''}
            fullWidth
            InputProps={{ readOnly: true }}
            variant="outlined"
          />

          {/* Title */}
          <TextField
            label="Title"
            name="title"
            value={article.title || ''}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            required
          />

          {/* Link */}
          <TextField
            label="Link"
            name="link"
            value={article.link || ''}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            required
          />

          {/* Source */}
          <TextField
            label="Source"
            name="source"
            value={article.source || ''}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            required
          />

          {/* Domain */}
          <TextField
            label="Domain"
            name="domain"
            value={article.domain || ''}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            required
          />

          {/* Published At */}
          <TextField
            label="Published At"
            name="publishedAt"
            value={article.publishedAt ? formatDate(article.publishedAt) : ''}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            type="datetime-local"
            InputLabelProps={{ shrink: true }}
          />

          {/* Description */}
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

          {/* Improved Description */}
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

          {/* Image URL */}
          <TextField
            label="Image URL"
            name="imageUrl"
            value={article.imageUrl || ''}
            onChange={handleChange}
            fullWidth
            variant="outlined"
          />

          {/* Image Width */}
          <TextField
            label="Image Width"
            name="imageWidth"
            value={article.imageWidth || ''}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            type="number"
          />

          {/* Image Height */}
          <TextField
            label="Image Height"
            name="imageHeight"
            value={article.imageHeight || ''}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            type="number"
          />

          {/* Category */}
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

          {/* Geotag */}
          <TextField
            label="Geotag"
            name="geotag"
            value={article.geotag || ''}
            onChange={handleChange}
            fullWidth
            variant="outlined"
          />

          {/* Tags */}
          <FormControl fullWidth variant="outlined">
            <InputLabel>Tags (comma-separated)</InputLabel>
            <OutlinedInput
              name="tags"
              value={article.tags ? article.tags.join(', ') : ''}
              onChange={handleTagsChange}
              label="Tags (comma-separated)"
            />
          </FormControl>

          {/* Sent to Shopify */}
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

          {/* Timestamps (Read-only) */}
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

          {/* Submit Button */}
          <Button type="submit" variant="contained" color="primary">
            Save
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default ArticleEdit;