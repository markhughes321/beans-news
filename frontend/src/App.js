import React from 'react';
import { Routes, Route } from 'react-router-dom';
import NavBar from './components/common/NavBar';
import AdminDashboard from './pages/AdminDashboard';
import ArticleEdit from './pages/ArticleEdit';
import ScrapingPage from './pages/ScrapingPage';
import HomePage from './pages/HomePage';

const App = () => (
  <>
    <NavBar />
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/article/edit/:uuid" element={<ArticleEdit />} />
      <Route path="/scraping" element={<ScrapingPage />} />
    </Routes>
  </>
);

export default App;