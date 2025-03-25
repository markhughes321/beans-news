const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { getAllArticles, getArticleById, dropAllArticles } = require('../controllers/articleController');

router.get('/', getAllArticles);

router.get('/:id', (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Invalid article ID' });
  }
  next();
}, getArticleById);

router.delete('/drop', dropAllArticles);

module.exports = router;