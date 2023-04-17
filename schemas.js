const BaseJoi = require('joi');
const sanitizeHtml = require('sanitize-html')

const extension = (joi) => ({
  type: 'string',
  base: joi.string(),
  messages: {
      'string.escapeHTML': '{{#label}} must not include HTML!'
  },
  rules: {
      escapeHTML: {
          validate(value, helpers) {
              const clean = sanitizeHtml(value, {
                  allowedTags: [],
                  allowedAttributes: {},
              });
              if (clean !== value) return helpers.error('string.escapeHTML', { value })
              return clean;
          }
      }
  }
});

const Joi = BaseJoi.extend(extension)

module.exports.listingSchema = Joi.object({
    startTime: Joi.date(),
    endTime: Joi.date(),
    title: Joi.string().trim().required().messages({
      'any.required': 'Title must be provided'
    }).escapeHTML(),
    description: Joi.string().trim().allow(""),
    price: Joi.number().min(0).required().messages({
      'any.required': 'Price must be provided and greater than or equal to 0'
    }),
    condition: Joi.string().valid('New', 'Used-like new', 'Used-good', 'Used-fair').required().messages({
      'any.required': 'Condition of the product must be supplied'
    }).escapeHTML(),
    category: Joi.string().valid('Home & Garden', 'Entertainment', 'Clothing and accessories', 'Electronics', 'Sports and outdoors').required().messages({
      'any.required': 'Category must be selected'
    }).escapeHTML(),
    location: Joi.string().required().messages({
      'any.required': 'The location of your listing must be supplied'
    }).escapeHTML(),
  });



