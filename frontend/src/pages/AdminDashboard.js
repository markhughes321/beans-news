import React, { useMemo } from 'react';
import { Typography, Box } from '@mui/material';
import ArticlesTable from '../components/layout/ArticlesTable';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useArticles } from '../hooks/useArticles';

const AdminDashboard = () => {
  const filters = useMemo(() => ({}), []);
  const { articles, loadingArticles, error, deleteArticleById } = useArticles(filters);

  if (loadingArticles) return <LoadingSpinner />;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      <ArticlesTable articles={articles} onDelete={deleteArticleById} />
    </Box>
  );
};

export default AdminDashboard;