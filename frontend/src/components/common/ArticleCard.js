// File: ./frontend/src/components/common/ArticleCard.js
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Chip,
  Box,
  IconButton,
  Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete'; // Icon for delete
import OpenInNewIcon from '@mui/icons-material/OpenInNew'; // Icon for opening in new tab
import SmartToyIcon from '@mui/icons-material/SmartToy'; // Icon for processedByAI
import StoreIcon from '@mui/icons-material/Store'; // Icon for sentToShopify
import { formatDate } from '../../utils/formatDate';
import { useArticles } from '../../hooks/useArticles'; // To handle delete functionality

const ArticleCard = ({ article, filters, from }) => {
  const {
    uuid,
    title,
    imageUrl,
    imageWidth,
    imageHeight,
    category,
    geotag,
    tags,
    improvedDescription,
    description,
    publishedAt,
    source,
    sentToShopify,
    processedByAI,
    link,
  } = article;

  const { deleteArticleById } = useArticles(); // Hook to delete articles
  const formattedDate = formatDate(publishedAt);

  const hasDimensions = imageWidth && imageHeight;
  const aspectRatio = hasDimensions ? imageWidth / imageHeight : 16 / 9; // Default to 16:9 if no dimensions

  const handleDelete = async () => {
    try {
      await deleteArticleById(uuid);
    } catch (err) {
      console.error('Error deleting article:', err);
    }
  };

  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%', // Ensure consistent height
        position: 'relative', // For absolute positioning of icons
      }}
    >
      {/* Image Section */}
      {imageUrl && (
        <Box sx={{ position: 'relative' }}>
          <RouterLink
            to={`/article/edit/${uuid}`}
            state={{ from, filters }}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <CardMedia
              component="img"
              image={imageUrl}
              alt={title}
              sx={{
                width: '100%',
                height: 200, // Fixed height for consistency
                objectFit: 'cover', // Ensure image covers the container
                backgroundColor: 'transparent', // Remove background color
              }}
            />
          </RouterLink>
          {/* Delete Icon */}
          <Tooltip title="Delete Article">
            <IconButton
              onClick={handleDelete}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 1)',
                },
              }}
            >
              <DeleteIcon fontSize="small" color="error" />
            </IconButton>
          </Tooltip>
          {/* Open in New Tab Icon */}
          <Tooltip title="Open Source Article">
            <IconButton
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                position: 'absolute',
                top: 8,
                right: 48, // Position next to delete icon
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 1)',
                },
              }}
            >
              <OpenInNewIcon fontSize="small" color="primary" />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* Content Section */}
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {/* Chips for Category, Geotag, and Tags */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Chip label={category} color="primary" size="small" />
          {geotag && <Chip label={geotag} color="secondary" size="small" />}
          {tags &&
            tags.length > 0 &&
            tags.map((tag) => (
              <Chip key={tag} label={tag} size="small" variant="outlined" />
            ))}
        </Box>

        {/* Title */}
        <RouterLink
          to={`/article/edit/${uuid}`}
          state={{ from, filters }}
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <Typography
            variant="h3"
            gutterBottom
            sx={{
              fontSize: '1.1rem',
              fontWeight: 600,
              lineHeight: 1.3,
              minHeight: '3rem', // Ensure consistent height for titles
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {title}
          </Typography>
        </RouterLink>

        {/* Description */}
        {(improvedDescription || description) && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              lineHeight: 1.6,
              flexGrow: 1, // Allow description to take available space
              minHeight: '3rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {improvedDescription || description}
          </Typography>
        )}

        {/* Footer with Source, Date, and Status Icons */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 1,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {source} • {formattedDate}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title={processedByAI ? 'Processed by AI' : 'Not Processed by AI'}>
              <SmartToyIcon
                fontSize="small"
                sx={{ color: processedByAI ? 'primary.main' : 'text.disabled' }}
              />
            </Tooltip>
            <Tooltip title={sentToShopify ? 'Sent to Shopify' : 'Not Sent to Shopify'}>
              <StoreIcon
                fontSize="small"
                sx={{ color: sentToShopify ? 'secondary.main' : 'text.disabled' }}
              />
            </Tooltip>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ArticleCard;