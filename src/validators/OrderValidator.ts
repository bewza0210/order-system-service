import Joi from 'joi';

const createOrderSchema = Joi.object({
  userId: Joi.string().required().messages({
    'string.empty': 'User ID is required',
    'any.required': 'User ID is required'
  }),
  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().required().messages({
          'string.empty': 'Product ID is required',
          'any.required': 'Product ID is required'
        }),
        quantity: Joi.number().integer().positive().required().messages({
          'number.positive': 'Quantity must be greater than 0',
          'any.required': 'Quantity is required'
        })
      })
    )
    .min(1)
    .required()
    .messages({
      'array.base': 'Items must be an array',
      'array.min': 'At least one item is required',
      'any.required': 'Items array is required'
    })
});

const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid('PENDING', 'CONFIRMED', 'SHIPPED', 'CANCELLED')
    .required()
    .messages({
      'any.only': 'Status must be one of: PENDING, CONFIRMED, SHIPPED, CANCELLED',
      'any.required': 'Status is required'
    })
});

const orderQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(10),
  userId: Joi.string().optional(),
  status: Joi.string()
    .valid('PENDING', 'CONFIRMED', 'SHIPPED', 'CANCELLED')
    .optional()
});

export const validateCreateOrder = (data: any) => {
  return createOrderSchema.validate(data, { abortEarly: false });
};

export const validateUpdateOrderStatus = (data: any) => {
  return updateOrderStatusSchema.validate(data, { abortEarly: false });
};

export const validateOrderQuery = (data: any) => {
  return orderQuerySchema.validate(data, { abortEarly: false });
};
