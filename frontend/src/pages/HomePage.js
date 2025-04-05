import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import ArticleCard from '../components/common/ArticleCard';
import CategoryBar from '../components/common/CategoryBar';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useArticles } from '../hooks/useArticles';
import { CATEGORIES } from '../utils/constants';

const HomePage = () => {
  const { articles, loading, error } = useArticles();
  const [selectedCategory, setSelectedCategory] = useState(null);

  const filteredArticles = selectedCategory
    ? articles.filter((a) => a.category === selectedCategory)
    : articles;

  const handleSelectCategory = (category) => {
    setSelectedCategory(category === selectedCategory ? null : category);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3 }}>
      <CategoryBar
        categories={CATEGORIES}
        onSelectCategory={handleSelectCategory}
        selectedCategory={selectedCategory}
      />
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
            <ArticleCard key={article.uuid} article={article} />
          ))
        ) : (
          <Typography sx={{ textAlign: 'center', color: 'text.secondary', mt: 3 }}>
            No articles found for this category.
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default HomePage;