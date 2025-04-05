import { useState, useEffect, useCallback } from 'react';
import { getArticles, getArticle, updateArticle, deleteArticle } from '../services/api';

export const useArticles = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchArticles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getArticles();
      setArticles(data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch articles';
      setError(errorMessage);
      console.error('Error fetching articles:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchArticleById = useCallback(async (uuid) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getArticle(uuid);
      if (!data) {
        throw new Error('Article not found');
      }
      return data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch article';
      setError(errorMessage);
      console.error('Error fetching article:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array since this function doesn't depend on any external state

  const updateArticleById = async (uuid, data) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await updateArticle(uuid, data);
      setArticles((prev) =>
        prev.map((article) => (article.uuid === uuid ? updated : article))
      );
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to update article';
      setError(errorMessage);
      console.error('Error updating article:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteArticleById = async (uuid) => {
    setLoading(true);
    setError(null);
    try {
      await deleteArticle(uuid);
      setArticles((prev) => prev.filter((article) => article.uuid !== uuid));
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to delete article';
      setError(errorMessage);
      console.error('Error deleting article:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  return {
    articles,
    loading,
    error,
    fetchArticles,
    fetchArticleById,
    updateArticleById,
    deleteArticleById,
  };
};