// File: ./src/models/Article.js
const mongoose = require('mongoose');

const ArticleSchema = new mongoose.Schema({
  title: { type: String, required: true, index: true },
  link: { type: String, required: true, unique: true, index: true },
  source: { type: String, required: true },
  publishedAt: { type: Date, default: Date.now, index: true },
  description: { type: String },
  domain: { type: String, required: true, index: true },
  image: {
    type: {
      height: { type: Number, default: null },
      width: { type: Number, default: null },
      filename_disk: { type: String, required: true },
    },
    required: true,
  },
  tags: [{ type: String, index: true }],
  sentToShopify: { type: Boolean, default: false }, // New field to track if sent to Shopify
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

ArticleSchema.index({ tags: 1, publishedAt: -1 });

module.exports = mongoose.model('Article', ArticleSchema);