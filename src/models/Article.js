const mongoose = require('mongoose');

const ArticleSchema = new mongoose.Schema({
  title: { type: String, required: true, index: true },
  link: { type: String, required: true, unique: true, index: true },
  source: { type: String, required: true },
  publishedAt: { type: Date, default: Date.now, index: true },
  description: { type: String },
  description_improved: { type: String },
  domain: { type: String, required: true, index: true },
  image: {
    type: {
      height: { type: Number, default: null },
      width: { type: Number, default: null },
      filename_disk: { type: String, required: true },
    },
    required: true, // Image is required
  },
  tags: [{ type: String, index: true }], // Optional initially
  category: { type: String }, // Optional initially
  geotag: { type: String, default: null }, // Already optional
  sentToShopify: { type: Boolean, default: false },
  metaStatus: { 
    type: String, 
    enum: ['pending', 'success', 'failed'], 
    default: 'pending', 
    index: true 
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

ArticleSchema.index({ tags: 1, publishedAt: -1 });
ArticleSchema.index({ metaStatus: 1, publishedAt: -1 });

module.exports = mongoose.model('Article', ArticleSchema);