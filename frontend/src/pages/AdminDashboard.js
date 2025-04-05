import React, { useEffect, useState } from "react";
import { getArticles, deleteArticle } from "../services/api";
import ArticlesTable from "../components/ArticlesTable";

function AdminDashboard() {
  const [articles, setArticles] = useState([]);

  const fetchArticles = async () => {
    const data = await getArticles();
    setArticles(data);
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleDelete = async (uuid) => {
    await deleteArticle(uuid);
    fetchArticles();
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Admin Dashboard</h1>
      <ArticlesTable articles={articles} onDelete={handleDelete} />
    </div>
  );
}

export default AdminDashboard;
