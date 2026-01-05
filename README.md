# Order System Service

> A concurrent order management system demonstrating race condition handling, Redis caching, and event-driven architecture patterns.

## 📌 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Service](#running-the-service)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Development](#development)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Overview

This project is designed to practice solving **concurrency problems in real backend systems** using:
- **Redis** for caching and atomic operations
- **Message Broker (RabbitMQ)** for asynchronous processing
- **Event-Driven Architecture** for scalability

It simulates a high-traffic scenario where multiple users purchase products simultaneously (Flash Sale), ensuring data consistency and preventing race conditions.

### Key Constraints

- ✅ Products must never be oversold beyond available stock
- ✅ Orders must never be created as duplicates
- ✅ System must handle concurrent requests efficiently
- ✅ Eventual consistency is maintained across all components

## Features

### Product Management
- Retrieve product information (id, name, price, stock)
- Redis caching with **Cache-Aside Pattern**
  - Cache hit → return from Redis
  - Cache miss → query database → populate cache
- Product category support

### Order Creation
- Create orders with concurrent request handling
- Stock reservation with atomic operations
- Duplicate order prevention
- Transaction integrity

### Event Publishing
- Asynchronous order processing via RabbitMQ
- Event-driven architecture prevents direct database writes
- Multiple worker instances for scalability
- Event logging and audit trail

## Tech Stack

| Component | Technology |
|-----------|-----------|
| **Backend** | Express.js + TypeScript |
| **Database** | PostgreSQL |
| **Cache** | Redis |
| **Message Broker** | RabbitMQ |
| **ORM** | TypeORM |
| **Testing** | Jest + k6 |
| **Container** | Docker (optional) |
| **CI/CD** | GitHub Actions |

## Architecture

```
Client
  ↓
API Server (Express.js)
  ↓
Redis (Cache + Atomic Operations)
  ↓ [Publish Event]
Message Broker (RabbitMQ)
  ↓
Worker Processes (Multiple Instances)
  ↓
Database (PostgreSQL/MySQL)
```

## Installation

### 1. Clone Repository

```bash
git clone <repository-url>
cd order-system-service
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Infrastructure Services

Using Docker Compose (recommended):

```bash
docker-compose up -d
```

Or manually start:
- PostgreSQL on port `5432`
- Redis on port `6379`
- RabbitMQ on port `5672`
