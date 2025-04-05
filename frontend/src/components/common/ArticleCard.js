import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Chip,
  Box,
} from '@mui/material';
import { formatDate } from '../../utils/formatDate';

const ArticleCard = ({ article }) => {
  const navigate = useNavigate();
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
    domain,
    sentToShopify,
  } = article;

  const formattedDate = formatDate(publishedAt);

  const handleClick = () => {
    navigate(`/article/edit/${uuid}`);
  };

  const hasDimensions = imageWidth && imageHeight;
  const aspectRatio = hasDimensions ? imageWidth / imageHeight : null;

  return (
    <Card sx={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }} onClick={handleClick}>
      {imageUrl && (
        <CardMedia
          component="img"
          image={imageUrl}
          alt={title}
          sx={{
            width: '100%',
            height: hasDimensions ? undefined : 150,
            aspectRatio: hasDimensions ? aspectRatio : undefined,
            objectFit: hasDimensions ? 'contain' : 'contain',
            backgroundColor: '#f0f0f0',
            maxHeight: 150,
          }}
        />
      )}
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Chip label={category} color="primary" size="small" />
          {geotag && <Chip label={geotag} color="secondary" size="small" />}
          {tags &&
            tags.length > 0 &&
            tags.map((tag) => (
              <Chip key={tag} label={tag} size="small" variant="outlined" />
            ))}
        </Box>
        <Typography variant="h3" gutterBottom sx={{ mb: 2, fontSize: '1.1rem' }}>
          {title}
        </Typography>
        {(improvedDescription || description) && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              lineHeight: 1.6,
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
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1,
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
            {source} • {domain} • {formattedDate}
          </Typography>
          <Typography
            variant="caption"
            color={sentToShopify ? 'primary.main' : 'error.main'}
            sx={{ flexShrink: 0 }}
          >
            {sentToShopify ? 'Published to Shopify' : 'Not Published'}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ArticleCard;