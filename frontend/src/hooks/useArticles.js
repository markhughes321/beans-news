import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  getArticles, 
  getArticle, 
  updateArticle, 
  deleteArticle, 
  pushArticleToShopify,
  editArticleOnShopify as apiEditArticleOnShopify // Rename the import to avoid conflict
} from '../services/api';

export const useArticles = (filters = null) => {
  const [articles, setArticles] = useState([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [loadingArticle, setLoadingArticle] = useState(false);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [loadingPush, setLoadingPush] = useState(false);
  const [error, setError] = useState(null);
  const prevFiltersRef = useRef(filters);

  const fetchArticles = useCallback(async (fetchFilters = filters) => {
    setLoadingArticles(true);
    setError(null);
    try {
      const data = await getArticles(fetchFilters);
      setArticles(data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch articles';
      setError(errorMessage);
      console.error('Error fetching articles:', err);
    } finally {
      setLoadingArticles(false);
    }
  }, [filters]);

  const fetchArticleById = useCallback(async (uuid) => {
    setLoadingArticle(true);
    setError(null);
    try {
      const data = await getArticle(uuid);
      if (!data) throw new Error('Article not found');
      return data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch article';
      setError(errorMessage);
      console.error('Error fetching article:', err);
      return null;
    } finally {
      setLoadingArticle(false);
    }
  }, []);

  const updateArticleById = async (uuid, data) => {
    setLoadingUpdate(true);
    setError(null);
    try {
      const updated = await updateArticle(uuid, data);
      setArticles((prev) =>
        prev.map((article) => (article.uuid === uuid ? updated : article))
      );
      return updated;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to update article';
      setError(errorMessage);
      console.error('Error updating article:', err);
      throw err;
    } finally {
      setLoadingUpdate(false);
    }
  };

  const deleteArticleById = async (uuid) => {
    setLoadingUpdate(true);
    setError(null);
    try {
      await deleteArticle(uuid);
      setArticles((prev) => prev.filter((article) => article.uuid !== uuid));
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to delete article';
      setError(errorMessage);
      console.error('Error deleting article:', err);
      throw err;
    } finally {
      setLoadingUpdate(false);
    }
  };

  const bulkDeleteArticles = async (uuids) => {
    setLoadingUpdate(true);
    setError(null);
    try {
      await Promise.all(uuids.map((uuid) => deleteArticle(uuid)));
      setArticles((prev) => prev.filter((article) => !uuids.includes(article.uuid)));
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to bulk delete articles';
      setError(errorMessage);
      console.error('Error bulk deleting articles:', err);
      throw err;
    } finally {
      setLoadingUpdate(false);
    }
  };

  const bulkEditArticles = async (uuids, field, value) => {
    setLoadingUpdate(true);
    setError(null);
    try {
      const updates = uuids.map((uuid) =>
        updateArticle(uuid, { [field]: value })
      );
      const updatedArticles = await Promise.all(updates);
      setArticles((prev) =>
        prev.map((article) =>
          uuids.includes(article.uuid)
            ? updatedArticles.find((a) => a.uuid === article.uuid) || article
            : article
        )
      );
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to bulk edit articles';
      setError(errorMessage);
      console.error('Error bulk editing articles:', err);
      throw err;
    } finally {
      setLoadingUpdate(false);
    }
  };

  const pushToShopify = async (uuid) => {
    setLoadingPush(true);
    setError(null);
    try {
      const result = await pushArticleToShopify(uuid);
      setArticles((prev) =>
        prev.map((article) =>
          article.uuid === uuid ? { ...article, sentToShopify: true } : article
        )
      );
      return result;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to push article to Shopify';
      setError(errorMessage);
      console.error('Error pushing article to Shopify:', err);
      throw err;
    } finally {
      setLoadingPush(false);
    }
  };

  const editArticleOnShopify = async (uuid, data) => {
    setLoadingPush(true);
    setError(null);
    console.log('Calling editArticleOnShopify with UUID:', uuid, 'Data:', data); // Debugging
    try {
      const result = await apiEditArticleOnShopify(uuid, data); // Use the renamed import
      console.log('API response from editArticleOnShopify:', result); // Debugging
      setArticles((prev) =>
        prev.map((article) =>
          article.uuid === uuid ? { ...article, ...data } : article
        )
      );
      return result;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to edit article on Shopify';
      setError(errorMessage);
      console.error('Error editing article on Shopify:', err);
      throw err;
    } finally {
      setLoadingPush(false);
    }
  };

  useEffect(() => {
    if (filters !== null) {
      fetchArticles(filters);
      prevFiltersRef.current = filters;
    }
  }, [fetchArticles, filters]);

  return {
    articles,
    loadingArticles,
    loadingArticle,
    loadingUpdate,
    loadingPush,
    error,
    fetchArticles,
    fetchArticleById,
    updateArticleById,
    deleteArticleById,
    bulkDeleteArticles,
    bulkEditArticles,
    pushToShopify,
    editArticleOnShopify,
  };
};