// File: ./frontend/src/components/common/ArticleCard.js
import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { Card, CardMedia, CardContent, Typography, Chip, Box, IconButton, Tooltip } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import BlockIcon from "@mui/icons-material/Block"; // Icon for rejecting
import { formatDate } from "../../utils/formatDate";

const ArticleCard = ({ article, filters, from, onReject }) => {
  const { uuid, title, imageUrl, imageWidth, imageHeight, category, geotag, tags, improvedDescription, description, publishedAt, source, moderationStatus, link } = article;
  const formattedDate = formatDate(publishedAt);
  const hasDimensions = imageWidth && imageHeight;
  const aspectRatio = hasDimensions ? imageWidth / imageHeight : 16 / 9;

  const handleReject = (e) => {
    e.preventDefault(); // Prevent link navigation if clicked
    onReject(uuid);
  };

  return (
    <Card sx={{ display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
      {imageUrl && (
        <Box sx={{ position: "relative" }}>
          <RouterLink to={`/article/edit/${uuid}`} state={{ from, filters }} style={{ textDecoration: "none", color: "inherit" }}>
            <CardMedia component="img" image={imageUrl} alt={title} sx={{ width: "100%", height: 200, objectFit: "cover" }} />
          </RouterLink>
          <Tooltip title="Open Source Article">
            <IconButton href={link} target="_blank" rel="noopener noreferrer" sx={{ position: "absolute", top: 8, right: 8, backgroundColor: "rgba(255, 255, 255, 0.8)", "&:hover": { backgroundColor: "rgba(255, 255, 255, 1)" } }}>
              <OpenInNewIcon fontSize="small" color="primary" />
            </IconButton>
          </Tooltip>
        </Box>
      )}
      <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 1 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            <Chip label={category} color="primary" size="small" />
            {geotag && <Chip label={geotag} color="secondary" size="small" />}
            {tags && tags.length > 0 && tags.map((tag) => <Chip key={tag} label={tag} size="small" variant="outlined" />)}
          </Box>
          <Tooltip title={moderationStatus === "rejected" ? "Article is rejected" : "Reject this article"}>
            <IconButton
              onClick={handleReject}
              disabled={moderationStatus === "rejected"}
              sx={{ color: moderationStatus === "rejected" ? "error.main" : "text.secondary" }}
            >
              <BlockIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <RouterLink to={`/article/edit/${uuid}`} state={{ from, filters }} style={{ textDecoration: "none", color: "inherit" }}>
          <Typography variant="h3" gutterBottom sx={{ fontSize: "1.1rem", fontWeight: 600, lineHeight: 1.3, minHeight: "3rem", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{title}</Typography>
        </RouterLink>
        {(improvedDescription || description) && (
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, flexGrow: 1, minHeight: "3rem", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{improvedDescription || description}</Typography>
        )}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1 }}>
          <Typography variant="caption" color="text.secondary">{source} • {formattedDate}</Typography>
          <Typography variant="caption" color="text.secondary">{moderationStatus}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ArticleCard;