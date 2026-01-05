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

This project is intentionally small, pragmatic, and built with technologies that are easy to iterate with for a side project. Below is a quick reference of the main technologies and why they were chosen.

- **Backend:** Express.js + TypeScript — lightweight, well-known, and type-safe for faster development.
- **Database:** PostgreSQL (configurable) — reliable relational DB for transactional integrity.
- **ORM:** TypeORM — Developer-friendly ORM integrated with TypeScript entities.
- **Cache:** Redis — in-memory cache for fast reads and atomic operations (locks and TTLs).
- **Message Broker:** RabbitMQ — reliable message delivery and decoupled async processing.
- **Validation:** Joi — declarative request validation with helpful error messages.
- **Testing:** Jest (unit) + optional k6 (load testing) — correctness and concurrency testing.
- **Docs:** Swagger (swagger-ui-express + swagger-jsdoc) — interactive API docs at `/api-docs`.
- **Containerization (optional):** Docker & Docker Compose — for easy local infra setup.
- **CI/CD:** GitHub Actions — run tests and build on every push.

Why this stack for a side project:

- Familiar tooling (Express, TypeScript) keeps iteration velocity high.
- Redis + RabbitMQ let you prototype real-world concurrency and event-driven patterns without heavy ops.
- TypeORM keeps entity definitions compact and easy to evolve as the data model changes.


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
