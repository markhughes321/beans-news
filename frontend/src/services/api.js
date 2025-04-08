// File: ./frontend/src/services/api.js
import axios from "axios";

const API = axios.create({
  baseURL: "/api",
});

export const getArticles = async (params = {}) => {
  const res = await API.get("/articles", { params });
  return res.data;
};

export const getArticle = async (uuid) => {
  const res = await API.get(`/articles/${uuid}`);
  return res.data;
};

export const updateArticle = async (uuid, data) => {
  const res = await API.put(`/articles/${uuid}`, data);
  return res.data;
};

export const deleteArticle = async (uuid) => {
  const res = await API.delete(`/articles/${uuid}`);
  return res.data;
};

export const bulkDeleteArticles = async (uuids) => {
  const res = await API.post('/articles/bulk-delete', { uuids });
  return res.data;
};

export const bulkEditArticles = async (uuids, updates) => {
  const res = await API.post('/articles/bulk-edit', { uuids, updates });
  return res.data;
};

export const scrapeSource = async (sourceName) => {
  const res = await API.post(`/system/scrape?source=${sourceName}`);
  return res.data;
};

export const processWithAI = async (sourceName) => {
  const res = await API.post(`/system/process-ai?source=${sourceName}`);
  return res.data;
};

export const publishShopify = async () => {
  const res = await API.post(`/system/publish-shopify`);
  return res.data;
};

export const pushArticleToShopify = async (uuid) => {
  const res = await API.post(`/system/push-to-shopify/${uuid}`);
  return res.data;
};

export const editArticleOnShopify = async (uuid, data) => {
  const res = await API.put(`/system/edit-on-shopify/${uuid}`, data);
  return res.data;
};