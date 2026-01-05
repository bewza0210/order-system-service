import { AppDataSource } from '../config/database';
import { redisClient } from '../config/redis';
import { publishToExchange } from '../config/rabbitmq';
import { Order, OrderStatus, OrderItem, EventLog, EventType, Product, User } from '../entities';
import { v4 as uuidv4 } from 'uuid';

export class OrderService {
  private orderRepository = AppDataSource.getRepository(Order);
  private orderItemRepository = AppDataSource.getRepository(OrderItem);
  private productRepository = AppDataSource.getRepository(Product);
  private userRepository = AppDataSource.getRepository(User);
  private eventLogRepository = AppDataSource.getRepository(EventLog);

  private readonly STOCK_LOCK_PREFIX = 'stock_lock:';
  private readonly STOCK_LOCK_TTL = 30; // 30 seconds

  /**
   * Create order with stock reservation and event publishing
   * Implements concurrency handling with Redis locks
   */
  async createOrder(data: {
    userId: string;
    items: Array<{ productId: string; quantity: number }>;
  }): Promise<Order> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Verify user exists
      const user = await this.userRepository.findOne({ where: { id: data.userId } });
      if (!user) {
        throw new Error('User not found');
      }

      // 2. Validate and reserve stock with lock
      const reservations: Map<string, number> = new Map();
      let totalPrice = 0;

      for (const item of data.items) {
        const lockKey = `${this.STOCK_LOCK_PREFIX}${item.productId}`;

        // Try to acquire lock
        const locked = await redisClient.set(
          lockKey,
          uuidv4(),
          { EX: this.STOCK_LOCK_TTL, NX: true }
        );

        if (!locked) {
          throw new Error(`Cannot acquire lock for product ${item.productId}. Please try again.`);
        }

        try {
          // Get product with lock (using transaction)
          const product = await queryRunner.manager.findOne(Product, {
            where: { id: item.productId },
          });

          if (!product) {
            throw new Error(`Product not found: ${item.productId}`);
          }

          if (product.stock < item.quantity) {
            throw new Error(
              `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`
            );
          }

          // Reserve stock (update in transaction)
          product.stock -= item.quantity;
          product.reservedStock += item.quantity;
          await queryRunner.manager.save(product);

          reservations.set(item.productId, item.quantity);
          totalPrice += product.price * item.quantity;

          // Invalidate product cache
          const cacheKey = `product:${item.productId}`;
          await redisClient.del(cacheKey);
        } finally {
          // Release lock
          await redisClient.del(lockKey);
        }
      }

      // 3. Create order
      const referenceNo = `ORD-${Date.now()}-${uuidv4().substring(0, 8)}`;
      const order = this.orderRepository.create({
        id: uuidv4(),
        userId: data.userId,
        status: OrderStatus.PENDING,
        totalPrice,
        referenceNo,
      });

      const savedOrder = await queryRunner.manager.save(order);

      // 4. Create order items
      const orderItems: OrderItem[] = [];
      for (const item of data.items) {
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: item.productId },
        });

        const orderItem = this.orderItemRepository.create({
          id: uuidv4(),
          orderId: savedOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: product!.price,
          totalPrice: product!.price * item.quantity,
        });

        orderItems.push(await queryRunner.manager.save(orderItem));
      }

      // 5. Log event
      const eventLog = this.eventLogRepository.create({
        id: uuidv4(),
        orderId: savedOrder.id,
        eventType: EventType.ORDER_CREATED,
        payload: JSON.stringify({ items: data.items, totalPrice }),
      });

      await queryRunner.manager.save(eventLog);

      // 6. Commit transaction
      await queryRunner.commitTransaction();

      console.log(`✅ Order created: ${savedOrder.id} (${referenceNo})`);

      // 7. Publish event to RabbitMQ (after transaction commits)
      try {
        await publishToExchange('order_events', 'order.created', {
          orderId: savedOrder.id,
          userId: data.userId,
          referenceNo,
          totalPrice,
          items: data.items,
          timestamp: new Date().toISOString(),
        }, {}, 'topic');
        console.log(`✅ Order event published: ${savedOrder.id}`);
      } catch (err) {
        console.error('Warning: Failed to publish order event:', err);
        // Don't fail the order creation if event publishing fails
      }

      return savedOrder;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error creating order:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get order by ID with items
   */
  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const order = await this.orderRepository.findOne({
        where: { id: orderId },
        relations: ['user', 'items', 'items.product', 'eventLogs'],
      });

      return order || null;
    } catch (error) {
      console.error('Error getting order:', error);
      throw error;
    }
  }

  /**
   * Get user's orders with pagination
   */
  async getOrdersByUser(userId: string, page: number = 1, limit: number = 10): Promise<[Order[], number]> {
    try {
      const skip = (page - 1) * limit;
      return await this.orderRepository.findAndCount({
        where: { userId },
        relations: ['items', 'items.product'],
        skip,
        take: limit,
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      console.error('Error getting user orders:', error);
      throw error;
    }
  }

  /**
   * Get all orders with pagination
   */
  async getAllOrders(page: number = 1, limit: number = 10): Promise<[Order[], number]> {
    try {
      const skip = (page - 1) * limit;
      return await this.orderRepository.findAndCount({
        relations: ['user', 'items'],
        skip,
        take: limit,
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      console.error('Error getting orders:', error);
      throw error;
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<Order | null> {
    try {
      const order = await this.orderRepository.findOne({ where: { id: orderId } });
      if (!order) {
        return null;
      }

      const oldStatus = order.status;
      order.status = newStatus;
      const updated = await this.orderRepository.save(order);

      // Log status change
      const eventLog = this.eventLogRepository.create({
        id: uuidv4(),
        orderId,
        eventType: EventType.ORDER_CONFIRMED, // Could map status to event type
        payload: JSON.stringify({ oldStatus, newStatus }),
      });

      await this.eventLogRepository.save(eventLog);

      console.log(`✅ Order status updated: ${orderId} (${oldStatus} → ${newStatus})`);

      return updated;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  /**
   * Cancel order and restore stock
   */
  async cancelOrder(orderId: string): Promise<Order | null> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = await queryRunner.manager.findOne(Order, {
        where: { id: orderId },
        relations: ['items'],
      });

      if (!order) {
        return null;
      }

      if (order.status === OrderStatus.CANCELLED) {
        throw new Error('Order already cancelled');
      }

      // Restore stock
      for (const item of order.items) {
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: item.productId },
        });

        if (product) {
          product.stock += item.quantity;
          product.reservedStock -= item.quantity;
          await queryRunner.manager.save(product);

          // Invalidate cache
          const cacheKey = `product:${item.productId}`;
          await redisClient.del(cacheKey);
        }
      }

      order.status = OrderStatus.CANCELLED;
      const updated = await queryRunner.manager.save(order);

      // Log cancellation
      const eventLog = this.eventLogRepository.create({
        id: uuidv4(),
        orderId,
        eventType: EventType.ORDER_CANCELLED,
        payload: JSON.stringify({ cancelledAt: new Date().toISOString() }),
      });

      await queryRunner.manager.save(eventLog);

      await queryRunner.commitTransaction();

      console.log(`✅ Order cancelled and stock restored: ${orderId}`);

      return updated;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error cancelling order:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get order event logs
   */
  async getOrderEventLogs(orderId: string): Promise<EventLog[]> {
    try {
      return await this.eventLogRepository.find({
        where: { orderId },
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      console.error('Error getting event logs:', error);
      throw error;
    }
  }
}
