import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getArticle, updateArticle } from "../services/api";

function ArticleEdit() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);

  useEffect(() => {
    (async function fetchArticle() {
      const data = await getArticle(uuid);
      setArticle(data);
    })();
  }, [uuid]);

  const handleChange = (e) => {
    setArticle({
      ...article,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateArticle(uuid, article);
    navigate("/");
  };

  if (!article) {
    return <div style={{ padding: "1rem" }}>Loading...</div>;
  }

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Edit Article</h2>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", maxWidth: "600px" }}
      >
        <label>Title:</label>
        <input
          name="title"
          value={article.title || ""}
          onChange={handleChange}
        />

        <label>Category:</label>
        <select name="category" value={article.category || ""} onChange={handleChange}>
          <option value="Sustainability">Sustainability</option>
          <option value="Design">Design</option>
          <option value="Origin">Origin</option>
          <option value="Culture">Culture</option>
          <option value="Market">Market</option>
          <option value="Innovation">Innovation</option>
          <option value="People">People</option>
          <option value="Competition">Competition</option>
        </select>

        <label>Geotag:</label>
        <input
          name="geotag"
          value={article.geotag || ""}
          onChange={handleChange}
        />

        <label>Improved Description:</label>
        <textarea
          name="improvedDescription"
          value={article.improvedDescription || ""}
          onChange={handleChange}
          rows="5"
        />

        <label>Image URL:</label>
        <input
          name="imageUrl"
          value={article.imageUrl || ""}
          onChange={handleChange}
        />

        <button type="submit" style={{ marginTop: "1rem" }}>Save</button>
      </form>
    </div>
  );
}

export default ArticleEdit;
