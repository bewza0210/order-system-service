import Joi from 'joi';

const createProductSchema = Joi.object({
  name: Joi.string().required().messages({
    'string.empty': 'Product name is required',
    'any.required': 'Product name is required'
  }),
  description: Joi.string().optional().allow(''),
  price: Joi.number().positive().required().messages({
    'number.positive': 'Price must be greater than 0',
    'any.required': 'Price is required'
  }),
  stock: Joi.number().integer().min(0).required().messages({
    'number.base': 'Stock must be a number',
    'number.min': 'Stock cannot be negative',
    'any.required': 'Stock is required'
  }),
  categoryId: Joi.string().required().messages({
    'string.empty': 'Category ID is required',
    'any.required': 'Category ID is required'
  }),
  sku: Joi.string().optional().allow('')
});

const updateProductSchema = Joi.object({
  name: Joi.string().optional(),
  description: Joi.string().optional().allow(''),
  price: Joi.number().positive().optional().messages({
    'number.positive': 'Price must be greater than 0'
  }),
  stock: Joi.number().integer().min(0).optional().messages({
    'number.base': 'Stock must be a number',
    'number.min': 'Stock cannot be negative'
  }),
  categoryId: Joi.string().optional(),
  sku: Joi.string().optional().allow('')
});

const productQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(10)
});

export const validateCreateProduct = (data: any) => {
  return createProductSchema.validate(data, { abortEarly: false });
};

export const validateUpdateProduct = (data: any) => {
  return updateProductSchema.validate(data, { abortEarly: false });
};

export const validateProductQuery = (data: any) => {
  return productQuerySchema.validate(data, { abortEarly: false });
};
