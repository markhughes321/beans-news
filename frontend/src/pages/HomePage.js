// frontend/src/pages/HomePage.js
import React, { useEffect, useState } from "react";
import ArticleCard from "../components/ArticleCard";
import TagFilterBar from "../components/TagFilterBar";
import "./HomePage.css"; // local styling for layout

function HomePage() {
  const [articles, setArticles] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);

  const topCategories = ["Top", "Exclusives", "Data", "People", "Shows", "Market"];
  const sampleTags = ["Milan", "Giuseppe Penone", "Yoko Ono", "Ruth Asawa", "Damien Hirst", "Rose Wylie", "Mark Leckey"];

  useEffect(() => {
    // TODO: fetch articles from your API or pass them as props
    fetch("/api/articles") // or your actual endpoint
      .then((res) => res.json())
      .then((data) => {
        setArticles(data);
      })
      .catch((error) => console.error("Failed to fetch articles:", error));
  }, []);

  // Example: filter by selectedTag if you want
  const filteredArticles = selectedTag
    ? articles.filter((a) => a.tags && a.tags.includes(selectedTag))
    : articles;

  const handleSelectTag = (tag) => {
    setSelectedTag(tag === selectedTag ? null : tag); // toggle same tag off
  };

  return (
    <div className="homepage-container">
      {/* Top Nav */}
      <nav className="top-nav">
        {topCategories.map((cat) => (
          <div key={cat} className="top-nav-item">
            {cat}
          </div>
        ))}
      </nav>

      {/* Tag Filter Horizontal Bar */}
      <TagFilterBar tags={sampleTags} onSelectTag={handleSelectTag} />

      {/* Grid of Articles */}
      <div className="articles-grid">
        {filteredArticles.map((article) => (
          <ArticleCard key={article.uuid} article={article} />
        ))}
      </div>
    </div>
  );
}

export default HomePage;
