const Joi = require('joi');
const logger = require('../config/logger');

// Define the Joi schema for articles
const articleSchema = Joi.object({
  title: Joi.string().trim().min(1).required().messages({
    'string.empty': 'Title cannot be empty',
    'any.required': 'Title is required',
  }),
  link: Joi.string().uri().required().messages({
    'string.uri': 'Link must be a valid URI',
    'any.required': 'Link is required',
  }),
  source: Joi.string().trim().min(1).required().messages({
    'string.empty': 'Source cannot be empty',
    'any.required': 'Source is required',
  }),
  publishedAt: Joi.date().required().messages({
    'any.required': 'Published date is required',
    'date.base': 'Published date must be a valid date',
  }),
  description: Joi.string().allow('').optional().messages({
    'string.base': 'Description must be a string',
  }),
  domain: Joi.string().trim().min(1).required().messages({
    'string.empty': 'Domain cannot be empty',
    'any.required': 'Domain is required',
  }),
  image: Joi.object({
    height: Joi.number().allow(null).optional(),
    width: Joi.number().allow(null).optional(),
    filename_disk: Joi.string().uri().required().messages({
      'string.uri': 'Image URL must be a valid URI',
      'any.required': 'Image URL (filename_disk) is required',
    }),
  })
    .required() // Make image field required
    .messages({
      'object.base': 'Image must be an object',
      'any.required': 'Image is required and cannot be null',
    }),
  tags: Joi.array()
    .items(Joi.string().trim().min(1))
    .required()
    .messages({
      'array.base': 'Tags must be an array of strings',
      'any.required': 'Tags are required',
    }),
});

/**
 * Validates an article against the defined schema.
 * @param {Object} article - The article to validate.
 * @param {string} sourceType - The type of source ('RSS', 'API', 'SCRAPE').
 * @returns {Object} Validation result with `isValid`, `errors`, and `article` properties.
 */
const validateArticle = (article, sourceType) => {
  logger.debug(`Validating article from ${sourceType} (link: ${article.link || 'unknown'})`);

  const { error, value } = articleSchema.validate(article, { abortEarly: false });

  if (error) {
    logger.warn(`Validation failed for article from ${sourceType} (link: ${article.link || 'unknown'}): ${JSON.stringify(error.details)}`);
    return { isValid: false, errors: error.details, article: null };
  }

  logger.debug(`Article passed validation from ${sourceType} (link: ${article.link})`);
  return { isValid: true, errors: null, article: value };
};

module.exports = { validateArticle };