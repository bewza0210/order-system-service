import { AppDataSource } from '../config/database';
import { redisClient } from '../config/redis';
import { Product } from '../entities/Product';
import { v4 as uuidv4 } from 'uuid';

const PRODUCT_CACHE_PREFIX = 'product:';
const PRODUCT_CACHE_TTL = 3600; // 1 hour

export class ProductService {
  private productRepository = AppDataSource.getRepository(Product);

  /**
   * Get product by ID - Uses Cache-Aside pattern
   * Priority: Redis → Database → Not Found
   */
  async getProductById(productId: string): Promise<Product | null> {
    try {
      // 1. Check Redis first
      const cacheKey = `${PRODUCT_CACHE_PREFIX}${productId}`;
      const cached = await redisClient.get(cacheKey);

      if (cached) {
        console.log(`✅ Cache HIT for product ${productId}`);
        return JSON.parse(cached) as Product;
      }

      // 2. Cache miss - query database
      console.log(`⚠️ Cache MISS for product ${productId}`);
      const product = await this.productRepository.findOne({ where: { id: productId } });

      if (!product) {
        return null;
      }

      // 3. Populate cache
      await redisClient.setEx(
        cacheKey,
        PRODUCT_CACHE_TTL,
        JSON.stringify(product)
      );
      console.log(`✅ Cached product ${productId} in Redis`);

      return product;
    } catch (error) {
      console.error('Error getting product:', error);
      throw error;
    }
  }

  /**
   * Get all products with pagination
   */
  async getAllProducts(page: number = 1, limit: number = 10): Promise<[Product[], number]> {
    try {
      const skip = (page - 1) * limit;
      return await this.productRepository.findAndCount({
        skip,
        take: limit,
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      console.error('Error getting products:', error);
      throw error;
    }
  }

  /**
   * Create product - Write to DB and cache in Redis
   */
  async createProduct(data: {
    name: string;
    description?: string;
    price: number;
    stock: number;
    sku?: string;
    categoryId?: string;
  }): Promise<Product> {
    try {
      const product = this.productRepository.create({
        id: uuidv4(),
        ...data,
      });

      const savedProduct = await this.productRepository.save(product);
      console.log(`✅ Product created in DB: ${savedProduct.id}`);

      // Cache in Redis
      const cacheKey = `${PRODUCT_CACHE_PREFIX}${savedProduct.id}`;
      await redisClient.setEx(
        cacheKey,
        PRODUCT_CACHE_TTL,
        JSON.stringify(savedProduct)
      );
      console.log(`✅ Product cached in Redis: ${savedProduct.id}`);

      return savedProduct;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  /**
   * Update product - Update DB and invalidate cache
   */
  async updateProduct(
    productId: string,
    data: Partial<Product>
  ): Promise<Product | null> {
    try {
      const product = await this.productRepository.findOne({ where: { id: productId } });
      if (!product) {
        return null;
      }

      Object.assign(product, data);
      const updatedProduct = await this.productRepository.save(product);

      // Invalidate cache
      const cacheKey = `${PRODUCT_CACHE_PREFIX}${productId}`;
      await redisClient.del(cacheKey);
      console.log(`✅ Cache invalidated for product ${productId}`);

      // Repopulate cache
      await redisClient.setEx(
        cacheKey,
        PRODUCT_CACHE_TTL,
        JSON.stringify(updatedProduct)
      );

      return updatedProduct;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  /**
   * Delete product - Remove from DB and invalidate cache
   */
  async deleteProduct(productId: string): Promise<boolean> {
    try {
      const result = await this.productRepository.delete(productId);

      if (result.affected === 0) {
        return false;
      }

      // Invalidate cache
      const cacheKey = `${PRODUCT_CACHE_PREFIX}${productId}`;
      await redisClient.del(cacheKey);
      console.log(`✅ Product deleted and cache invalidated: ${productId}`);

      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  /**
   * Reduce product stock (for orders)
   */
  async reduceStock(productId: string, quantity: number): Promise<Product | null> {
    try {
      const product = await this.productRepository.findOne({ where: { id: productId } });
      if (!product) {
        return null;
      }

      if (product.stock < quantity) {
        throw new Error(`Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`);
      }

      product.stock -= quantity;
      const updated = await this.productRepository.save(product);

      // Invalidate cache to ensure fresh data
      const cacheKey = `${PRODUCT_CACHE_PREFIX}${productId}`;
      await redisClient.del(cacheKey);

      return updated;
    } catch (error) {
      console.error('Error reducing stock:', error);
      throw error;
    }
  }

  /**
   * Clear all product cache
   */
  async clearCache(): Promise<void> {
    try {
      const keys = await redisClient.keys(`${PRODUCT_CACHE_PREFIX}*`);
      if (keys.length > 0) {
        await redisClient.del(keys);
        console.log(`✅ Cleared ${keys.length} product cache entries`);
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
}
