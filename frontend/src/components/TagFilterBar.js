// frontend/src/components/TagFilterBar.js
import React from "react";
import "./TagFilterBar.css";

function TagFilterBar({ tags, onSelectTag }) {
  return (
    <div className="tag-filter-bar">
      {tags.map((tag) => (
        <button
          key={tag}
          className="tag-filter-button"
          onClick={() => onSelectTag(tag)}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}

export default TagFilterBar;
