import { Request, Response } from 'express';
import { OrderService } from '../services/OrderService';
import { OrderStatus } from '../entities';
import { validateCreateOrder, validateUpdateOrderStatus, validateOrderQuery } from '../validators/OrderValidator';

export class OrderController {
  private orderService = new OrderService();

  /**
   * Create order
   */
  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = validateCreateOrder(req.body);

      if (error) {
        const details = error.details.map((e: any) => e.message);
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details,
        });
        return;
      }

      const { userId, items } = value;

      const order = await this.orderService.createOrder({
        userId,
        items,
      });

      res.status(201).json({
        success: true,
        data: order,
        message: 'Order created successfully. Processing in background...',
      });
    } catch (error) {
      console.error('Error creating order:', error);

      const message = error instanceof Error ? error.message : 'Internal server error';

      // Return appropriate status based on error
      if (message.includes('not found') || message.includes('Insufficient stock')) {
        res.status(400).json({ success: false, error: message });
      } else if (message.includes('lock')) {
        res.status(409).json({ success: false, error: message }); // Conflict
      } else {
        res.status(500).json({ success: false, error: message });
      }
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id || typeof id !== 'string' || id.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Order ID is required',
        });
        return;
      }

      const order = await this.orderService.getOrderById(id);

      if (!order) {
        res.status(404).json({ success: false, error: 'Order not found' });
        return;
      }

      res.json({ success: true, data: order });
    } catch (error) {
      console.error('Error getting order:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  /**
   * Get user's orders
   */
  async getUserOrders(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { error, value } = validateOrderQuery(req.query);

      if (error) {
        const details = error.details.map((e: any) => e.message);
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details,
        });
        return;
      }

      if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'User ID is required',
        });
        return;
      }

      const { page, limit } = value;
      const [orders, total] = await this.orderService.getOrdersByUser(userId, page, limit);

      res.json({
        success: true,
        data: orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Error getting user orders:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  /**
   * Get all orders
   */
  async getAllOrders(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = validateOrderQuery(req.query);

      if (error) {
        const details = error.details.map((e: any) => e.message);
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details,
        });
        return;
      }

      const { page, limit } = value;
      const [orders, total] = await this.orderService.getAllOrders(page, limit);

      res.json({
        success: true,
        data: orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Error getting orders:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id || typeof id !== 'string' || id.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Order ID is required',
        });
        return;
      }

      const { error, value } = validateUpdateOrderStatus(req.body);

      if (error) {
        const details = error.details.map((e: any) => e.message);
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details,
        });
        return;
      }

      const { status } = value;

      const updated = await this.orderService.updateOrderStatus(id, status);

      if (!updated) {
        res.status(404).json({ success: false, error: 'Order not found' });
        return;
      }

      res.json({ success: true, data: updated });
    } catch (error) {
      console.error('Error updating order status:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id || typeof id !== 'string' || id.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Order ID is required',
        });
        return;
      }

      const cancelled = await this.orderService.cancelOrder(id);

      if (!cancelled) {
        res.status(404).json({ success: false, error: 'Order not found' });
        return;
      }

      res.json({ success: true, data: cancelled, message: 'Order cancelled successfully' });
    } catch (error) {
      console.error('Error cancelling order:', error);

      const message = error instanceof Error ? error.message : 'Internal server error';

      if (message.includes('already cancelled')) {
        res.status(400).json({ success: false, error: message });
      } else {
        res.status(500).json({ success: false, error: message });
      }
    }
  }

  /**
   * Get order event logs
   */
  async getOrderEventLogs(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id || typeof id !== 'string' || id.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Order ID is required',
        });
        return;
      }

      const logs = await this.orderService.getOrderEventLogs(id);

      res.json({ success: true, data: logs });
    } catch (error) {
      console.error('Error getting event logs:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }
}
