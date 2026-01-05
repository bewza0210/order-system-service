import { Router } from 'express';
import { OrderController } from '../controllers/OrderController';

const router = Router();
const controller = new OrderController();

/**
 * @swagger
 * /api/orders:
 *   post:
 *     tags:
 *       - Orders
 *     summary: Create new order
 *     description: |
 *       Create a new order with stock reservation, concurrency handling, and event publishing.
 *
 *       **Features:**
 *       - Redis-based distributed locking for concurrency control
 *       - Automatic stock reservation
 *       - Event publishing to RabbitMQ
 *       - Transaction-based consistency
 *
 *       **Foreign Key Requirements:**
 *       - userId must reference an existing User
 *       - productId must reference an existing Product
 *
 *       **Sample Data from seed:**
 *       - Users: john@example.com, jane@example.com, bob@example.com
 *       - Products: MacBook Pro, iPhone 15, iPad Air, etc.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - items
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 description: Foreign Key reference to User. Get from seed or list users endpoint
 *                 example: d48e6a8b-2711-4bb3-95bb-a8f995ff52e8
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 description: Array of products to order
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - quantity
 *                   properties:
 *                     productId:
 *                       type: string
 *                       format: uuid
 *                       description: Foreign Key reference to Product. Get from seeded products
 *                       example: 7d5c7e45-7a54-4cdf-b90f-a314019d319a
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                       example: 2
 *                       description: Quantity to order (cannot exceed available stock)
 *     responses:
 *       201:
 *         description: Order created successfully (processing asynchronously)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *                 message:
 *                   type: string
 *                   example: Order created successfully. Processing in background...
 *       400:
 *         description: |
 *           Validation failed, insufficient stock, or invalid FK reference
 *           - Missing required fields (userId, items)
 *           - userId or productId not found
 *           - Insufficient stock for requested quantity
 *       409:
 *         description: Concurrency conflict - cannot acquire stock lock (retry recommended)
 *       500:
 *         description: Internal server error
 */
router.post('/', (req, res) => controller.createOrder(req, res));

/**
 * @swagger
 * /api/orders:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Get all orders
 *     description: Retrieve all orders with pagination support
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *     responses:
 *       200:
 *         description: List of orders
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/', (req, res) => controller.getAllOrders(req, res));

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Get order by ID
 *     description: Retrieve a specific order with items and event logs
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Order found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
 */
router.get('/:id', (req, res) => controller.getOrderById(req, res));

/**
 * @swagger
 * /api/orders/user/{userId}:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Get user's orders
 *     description: Retrieve all orders for a specific user with pagination
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *     responses:
 *       200:
 *         description: User's orders
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/user/:userId', (req, res) => controller.getUserOrders(req, res));

/**
 * @swagger
 * /api/orders/{id}/status:
 *   put:
 *     tags:
 *       - Orders
 *     summary: Update order status
 *     description: Update the status of an order (PENDING, CONFIRMED, FAILED, CANCELLED, COMPLETED)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum:
 *                   - PENDING
 *                   - CONFIRMED
 *                   - FAILED
 *                   - CANCELLED
 *                   - COMPLETED
 *     responses:
 *       200:
 *         description: Status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
 */
router.put('/:id/status', (req, res) => controller.updateOrderStatus(req, res));

/**
 * @swagger
 * /api/orders/{id}:
 *   delete:
 *     tags:
 *       - Orders
 *     summary: Cancel order
 *     description: Cancel an order and restore stock to inventory
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *                 message:
 *                   type: string
 *       404:
 *         description: Order not found
 */
router.delete('/:id', (req, res) => controller.cancelOrder(req, res));

/**
 * @swagger
 * /api/orders/{id}/logs:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Get order event logs
 *     description: Retrieve all events logged for a specific order
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Event logs retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       orderId:
 *                         type: string
 *                         format: uuid
 *                       eventType:
 *                         type: string
 *                       payload:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 */
router.get('/:id/logs', (req, res) => controller.getOrderEventLogs(req, res));

export default router;
