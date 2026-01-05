import 'dotenv/config';
import { AppDataSource, initializeDatabase } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { ProductCategory, User, Product } from '../entities';

async function seed() {
  try {
    console.log('🌱 Starting database seeding...');

    await initializeDatabase();
    console.log('✅ Database initialized');

    const categoryRepository = AppDataSource.getRepository(ProductCategory);
    const userRepository = AppDataSource.getRepository(User);
    const productRepository = AppDataSource.getRepository(Product);

    // 1. Create categories
    console.log('\n📂 Creating product categories...');
    const categories = await categoryRepository.save([
      categoryRepository.create({
        id: uuidv4(),
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic devices and gadgets',
      }),
      categoryRepository.create({
        id: uuidv4(),
        name: 'Computers',
        slug: 'computers',
        description: 'Laptops, desktops, and accessories',
      }),
      categoryRepository.create({
        id: uuidv4(),
        name: 'Mobile Devices',
        slug: 'mobile-devices',
        description: 'Smartphones and tablets',
      }),
      categoryRepository.create({
        id: uuidv4(),
        name: 'Accessories',
        slug: 'accessories',
        description: 'Tech accessories',
      }),
    ]);
    console.log(`✅ Created ${categories.length} categories`);

    // 2. Create users
    console.log('\n👥 Creating sample users...');
    const users = await userRepository.save([
      userRepository.create({
        id: uuidv4(),
        email: 'john@example.com',
        name: 'John Doe',
        username: 'johndoe',
        address: '123 Main St, City, Country',
        phone: '+1234567890',
        isActive: true,
      }),
      userRepository.create({
        id: uuidv4(),
        email: 'jane@example.com',
        name: 'Jane Smith',
        username: 'janesmith',
        address: '456 Oak Ave, City, Country',
        phone: '+0987654321',
        isActive: true,
      }),
      userRepository.create({
        id: uuidv4(),
        email: 'bob@example.com',
        name: 'Bob Wilson',
        username: 'bobwilson',
        address: '789 Pine Rd, City, Country',
        phone: '+1122334455',
        isActive: true,
      }),
    ]);
    console.log(`✅ Created ${users.length} users`);

    // 3. Create products
    console.log('\n📦 Creating sample products...');
    const products = await productRepository.save([
      // Computers
      productRepository.create({
        id: uuidv4(),
        categoryId: categories[1].id,
        name: 'MacBook Pro 16"',
        description: 'Powerful laptop for professionals',
        sku: 'MBPRO-16-2023',
        price: 2499.99,
        stock: 20,
        reservedStock: 0,
        isActive: true,
      }),
      productRepository.create({
        id: uuidv4(),
        categoryId: categories[1].id,
        name: 'Dell XPS 13',
        description: 'Ultra-portable laptop',
        sku: 'DELL-XPS-13',
        price: 1299.99,
        stock: 30,
        reservedStock: 0,
        isActive: true,
      }),
      productRepository.create({
        id: uuidv4(),
        categoryId: categories[1].id,
        name: 'ASUS ROG Gaming Laptop',
        description: 'High-performance gaming laptop',
        sku: 'ASUS-ROG-G16',
        price: 1899.99,
        stock: 15,
        reservedStock: 0,
        isActive: true,
      }),

      // Mobile Devices
      productRepository.create({
        id: uuidv4(),
        categoryId: categories[2].id,
        name: 'iPhone 15 Pro',
        description: 'Latest iPhone flagship',
        sku: 'IPHONE-15-PRO',
        price: 999.99,
        stock: 50,
        reservedStock: 0,
        isActive: true,
      }),
      productRepository.create({
        id: uuidv4(),
        categoryId: categories[2].id,
        name: 'Samsung Galaxy S24',
        description: 'Android flagship smartphone',
        sku: 'GALAXY-S24',
        price: 899.99,
        stock: 45,
        reservedStock: 0,
        isActive: true,
      }),
      productRepository.create({
        id: uuidv4(),
        categoryId: categories[2].id,
        name: 'iPad Air',
        description: 'Powerful tablet device',
        sku: 'IPAD-AIR-2024',
        price: 599.99,
        stock: 25,
        reservedStock: 0,
        isActive: true,
      }),

      // Accessories
      productRepository.create({
        id: uuidv4(),
        categoryId: categories[3].id,
        name: 'USB-C Cable 2m',
        description: 'High-quality USB-C cable',
        sku: 'CABLE-USB-C-2M',
        price: 19.99,
        stock: 200,
        reservedStock: 0,
        isActive: true,
      }),
      productRepository.create({
        id: uuidv4(),
        categoryId: categories[3].id,
        name: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse',
        sku: 'MOUSE-WIRELESS',
        price: 49.99,
        stock: 100,
        reservedStock: 0,
        isActive: true,
      }),
      productRepository.create({
        id: uuidv4(),
        categoryId: categories[3].id,
        name: 'Mechanical Keyboard',
        description: 'RGB mechanical keyboard',
        sku: 'KEYBOARD-RGB',
        price: 129.99,
        stock: 60,
        reservedStock: 0,
        isActive: true,
      }),

      // Electronics
      productRepository.create({
        id: uuidv4(),
        categoryId: categories[0].id,
        name: 'Monitor 4K 27"',
        description: 'Ultra HD display monitor',
        sku: 'MONITOR-4K-27',
        price: 449.99,
        stock: 35,
        reservedStock: 0,
        isActive: true,
      }),
    ]);
    console.log(`✅ Created ${products.length} products`);

    console.log('\n✨ Database seeding completed successfully!');
    console.log(`
📊 Summary:
   - Categories: ${categories.length}
   - Users: ${users.length}
   - Products: ${products.length}

🧪 Ready for testing!
Try creating an order with one of these products.
    `);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
