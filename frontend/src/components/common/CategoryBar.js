import React from 'react';
import { Tabs, Tab, Box } from '@mui/material';

const CategoryBar = ({ categories, onSelectCategory, selectedCategory }) => {
  const handleChange = (event, newValue) => {
    const category = newValue === selectedCategory ? null : newValue;
    onSelectCategory(category);
  };

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', overflowX: 'auto' }}>
      <Tabs
        value={selectedCategory || false}
        onChange={handleChange}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="category tabs"
        sx={{
          '& .MuiTabs-flexContainer': { justifyContent: 'center' },
        }}
      >
        {categories.map((category) => (
          <Tab
            key={category}
            label={category}
            value={category}
            sx={{
              textTransform: 'uppercase',
              fontWeight: 600,
              color: 'text.secondary',
              '&.Mui-selected': { color: 'primary.main' },
            }}
          />
        ))}
      </Tabs>
    </Box>
  );
};

export default CategoryBar;