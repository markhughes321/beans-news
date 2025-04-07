const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const ArticleSchema = new mongoose.Schema(
  {
    uuid: { type: String, default: uuidv4, unique: true },
    title: { type: String, required: true },
    link: { type: String, required: true, unique: true },
    source: { type: String, required: true },
    domain: { type: String, required: true },
    publishedAt: { type: Date },
    description: { type: String },
    improvedDescription: { type: String },
    seoTitle: { type: String, default: null }, // New field for SEO title
    seoDescription: { type: String, default: null }, // New field for SEO description
    imageUrl: { type: String, default: null },
    imageWidth: { type: Number, default: null },
    imageHeight: { type: Number, default: null },
    category: { type: String, required: true },
    geotag: { type: String, default: null },
    tags: [{ type: String }],
    sentToShopify: { type: Boolean, default: false },
    shopifyMetaobjectId: { type: String, default: null },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Article", ArticleSchema);