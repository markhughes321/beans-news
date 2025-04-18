import React, { useMemo, useState } from "react";
import { Typography, Box, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import ArticlesTable from "../components/layout/ArticlesTable";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { useArticles } from "../hooks/useArticles";

const AdminDashboard = () => {
  const [selectedSource, setSelectedSource] = useState("");
  const filters = useMemo(() => {
    return selectedSource ? { source: selectedSource } : {};
  }, [selectedSource]);
  const { articles, loadingArticles, error, bulkEditArticles } = useArticles(filters);
  const sources = useMemo(() => [...new Set(articles.map((a) => a.source))], [articles]);

  const handleSourceChange = (event) => {
    setSelectedSource(event.target.value);
  };

  if (loadingArticles) return <LoadingSpinner />;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Admin Dashboard</Typography>
      <Box sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Source</InputLabel>
          <Select value={selectedSource} onChange={handleSourceChange} label="Source">
            <MenuItem value="">All Sources</MenuItem>
            {sources.map((source) => (
              <MenuItem key={source} value={source}>{source}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <ArticlesTable articles={articles} onBulkEdit={bulkEditArticles} />
    </Box>
  );
};

export default AdminDashboard;