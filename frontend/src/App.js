import React from "react";
import { Routes, Route } from "react-router-dom";

import NavBar from "./components/NavBar";
import AdminDashboard from "./pages/AdminDashboard";
import ArticleEdit from "./pages/ArticleEdit";
import ScrapingPage from "./pages/ScrapingPage";
import HomePage from "./pages/HomePage"; // The new magazine layout

function App() {
  return (
    <div>
      <NavBar />
      <Routes>
        {/* Keep your admin dash as the root */}
        <Route path="/" element={<AdminDashboard />} />

        {/* Add the new HomePage at "/home" */}
        <Route path="/home" element={<HomePage />} />

        {/* Other routes remain unchanged */}
        <Route path="/article/edit/:uuid" element={<ArticleEdit />} />
        <Route path="/scraping" element={<ScrapingPage />} />
      </Routes>
    </div>
  );
}

export default App;
