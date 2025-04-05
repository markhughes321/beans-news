// File: ./frontend/src/components/ArticleCard.js
import React from "react";
import "./ArticleCard.css"; 

function ArticleCard({ article }) {
  const {
    title,
    imageUrl,
    imageWidth,
    imageHeight,
    category,
    tags,
    improvedDescription,
    publishedAt,
    source
  } = article;

  // Format date
  const dateOptions = { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" };
  const formattedDate = new Date(publishedAt).toLocaleDateString("en-GB", dateOptions);

  return (
    <div className="article-card">
      {imageUrl && (
        <div className="article-image-wrapper">
          {/* If you want to enforce the actual width/height in HTML: */}
          <img
            src={imageUrl}
            alt={title}
            width={imageWidth || undefined}
            height={imageHeight || undefined}
            className="article-image"
          />
        </div>
      )}
      <div className="article-content">
        <div className="article-tags">
          <span className="tag category-tag">{category}</span>
          {tags && tags.map((tag) => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
        <h3 className="article-title">{title}</h3>
        {improvedDescription && (
          <p className="article-excerpt">{improvedDescription}</p>
        )}
        <div className="article-footer">
          <span className="article-source">
            {source} • {formattedDate}
          </span>
          <button className="share-button" onClick={() => alert("Share clicked!")}>
            <i className="fa fa-share" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ArticleCard;
