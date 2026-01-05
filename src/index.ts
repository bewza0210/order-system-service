import 'dotenv/config';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { redisClient } from './config/redis';
import { initRabbitMQ } from './config/rabbitmq';
import { initializeDatabase, closeDatabase, AppDataSource } from './config/database';
import productRoutes from './routes/products';
import orderRoutes from './routes/orders';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger UI
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerSpec, { swaggerOptions: { persistAuthorization: true } }));

// API Documentation redirect
app.get('/docs', (req, res) => res.redirect('/api-docs'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: AppDataSource.isInitialized ? 'connected' : 'disconnected',
  });
});

// Hello world
app.get('/hello', async (req, res) => {
  res.json({ message: 'Hello, World!' });
});

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Initialize and start server
async function bootstrap() {
  try {
    console.log('🚀 Starting Order System Service...');

    await initializeDatabase();
    console.log('✅ Database connected');

    await redisClient.connect();
    console.log('✅ Redis connected');

    await initRabbitMQ();
    console.log('✅ RabbitMQ connected');

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`🎯 Server running on port ${PORT}`);
      console.log(`📍 http://localhost:${PORT}`);
      console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
    });

  } catch (error) {
    console.error('❌ Bootstrap error:', error);
    process.exit(1);
  }
}

bootstrap();

export default app;
