# Dashboard API

Example RESTful backend for a modern full-featured dashboard application. Demonstrates authentication, multi-tenant organizations, entity management with full CRUD, background job queues, a rule-based alert system, PDF report generation, and an admin panel.

Built with **Fastify 5 · TypeScript 5 · Drizzle ORM · PostgreSQL · Redis · BullMQ**.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [API Endpoints](#api-endpoints)
5. [Background Queues](#background-queues)
6. [Getting Started](#getting-started)
7. [Environment Variables](#environment-variables)
8. [Database Commands](#database-commands)
9. [Testing](#testing)
10. [Docker](#docker)

---

## Overview

This is an example dashboard backend that illustrates how to structure a production-ready API:

| Concern           | What the API provides                                                           |
| ----------------- | ------------------------------------------------------------------------------- |
| **Auth**          | JWT access + refresh tokens, password reset flow                                |
| **Users**         | Org-scoped user CRUD with role-based access control                             |
| **Organizations** | Multi-tenant organization accounts                                              |
| **Entities**      | Full CRUD with pagination, filtering, and external data normalization           |
| **Tasks**         | Workflow management with comments, attachments, and entity linking              |
| **Alerts**        | Rule-based alert inbox with in-app + email delivery and per-user subscriptions  |
| **Reports**       | Server-side PDF export via Puppeteer + Handlebars                               |
| **Admin**         | Platform-level management: all entities, background job history, provider cache |

---

## Tech Stack

| Layer          | Technology                                           |
| -------------- | ---------------------------------------------------- |
| Runtime        | Node.js 20 LTS                                       |
| Language       | TypeScript 5 (strict mode)                           |
| Framework      | Fastify 5                                            |
| ORM            | Drizzle ORM                                          |
| Database       | PostgreSQL 16                                        |
| Cache / Queues | Redis 7 + BullMQ                                     |
| Auth           | JWT (`@fastify/jwt`) — access + refresh tokens       |
| Validation     | TypeBox + AJV                                        |
| API Docs       | Swagger (`@fastify/swagger` + `@fastify/swagger-ui`) |
| PDF Generation | Puppeteer + Handlebars                               |
| Email          | Nodemailer                                           |
| Testing        | Jest                                                 |
| Linting        | ESLint + Prettier                                    |

---

## Project Structure

```
src/
├── app.ts                        # Entry point
├── server/
│   ├── server.ts                 # Fastify instance creation, startup, graceful shutdown
│   └── initializers/
│       ├── authentication.ts     # JWT + CORS registration
│       ├── documentation.ts      # Swagger registration
│       ├── plugins.ts            # Validation plugins
│       ├── repositories.ts       # DB repository decoration
│       └── routes.ts             # Route prefix registration
├── database/
│   ├── database.ts               # Drizzle + pg-pool connection
│   ├── schema.ts                 # Table + enum definitions
│   ├── seed.ts                   # Seed runner
│   ├── migrations/               # SQL migration files
│   └── seeders/                  # Per-table seeders
├── features/
│   ├── auth/                     # Login / logout / reset-password
│   ├── users/                    # User profile + admin CRUD
│   ├── organizations/            # Organization settings
│   ├── properties/               # Main entity CRUD
│   ├── signals/                  # Scoped events per entity
│   ├── conditions/               # Snapshots per entity
│   ├── tasks/                    # Tasks + comments + attachments
│   ├── alerts/                   # Alert inbox + subscriptions
│   ├── reports/                  # PDF generation + download
│   └── admin/                    # Platform admin endpoints
└── ingestion/
    ├── queue.ts                  # BullMQ queue + worker + scheduler
    └── */                        # Provider-specific service modules
```

---

## API Endpoints

All routes are prefixed `/api/v1`. Authentication is Bearer JWT unless noted.

### Auth

| Method | Path                           | Description                   |
| ------ | ------------------------------ | ----------------------------- |
| `POST` | `/auth/login`                  | Email + password → JWT tokens |
| `POST` | `/auth/logout`                 | Invalidate refresh token      |
| `POST` | `/auth/reset-password/forgot`  | Send password reset email     |
| `POST` | `/auth/reset-password/confirm` | Set new password from token   |

### Users

| Method   | Path         | Description              |
| -------- | ------------ | ------------------------ |
| `GET`    | `/users/me`  | Current user profile     |
| `PUT`    | `/users/me`  | Update own profile       |
| `GET`    | `/users`     | List org users (admin)   |
| `POST`   | `/users`     | Invite user (admin)      |
| `PUT`    | `/users/:id` | Update user (admin)      |
| `DELETE` | `/users/:id` | Soft-delete user (admin) |

### Organizations

| Method | Path                     | Description          |
| ------ | ------------------------ | -------------------- |
| `GET`  | `/organizations`         | Get own organization |
| `PUT`  | `/organizations`         | Update org settings  |
| `GET`  | `/organizations/members` | List org members     |

### Properties (Main Entities)

| Method   | Path                      | Description                    |
| -------- | ------------------------- | ------------------------------ |
| `GET`    | `/properties`             | List (paginated, filtered)     |
| `POST`   | `/properties`             | Create new entity              |
| `GET`    | `/properties/:id`         | Entity detail with summary     |
| `PUT`    | `/properties/:id`         | Update entity fields           |
| `DELETE` | `/properties/:id`         | Soft-delete                    |
| `POST`   | `/properties/:id/refresh` | Trigger on-demand data refresh |

### Tasks

| Method   | Path                          | Description                             |
| -------- | ----------------------------- | --------------------------------------- |
| `GET`    | `/tasks`                      | List tasks (filter by entity, status)   |
| `POST`   | `/tasks`                      | Create task                             |
| `GET`    | `/tasks/:id`                  | Task detail with comments + attachments |
| `PUT`    | `/tasks/:id`                  | Update task                             |
| `DELETE` | `/tasks/:id`                  | Soft-delete                             |
| `POST`   | `/tasks/:id/comments`         | Add comment                             |
| `PUT`    | `/tasks/:id/comments/:cid`    | Edit comment                            |
| `DELETE` | `/tasks/:id/comments/:cid`    | Delete comment                          |
| `POST`   | `/tasks/:id/attachments`      | Upload file attachment                  |
| `DELETE` | `/tasks/:id/attachments/:aid` | Remove attachment                       |

### Alerts

| Method | Path                    | Description                |
| ------ | ----------------------- | -------------------------- |
| `GET`  | `/alerts`               | List alerts (unread first) |
| `PUT`  | `/alerts/:id/read`      | Mark alert as read         |
| `PUT`  | `/alerts/:id/dismiss`   | Dismiss alert              |
| `PUT`  | `/alerts/read-all`      | Bulk mark all as read      |
| `GET`  | `/alerts/subscriptions` | Get subscription settings  |
| `PUT`  | `/alerts/subscriptions` | Update subscriptions       |

### Reports

| Method | Path                    | Description           |
| ------ | ----------------------- | --------------------- |
| `POST` | `/reports/owner-pack`   | Generate PDF report   |
| `GET`  | `/reports`              | Report history        |
| `GET`  | `/reports/:id/download` | Stream / download PDF |

### Admin

| Method   | Path                                | Description                           |
| -------- | ----------------------------------- | ------------------------------------- |
| `GET`    | `/admin/properties`                 | All entities across all organizations |
| `POST`   | `/admin/properties/:id/refresh-all` | Force full data re-fetch              |
| `GET`    | `/admin/ingestion-jobs`             | Background job run history            |
| `GET`    | `/admin/api-cache`                  | Cache statistics per provider         |
| `DELETE` | `/admin/api-cache/:provider`        | Purge provider cache                  |
| `POST`   | `/admin/provider-keys`              | Upsert external API provider keys     |

Interactive API docs available at `/documentation` when running in development.

---

## Background Queues

Powered by **BullMQ** over Redis. Queues are initialized on server startup and run on configurable schedules. Each run fetches data from configured external providers, normalizes payloads, upserts records, evaluates alert rules, and logs a job history entry.

---

## Getting Started

### Prerequisites

- Node.js 20 LTS
- pnpm
- PostgreSQL 16
- Redis 7

### Install & Run (local)

```bash
# Install dependencies
pnpm install

# Copy env and fill in values
cp .env.example .env

# Apply database migrations
pnpm db:migrate

# Start development server (nodemon + ts-node)
pnpm dev

# Production build
pnpm build
pnpm start
```

### Run with Docker

```bash
# Start all services (API + PostgreSQL + Redis)
docker compose up --build

# Start only infrastructure for local dev
docker compose up postgres redis
```

Services after `docker compose up`:

| Service    | URL                                 |
| ---------- | ----------------------------------- |
| API        | http://localhost:3001               |
| Swagger UI | http://localhost:3001/documentation |
| PostgreSQL | localhost:5435                      |
| Redis      | localhost:6379                      |

---

## Environment Variables

See `.env.example` for the full reference. Key variables:

```dotenv
# Server
PORT=3001
NODE_ENV=development
API_VERSION=v1

# Database
DB_HOST=localhost
DB_PORT=5435
DB_NAME=dashboard
DB_USER=dashboard
DB_PASSWORD=secret

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-jwt-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@dashboard.com
SMTP_PASS=your-smtp-password
EMAIL_FROM=Dashboard <noreply@dashboard.com>

# Storage (AWS S3 — PDF reports + attachments)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret
S3_BUCKET_NAME=dashboard-reports

# Frontend (CORS + email links)
CORS_ORIGINS=http://localhost:3001,http://localhost:3002,http://localhost:3003
```

---

## Database Commands

```bash
# Generate a new migration
pnpm db:create-migration <migration-name>

# Apply pending migrations
pnpm db:migrate

# Open Drizzle Studio (visual browser)
pnpm db:studio
```

---

## Testing

```bash
# Run all tests
pnpm test

# With coverage report
pnpm test:coverage

# Watch mode
pnpm test:watch
```

Tests use **Jest** with `ts-node` transformation. Configuration lives in `jest.config.mjs`.

---

## Docker

The `docker-compose.yml` runs PostgreSQL and Redis alongside the API container. For local development, it is common to run only the infrastructure services (`postgres` and `redis`) with Docker while running the API directly on the host for faster hot-reload.

## License

MIT
