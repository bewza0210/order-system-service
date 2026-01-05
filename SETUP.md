# Order System Service

## Project Setup ✅

Project has been initialized with:
- ✅ Node.js & npm
- ✅ TypeScript configuration
- ✅ Express.js (HTTP server)
- ✅ TypeORM (Database ORM)
- ✅ Redis (Caching)
- ✅ RabbitMQ (Message Broker)

## Folder Structure

```
src/
├── config/          # Configuration files (Redis, RabbitMQ, Database)
├── entities/        # TypeORM entities (Product, Order)
├── routes/          # Express routes (products, orders)
├── services/        # Business logic (to be created)
├── controllers/     # Route handlers (to be created)
├── migrations/      # Database migrations (to be created)
└── index.ts         # Application entry point
```

## Environment Setup

1. Create `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your configuration:
   - Database credentials (PostgreSQL or MySQL)
   - Redis connection details
   - RabbitMQ URL

## Installation

```bash
npm install
```

## Running the Service

```bash
# Development mode
npm run dev

# Build TypeScript
npm run build

# Production mode
npm start
```

## Database Setup

PostgreSQL example:
```sql
CREATE DATABASE order_system;
```

Or MySQL example:
```sql
CREATE DATABASE order_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## Next Steps

1. ✅ Install dependencies: `npm install`
2. Create database and update `.env`
3. Start Redis and RabbitMQ services
4. Implement Product Service with Cache-Aside pattern
5. Implement Order Service with concurrency handling
6. Add request validation and error handling
7. Create unit and integration tests
8. Configure Docker for local development

## Architecture

```
Client
  ↓
API Server (Express)
  ↓
Redis (Cache + Atomic Operation)
  ↓
Publish Event
  ↓
Message Broker (RabbitMQ)
  ↓
Worker (Multiple Instances)
  ↓
Database (PostgreSQL/MySQL)
```

## Tech Stack
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL / MySQL
- **Cache**: Redis
- **Message Broker**: RabbitMQ
- **ORM**: TypeORM
- **Testing**: Jest + k6

---

For detailed requirements, see original README.md

