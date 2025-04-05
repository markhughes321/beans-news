import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Tabs, Tab, Box } from '@mui/material';

const NavBar = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const tabValue = () => {
    if (currentPath === '/') return 0;
    if (currentPath === '/home') return 1;
    if (currentPath === '/scraping') return 2;
    return false;
  };

  return (
    <AppBar position="sticky" color="default" elevation={1}>
      <Toolbar sx={{ justifyContent: 'center' }}>
        <Tabs value={tabValue()} aria-label="navigation tabs">
          <Tab
            label="Articles"
            component={Link}
            to="/"
            sx={{ textTransform: 'none', fontWeight: 500 }}
          />
          <Tab
            label="Home"
            component={Link}
            to="/home"
            sx={{ textTransform: 'none', fontWeight: 500 }}
          />
          <Tab
            label="Scraping"
            component={Link}
            to="/scraping"
            sx={{ textTransform: 'none', fontWeight: 500 }}
          />
        </Tabs>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;