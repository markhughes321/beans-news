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
        console.log("Fetching articles with params:", params);
        const data = await getArticles(params);
        console.log("Fetched articles:", data);
        setArticles(data);
      } catch (err) {
        const errorMessage = err.response?.data?.error || "Failed to fetch articles";
        setError(errorMessage);
        console.error("Error fetching articles:", err);
      } finally {
        setLoadingArticles(false);
      }
    }, [initialFilters]); // Keep initialFilters as a dependency for fetchArticles
  
    const fetchArticleById = useCallback(async (uuid) => {
      setLoadingArticle(true);
      setError(null);
      try {
        console.log("Fetching article with UUID:", uuid); // Debug log
        const data = await getArticle(uuid);
        console.log("Fetched article:", data); // Debug log
        return data;
      } catch (err) {
        const errorMessage = err.response?.data?.error || "Failed to fetch article";
        setError(errorMessage);
        console.error("Error fetching article:", err);
        throw err;
      } finally {
        setLoadingArticle(false);
      }
    }, []); // No dependencies, since setLoadingArticle and setError are stable
  
    const updateArticleById = useCallback(async (uuid, updates) => {
      setLoadingUpdate(true);
      setError(null);
      try {
        const data = await updateArticle(uuid, updates);
        setArticles((prev) =>
          prev.map((article) => (article.uuid === uuid ? { ...article, ...data } : article))
        );
        return data;
      } catch (err) {
        const errorMessage = err.response?.data?.error || "Failed to update article";
        setError(errorMessage);
        console.error("Error updating article:", err);
        throw err;
      } finally {
        setLoadingUpdate(false);
      }
    }, []);
  
    const bulkEditArticles = useCallback(async (uuids, key, value) => {
      setLoadingUpdate(true);
      setError(null);
      try {
        await apiBulkEditArticles(uuids, key, value);
        setArticles((prev) =>
          prev.map((article) =>
            uuids.includes(article.uuid) ? { ...article, [key]: value } : article
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
    }, []);
  
    const pushToShopify = useCallback(async (uuid) => {
      setLoadingPush(true);
      setError(null);
      try {
        const data = await pushArticleToShopify(uuid);
        setArticles((prev) =>
          prev.map((article) => (article.uuid === uuid ? { ...article, shopifyId: data.shopifyId, moderationStatus: "sentToShopify" } : article))
        );
        return data;
      } catch (err) {
        const errorMessage = err.response?.data?.error || "Failed to push to Shopify";
        setError(errorMessage);
        console.error("Error pushing to Shopify:", err);
        throw err;
      } finally {
        setLoadingPush(false);
      }
    }, []);
  
    const handleEditArticleOnShopify = useCallback(async (uuid) => {
      setLoadingPush(true);
      setError(null);
      try {
        const data = await apiEditArticleOnShopify(uuid);
        setArticles((prev) =>
          prev.map((article) => (article.uuid === uuid ? { ...article, shopifyId: data.shopifyId, moderationStatus: "sentToShopify" } : article))
        );
        return data;
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
      fetchArticles();
      prevFiltersRef.current = initialFilters;
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
      editArticleOnShopify: handleEditArticleOnShopify,
    };
  };