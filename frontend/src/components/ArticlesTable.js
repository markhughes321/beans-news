import React from "react";
import { Link } from "react-router-dom";

function ArticlesTable({ articles, onDelete }) {
  return (
    <table border="1" cellPadding="8" cellSpacing="0" style={{ width: "100%", marginTop: "1rem" }}>
      <thead>
        <tr>
          <th>Title</th>
          <th>Category</th>
          <th>Geotag</th>
          <th>SentToShopify</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {articles.map((article) => (
          <tr key={article.uuid}>
            <td>{article.title}</td>
            <td>{article.category}</td>
            <td>{article.geotag || "-"}</td>
            <td>{article.sentToShopify ? "Yes" : "No"}</td>
            <td>
              <Link to={`/article/edit/${article.uuid}`}>Edit</Link> |{" "}
              <button onClick={() => onDelete(article.uuid)}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default ArticlesTable;
