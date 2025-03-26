const Joi = require('joi');
const logger = require('../config/logger');

// Initial schema for saving articles before ChatGPT analysis
const initialArticleSchema = Joi.object({
  _id: Joi.string().optional(), // Allow _id as an optional string
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
  description_improved: Joi.string().allow('').optional().messages({
    'string.base': 'Improved description must be a string',
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
    .required()
    .messages({
      'object.base': 'Image must be an object',
      'any.required': 'Image is required and cannot be null',
    }),
  tags: Joi.array()
    .items(Joi.string().trim().min(1))
    .allow(null)
    .optional()
    .messages({
      'array.base': 'Tags must be an array of strings',
    }),
  category: Joi.string().optional().messages({
    'string.base': 'Category must be a string',
  }),
  geotag: Joi.string().allow(null).optional().messages({
    'string.base': 'Geotag must be a string or null',
  }),
  metaStatus: Joi.string().valid('pending', 'success', 'failed').optional().messages({
    'any.only': 'metaStatus must be one of "pending", "success", or "failed"',
  }),
});

// Final schema for validation after ChatGPT analysis
const finalArticleSchema = Joi.object({
  _id: Joi.string().optional(), // Allow _id as an optional string
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
  description_improved: Joi.string().trim().min(1).required().messages({
    'string.empty': 'Improved description cannot be empty',
    'any.required': 'Improved description is required',
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
    .required()
    .messages({
      'object.base': 'Image must be an object',
      'any.required': 'Image is required and cannot be null',
    }),
  tags: Joi.array()
    .items(Joi.string().trim().min(1))
    .allow(null)
    .optional()
    .messages({
      'array.base': 'Tags must be an array of strings',
    }),
  category: Joi.string()
    .required()
    .valid('Sustainability', 'Design', 'Origin', 'Culture', 'Market', 'Innovation', 'People', 'Competition')
    .messages({
      'any.required': 'Category is required',
      'any.only': 'Category must be one of the predefined values',
    }),
  geotag: Joi.string().allow(null).optional().messages({
    'string.base': 'Geotag must be a string or null',
  }),
  metaStatus: Joi.string().valid('pending', 'success', 'failed').optional().messages({
    'any.only': 'metaStatus must be one of "pending", "success", or "failed"',
  }),
});

const validateInitialArticle = (article, sourceType) => {
  logger.debug(`Validating initial article from ${sourceType} (link: ${article.link || 'unknown'})`);

  const { error, value } = initialArticleSchema.validate(article, { abortEarly: false });

  if (error) {
    logger.warn(`Initial validation failed for article from ${sourceType} (link: ${article.link || 'unknown'}): ${JSON.stringify(error.details)}`);
    return { isValid: false, errors: error.details, article: null };
  }

  logger.debug(`Initial article passed validation from ${sourceType} (link: ${article.link})`);
  return { isValid: true, errors: null, article: value };
};

const validateFinalArticle = (article, sourceType) => {
  logger.debug(`Validating final article from ${sourceType} (link: ${article.link || 'unknown'})`);

  const { error, value } = finalArticleSchema.validate(article, { abortEarly: false });

  if (error) {
    logger.warn(`Final validation failed for article from ${sourceType} (link: ${article.link || 'unknown'}): ${JSON.stringify(error.details)}`);
    return { isValid: false, errors: error.details, article: null };
  }

  logger.debug(`Final article passed validation from ${sourceType} (link: ${article.link})`);
  return { isValid: true, errors: null, article: value };
};

module.exports = { validateInitialArticle, validateFinalArticle };