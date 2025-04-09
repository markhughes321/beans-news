import { useState, useEffect, useCallback, useRef } from "react";
import { getArticles, getArticle, updateArticle, pushArticleToShopify, editArticleOnShopify as apiEditArticleOnShopify, bulkEditArticles as apiBulkEditArticles } from "../services/api";

export const useArticles = (initialFilters = null) => {
  const [articles, setArticles] = useState([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [loadingArticle, setLoadingArticle] = useState(false);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [loadingPush, setLoadingPush] = useState(false);
  const [error, setError] = useState(null);
  const prevFiltersRef = useRef(initialFilters);

  const fetchArticles = useCallback(async (fetchFilters = initialFilters) => {
    setLoadingArticles(true);
    setError(null);
    try {
      const params = {};
      if (fetchFilters?.moderationStatus) {
        params.moderationStatus = JSON.stringify(fetchFilters.moderationStatus);
      }
      if (fetchFilters?.source) {
        params.source = fetchFilters.source;
      }
      if (fetchFilters?.search) {
        params.search = fetchFilters.search;
      }
      const data = await getArticles(params);
      setArticles(data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Failed to fetch articles";
      setError(errorMessage);
      console.error("Error fetching articles:", err);
    } finally {
      setLoadingArticles(false);
    }
  }, [initialFilters]);

  const fetchArticleById = useCallback(async (uuid) => {
    setLoadingArticle(true);
    setError(null);
    try {
      const data = await getArticle(uuid);
      if (!data) throw new Error("Article not found");
      return data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || "Failed to fetch article";
      setError(errorMessage);
      console.error("Error fetching article:", err);
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
      setArticles((prev) => prev.map((article) => (article.uuid === uuid ? updated : article)));
      return updated;
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Failed to update article";
      setError(errorMessage);
      console.error("Error updating article:", err);
      throw err;
    } finally {
      setLoadingUpdate(false);
    }
  };

  const bulkEditArticles = async (uuids, field, value) => {
    setLoadingUpdate(true);
    setError(null);
    try {
      const updates = { [field]: value };
      await apiBulkEditArticles(uuids, updates);
      setArticles((prev) =>
        prev.map((article) =>
          uuids.includes(article.uuid) ? { ...article, [field]: value } : article
        )
      );
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Failed to bulk edit articles";
      setError(errorMessage);
      console.error("Error bulk editing articles:", err);
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
          article.uuid === uuid ? { ...article, moderationStatus: "sentToShopify" } : article
        )
      );
      return result;
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Failed to push article to Shopify";
      setError(errorMessage);
      console.error("Error pushing article to Shopify:", err);
      throw err;
    } finally {
      setLoadingPush(false);
    }
  };

  const handleEditArticleOnShopify = useCallback(async (uuid, data) => {
    setLoadingPush(true);
    setError(null);
    try {
      const result = await apiEditArticleOnShopify(uuid, data); // Use renamed import
      return result;
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Failed to edit article on Shopify";
      setError(errorMessage);
      console.error("Error editing article on Shopify:", err);
      throw err;
    } finally {
      setLoadingPush(false);
    }
  }, []);

  useEffect(() => {
    if (JSON.stringify(prevFiltersRef.current) !== JSON.stringify(initialFilters)) {
      fetchArticles();
      prevFiltersRef.current = initialFilters;
    }
  }, [fetchArticles, initialFilters]);

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
    bulkEditArticles,
    pushToShopify,
    editArticleOnShopify: handleEditArticleOnShopify, // Export renamed function
  };
};