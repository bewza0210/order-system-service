import swaggerJsdoc from 'swagger-jsdoc';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Order System Service API',
      version: '1.0.0',
      description:
        'A concurrent order management system demonstrating race condition handling, Redis caching, and event-driven architecture patterns.',
      contact: {
        name: 'Order System Team',
        url: 'https://github.com/example/order-system-service',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Development Server',
      },
    ],
    components: {
      schemas: {
        Product: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440000',
            },
            name: {
              type: 'string',
              example: 'Laptop Pro',
            },
            description: {
              type: 'string',
              example: 'High-performance laptop',
            },
            price: {
              type: 'number',
              format: 'float',
              example: 999.99,
            },
            stock: {
              type: 'integer',
              example: 50,
            },
            reservedStock: {
              type: 'integer',
              example: 10,
            },
            sku: {
              type: 'string',
              example: 'LAPTOP-001',
            },
            isActive: {
              type: 'boolean',
              example: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Order: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            userId: {
              type: 'string',
              format: 'uuid',
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED', 'COMPLETED'],
              example: 'PENDING',
            },
            totalPrice: {
              type: 'number',
              format: 'float',
              example: 2999.97,
            },
            referenceNo: {
              type: 'string',
              example: 'ORD-1704355200000-a1b2c3d4',
            },
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/OrderItem',
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        OrderItem: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            productId: {
              type: 'string',
              format: 'uuid',
            },
            quantity: {
              type: 'integer',
              example: 3,
            },
            unitPrice: {
              type: 'number',
              format: 'float',
              example: 999.99,
            },
            totalPrice: {
              type: 'number',
              format: 'float',
              example: 2999.97,
            },
          },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
            },
            data: {
              type: 'object',
            },
            error: {
              type: 'string',
            },
            message: {
              type: 'string',
            },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
            },
            data: {
              type: 'array',
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                pages: { type: 'integer' },
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Health',
        description: 'Service health check endpoints',
      },
      {
        name: 'Products',
        description: 'Product management with Redis caching (Cache-Aside pattern)',
      },
      {
        name: 'Orders',
        description: 'Order management with concurrency handling and event publishing',
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
