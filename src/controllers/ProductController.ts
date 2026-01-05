import { Request, Response } from 'express';
import { ProductService } from '../services/ProductService';
import { validateCreateProduct, validateUpdateProduct, validateProductQuery } from '../validators/ProductValidator';

export class ProductController {
  private productService = new ProductService();

  /**
   * Get all products with pagination
   */
  async getAllProducts(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = validateProductQuery(req.query);

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
      const [products, total] = await this.productService.getAllProducts(page, limit);

      res.json({
        success: true,
        data: products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Error getting products:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  /**
   * Get product by ID (Cache-Aside pattern)
   */
  async getProductById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id || typeof id !== 'string' || id.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Product ID is required and must be a valid UUID',
        });
        return;
      }

      const product = await this.productService.getProductById(id);

      if (!product) {
        res.status(404).json({ success: false, error: 'Product not found' });
        return;
      }

      res.json({ success: true, data: product });
    } catch (error) {
      console.error('Error getting product:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  /**
   * Create product
   */
  async createProduct(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = validateCreateProduct(req.body);

      if (error) {
        const details = error.details.map((e: any) => e.message);
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details,
        });
        return;
      }

      const { name, description, price, stock, sku, categoryId } = value;

      const product = await this.productService.createProduct({
        name,
        description: description || undefined,
        price,
        stock,
        sku: sku || undefined,
        categoryId,
      });

      res.status(201).json({ success: true, data: product });
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  /**
   * Update product
   */
  async updateProduct(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id || typeof id !== 'string' || id.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Product ID is required',
        });
        return;
      }

      const { error, value } = validateUpdateProduct(req.body);

      if (error) {
        const details = error.details.map((e: any) => e.message);
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details,
        });
        return;
      }

      const { name, description, price, stock, sku, categoryId } = value;

      const updated = await this.productService.updateProduct(id, {
        ...(name && { name }),
        ...(description && { description }),
        ...(price && { price }),
        ...(stock !== undefined && { stock }),
        ...(sku && { sku }),
        ...(categoryId && { categoryId }),
      });

      if (!updated) {
        res.status(404).json({ success: false, error: 'Product not found' });
        return;
      }

      res.json({ success: true, data: updated });
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  /**
   * Delete product
   */
  async deleteProduct(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id || typeof id !== 'string' || id.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Product ID is required',
        });
        return;
      }

      const deleted = await this.productService.deleteProduct(id);

      if (!deleted) {
        res.status(404).json({ success: false, error: 'Product not found' });
        return;
      }

      res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }
}
