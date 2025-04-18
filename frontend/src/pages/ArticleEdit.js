import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Grid,
  IconButton,
  Snackbar,
  Alert,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { useArticles } from "../hooks/useArticles";
import { ARTICLE_CATEGORIES } from "../utils/constants";
import { formatDate } from "../utils/formatDate";
import { processSingleArticleWithAI } from "../services/api";

const formatDateForInput = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const ArticleEdit = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { from = "/home", filters = {} } = location.state || {};
  const { fetchArticleById, updateArticleById, pushToShopify, editArticleOnShopify, loadingArticle, loadingUpdate, loadingPush, error } = useArticles();
  const [article, setArticle] = useState(null);
  const [originalArticle, setOriginalArticle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [aiProcessing, setAiProcessing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const loadArticle = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log("Loading article for UUID:", uuid);
      const data = await fetchArticleById(uuid);
      if (data) {
        setArticle(data);
        setOriginalArticle(JSON.parse(JSON.stringify(data)));
      } else {
        console.warn("No article data returned for UUID:", uuid);
      }
    } catch (err) {
      console.error("Error loading article:", err);
    } finally {
      setIsLoading(false);
    }
  }, [uuid, fetchArticleById]);

  useEffect(() => {
    loadArticle();
  }, [loadArticle]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === "checkbox" ? checked : value;
    if (name === "publishedAt") newValue = value ? new Date(value) : null;
    setArticle((prev) => {
      const updatedArticle = { ...prev, [name]: newValue };
      setHasChanges(JSON.stringify(updatedArticle) !== JSON.stringify(originalArticle));
      return updatedArticle;
    });
  }, [originalArticle]);

  const handleTagsChange = useCallback((e) => {
    const tags = e.target.value;
    const newTags = typeof tags === "string" ? tags.split(",").map((tag) => tag.trim()) : tags;
    setArticle((prev) => {
      const updatedArticle = { ...prev, tags: newTags };
      setHasChanges(JSON.stringify(updatedArticle) !== JSON.stringify(originalArticle));
      return updatedArticle;
    });
  }, [originalArticle]);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateArticleById(uuid, article);
      setOriginalArticle(JSON.parse(JSON.stringify(article)));
      setHasChanges(false);
      setSnackbar({ open: true, message: "Article saved successfully!", severity: "success" });
      navigate(from, { state: { filters } });
    } catch (err) {
      setSnackbar({ open: true, message: "Failed to save article.", severity: "error" });
    }
  };

  const handlePushToShopify = async () => {
    try {
      const result = await pushToShopify(uuid);
      setSnackbar({ open: true, message: "Article pushed to Shopify successfully!", severity: "success" });
      const updatedArticle = await fetchArticleById(uuid);
      setArticle(updatedArticle);
      setOriginalArticle(JSON.parse(JSON.stringify(updatedArticle)));
      setHasChanges(false);
    } catch (err) {
      setSnackbar({ open: true, message: err.message || "Failed to push article to Shopify.", severity: "error" });
    }
  };

  const handleEditOnShopify = async () => {
    try {
      const result = await editArticleOnShopify(uuid, article);
      setSnackbar({ open: true, message: "Article edited on Shopify successfully!", severity: "success" });
      const updatedArticle = await fetchArticleById(uuid);
      setArticle(updatedArticle);
      setOriginalArticle(JSON.parse(JSON.stringify(updatedArticle)));
      setHasChanges(false);
    } catch (err) {
      setSnackbar({ open: true, message: "Failed to edit article on Shopify.", severity: "error" });
    }
  };

  const handleProcessWithAI = async () => {
    setAiProcessing(true);
    try {
      const result = await processSingleArticleWithAI(uuid);
      setSnackbar({ open: true, message: "Article processed with AI successfully!", severity: "success" });
      const updatedArticle = await fetchArticleById(uuid);
      setArticle(updatedArticle);
      setOriginalArticle(JSON.parse(JSON.stringify(updatedArticle)));
      setHasChanges(false);
    } catch (err) {
      setSnackbar({ open: true, message: "Failed to process article with AI.", severity: "error" });
    } finally {
      setAiProcessing(false);
    }
  };

  if (isLoading || loadingArticle) return <LoadingSpinner />;
  if (error) return <Box sx={{ p: 3 }}><Typography color="error">{error}<br />UUID: {uuid}</Typography></Box>;
  if (!article) return <Typography>No article data available.</Typography>;

  return (
    <Box sx={{ p: 2, maxWidth: 1200, mx: "auto", height: "100vh", overflow: "auto" }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <IconButton onClick={() => navigate(from, { state: { filters } })} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4">Edit Article</Typography>
      </Box>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField label="UUID" name="uuid" value={article.uuid || ""} fullWidth InputProps={{ readOnly: true }} variant="outlined" size="small" />
            <TextField label="Title" name="title" value={article.title || ""} onChange={handleChange} fullWidth variant="outlined" required size="small" sx={{ mt: 2 }} />
            <TextField label="Link" name="link" value={article.link || ""} onChange={handleChange} fullWidth variant="outlined" required size="small" sx={{ mt: 2 }} />
            <TextField label="Source" name="source" value={article.source || ""} onChange={handleChange} fullWidth variant="outlined" required size="small" sx={{ mt: 2 }} />
            <TextField label="Domain" name="domain" value={article.domain || ""} onChange={handleChange} fullWidth variant="outlined" required size="small" sx={{ mt: 2 }} />
            <TextField label="Published At" name="publishedAt" value={formatDateForInput(article.publishedAt)} onChange={handleChange} fullWidth variant="outlined" type="datetime-local" InputLabelProps={{ shrink: true }} size="small" sx={{ mt: 2 }} />
            <TextField label="Description" name="description" value={article.description || ""} onChange={handleChange} fullWidth variant="outlined" multiline rows={2} size="small" sx={{ mt: 2 }} />
            <TextField label="Improved Description" name="improvedDescription" value={article.improvedDescription || ""} onChange={handleChange} fullWidth variant="outlined" multiline rows={2} size="small" sx={{ mt: 2 }} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField label="SEO Title" name="seoTitle" value={article.seoTitle || ""} onChange={handleChange} fullWidth variant="outlined" size="small" />
            <TextField label="SEO Description" name="seoDescription" value={article.seoDescription || ""} onChange={handleChange} fullWidth variant="outlined" inputProps={{ maxLength: 150 }} helperText={`${(article.seoDescription || "").length}/150`} size="small" sx={{ mt: 2 }} />
            <TextField label="Image URL" name="imageUrl" value={article.imageUrl || ""} onChange={handleChange} fullWidth variant="outlined" size="small" sx={{ mt: 2 }} />
            <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
              <TextField label="Image Width" name="imageWidth" value={article.imageWidth || ""} onChange={handleChange} variant="outlined" type="number" size="small" sx={{ flex: 1 }} />
              <TextField label="Image Height" name="imageHeight" value={article.imageHeight || ""} onChange={handleChange} variant="outlined" type="number" size="small" sx={{ flex: 1 }} />
            </Box>
            <FormControl fullWidth variant="outlined" size="small" sx={{ mt: 2 }}>
              <InputLabel>Category</InputLabel>
              <Select name="category" value={article.category || ""} onChange={handleChange} label="Category">
                <MenuItem value=""><em>None</em></MenuItem> {/* Allow empty selection */}
                {ARTICLE_CATEGORIES.map((cat) => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Geotag" name="geotag" value={article.geotag || ""} onChange={handleChange} fullWidth variant="outlined" size="small" sx={{ mt: 2 }} />
            <FormControl fullWidth variant="outlined" size="small" sx={{ mt: 2 }}>
              <InputLabel>Tags</InputLabel>
              <OutlinedInput name="tags" value={article.tags ? article.tags.join(", ") : ""} onChange={handleTagsChange} label="Tags" />
            </FormControl>
            <TextField label="Shopify Metaobject ID" name="shopifyMetaobjectId" value={article.shopifyMetaobjectId || ""} fullWidth InputProps={{ readOnly: true }} variant="outlined" size="small" sx={{ mt: 2 }} />
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2 }}>
              <Box sx={{ display: "flex", gap: 1 }}>
                <FormControl fullWidth variant="outlined" size="small" sx={{ maxWidth: 200 }}>
                  <InputLabel>Moderation Status</InputLabel>
                  <Select name="moderationStatus" value={article.moderationStatus || "scraped"} onChange={handleChange} label="Moderation Status">
                    <MenuItem value="scraped">Scraped</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                    <MenuItem value="aiProcessed">AI Processed</MenuItem>
                    <MenuItem value="sentToShopify">Sent to Shopify</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ display: "flex", gap: 1 }}>
                <TextField label="Created At" value={article.createdAt ? formatDate(article.createdAt) : ""} InputProps={{ readOnly: true }} variant="outlined" size="small" sx={{ width: 180 }} />
                <TextField label="Updated At" value={article.updatedAt ? formatDate(article.updatedAt) : ""} InputProps={{ readOnly: true }} variant="outlined" size="small" sx={{ width: 180 }} />
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 1, mt: 2, flexWrap: "wrap" }}>
              <Button type="submit" variant="contained" color="primary" disabled={loadingUpdate || !hasChanges}>Save</Button>
              <Button variant="contained" color="secondary" onClick={handlePushToShopify} disabled={loadingPush || article.moderationStatus === "sentToShopify" || article.moderationStatus === "rejected"}>Push to Shopify</Button>
              <Button variant="contained" color="warning" onClick={handleEditOnShopify} disabled={loadingPush || article.moderationStatus !== "sentToShopify"}>Edit on Shopify</Button>
              <Button variant="contained" color="info" onClick={handleProcessWithAI} disabled={aiProcessing || article.moderationStatus !== "scraped"}>Process with AI</Button>
            </Box>
          </Grid>
        </Grid>
      </form>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ArticleEdit;