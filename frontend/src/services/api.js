import axios from "axios";

const API = axios.create({
  baseURL: "/api"
});

// Articles
export const getArticles = async () => {
  const res = await API.get("/articles");
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

// Manual Scraping
export const scrapeSource = async (sourceName) => {
  const res = await API.post(`/system/scrape?source=${sourceName}`);
  return res.data;
};

// Publish to Shopify
export const publishShopify = async () => {
  const res = await API.post(`/system/publish-shopify`);
  return res.data;
};
